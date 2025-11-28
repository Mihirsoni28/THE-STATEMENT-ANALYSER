import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION_PARSER, SYSTEM_INSTRUCTION_CHAT } from '../constants';
import { Transaction, AIConfig } from '../types';

// Singleton instance management for Gemini
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

// --- OpenAI Implementation ---

const callOpenAIParse = async (text: string, materiality: number, apiKey: string): Promise<Transaction[]> => {
  const prompt = `
  ${SYSTEM_INSTRUCTION_PARSER}
  
  Parse the following bank statement data into structured JSON.
  
  CONFIGURATION:
  - Materiality Threshold: ${materiality}
  
  INSTRUCTIONS:
  1. Extract all transactions with date, description, category, type, and amount.
  2. **AGGREGATION RULE**: 
     - Identify all "Transfer In" and "Transfer Out" transactions (including UPI, NEFT, IMPS, etc.).
     - Extract the unique Person/Entity name from the description for each transfer.
     - Mentally calculate the **TOTAL AGGREGATE AMOUNT** (sum of all debits and credits) involved for each unique Person across the entire provided text.
  3. **NAMING RULE**:
     - IF the calculated **Total Aggregate Amount** for a Person is **GREATER THAN ${materiality}**:
       - AND the transaction is a UPI or Transfer transaction:
       - THEN you MUST set the 'description' field to exactly: "Person [Name]" (where [Name] is the extracted name of that person).
     - ELSE (if total is below materiality OR not a transfer):
       - Use the original description or a cleaned summary.

  Output strictly valid JSON with this schema:
  {
    "transactions": [
      {
        "date": "YYYY-MM-DD",
        "description": "string",
        "category": "string",
        "type": "debit" | "credit",
        "amount": number,
        "balance": number | null
      }
    ]
  }

  DATA TO PARSE:
  ${text}
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful accounting assistant. Output strictly JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenAI API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content);
  
  return parsed.transactions.map((t: any, index: number) => ({
    ...t,
    id: `parsed-oa-${Date.now()}-${index}`
  }));
};

async function* callOpenAIChatStream(
  history: { role: 'user' | 'model'; content: string }[],
  newMessage: string,
  apiKey: string
) {
  const messages = [
    { role: "system", content: SYSTEM_INSTRUCTION_CHAT },
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content })),
    { role: "user", content: newMessage }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messages,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices[0]?.delta?.content;
          if (content) {
            // Mimic the structure of Gemini response for compatibility
            yield { text: content } as unknown as GenerateContentResponse;
          }
        } catch (e) {
          // ignore parse errors for partial chunks
        }
      }
    }
  }
}

// --- Main Exported Functions ---

export const parseBankStatement = async (text: string, materiality: number, config: AIConfig): Promise<Transaction[]> => {
  if (config.provider === 'openai') {
    if (!config.apiKey) throw new Error("OpenAI API Key is required");
    return callOpenAIParse(text, materiality, config.apiKey);
  }

  // Default: Google Gemini
  const ai = getAI();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      transactions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['debit', 'credit'] },
            amount: { type: Type.NUMBER },
            balance: { type: Type.NUMBER, nullable: true },
          },
          required: ['date', 'description', 'category', 'type', 'amount'],
        },
      },
    },
    required: ['transactions'],
  };

  const prompt = `
Parse this bank statement data into structured JSON.

CONFIGURATION:
- Materiality Threshold: ${materiality}

INSTRUCTIONS:
1. Extract all transactions with date, description, category, type, and amount.
2. **AGGREGATION RULE**: 
   - Identify all "Transfer In" and "Transfer Out" transactions (including UPI, NEFT, IMPS, etc.).
   - Extract the unique Person/Entity name from the description for each transfer.
   - Mentally calculate the **TOTAL AGGREGATE AMOUNT** (sum of all debits and credits) involved for each unique Person across the entire provided text.
3. **NAMING RULE**:
   - IF the calculated **Total Aggregate Amount** for a Person is **GREATER THAN ${materiality}**:
     - AND the transaction is a UPI or Transfer transaction:
     - THEN you MUST set the 'description' field to exactly: "Person [Name]" (where [Name] is the extracted name of that person).
   - ELSE (if total is below materiality OR not a transfer):
     - Use the original description or a cleaned summary.

DATA TO PARSE:
${text}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PARSER,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (response.text) {
      // Clean up potential markdown blocks if the model ignores the MIME type instruction
      let cleanJson = response.text.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanJson);
      // Add IDs if missing
      return parsed.transactions.map((t: any, index: number) => ({
        ...t,
        id: `parsed-${Date.now()}-${index}`
      }));
    }
    return [];
  } catch (error) {
    console.error("Error parsing bank statement:", error);
    throw error;
  }
};

export const streamChatResponse = async function* (
  history: { role: 'user' | 'model'; content: string }[],
  newMessage: string,
  useSearch: boolean = false,
  config: AIConfig
) {
  if (config.provider === 'openai') {
    if (!config.apiKey) throw new Error("OpenAI API Key is required");
    // OpenAI doesn't natively support the Google Search tool in the same way.
    // We will proceed with standard chat.
    yield* callOpenAIChatStream(history, newMessage, config.apiKey);
    return;
  }

  // Default: Google Gemini
  const ai = getAI();
  
  // Use gemini-3-pro-preview for complex reasoning chat as requested,
  // unless we specifically need search, then use gemini-2.5-flash with tools.
  const modelName = useSearch ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
  
  const tools = useSearch ? [{ googleSearch: {} }] : undefined;

  const chat = ai.chats.create({
    model: modelName,
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }],
    })),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_CHAT,
      tools: tools,
    },
  });

  try {
    const resultStream = await chat.sendMessageStream({ message: newMessage });
    
    for await (const chunk of resultStream) {
       yield chunk;
    }
  } catch (error) {
    console.error("Chat stream error:", error);
    throw error;
  }
};
