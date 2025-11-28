import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Search, Loader2, Sparkles, Globe, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, AIConfig } from '../types';
import { streamChatResponse } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

interface ChatWidgetProps {
  aiConfig: AIConfig;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ aiConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', content: "Hello! I'm your AI accounting assistant. How can I help you analyze your data or answer financial questions today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Reset search if provider changes to OpenAI (since we disable it)
  useEffect(() => {
    if (aiConfig.provider === 'openai') {
      setUseSearch(false);
    }
  }, [aiConfig.provider]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a placeholder for the AI response
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'model', content: '' }]);

      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const stream = streamChatResponse(history, userMsg.content, useSearch, aiConfig);
      
      let fullText = '';
      let sources: { uri: string; title: string }[] = [];

      for await (const chunk of stream) {
         const c = chunk as GenerateContentResponse;
         if (c.text) {
             fullText += c.text;
             
             // Check for grounding metadata chunks for sources (when using Search)
             if (useSearch && c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                 c.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
                     if (chunk.web?.uri) {
                         sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
                     }
                 });
             }
             
             setMessages(prev => 
               prev.map(m => m.id === aiMsgId ? { ...m, content: fullText, sources: sources.length > 0 ? sources : undefined } : m)
             );
         }
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: `Error: ${error.message || "An unexpected error occurred."}`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-all z-50 hover:scale-105 ${
            isOpen ? 'bg-red-500 rotate-90' : 'bg-indigo-600'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 z-40 overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AccuAssistant</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                   Online • {aiConfig.provider === 'openai' ? 'OpenAI' : 'Gemini'}
                </p>
              </div>
            </div>
            {/* Search Toggle */}
            <button 
                onClick={() => setUseSearch(!useSearch)}
                disabled={aiConfig.provider === 'openai'}
                className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                  aiConfig.provider === 'openai' ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500' :
                  useSearch ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                title={aiConfig.provider === 'openai' ? "Web Search unavailable with OpenAI" : (useSearch ? "Search enabled" : "Search disabled")}
            >
                <Globe className="w-3 h-3" />
                {useSearch ? 'Web' : 'Chat'}
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                } ${msg.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}`}>
                  <div className="prose prose-sm max-w-none prose-p:my-0 prose-ul:my-1 prose-li:my-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {/* Sources Display */}
                  {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Search className="w-3 h-3"/> Sources</p>
                          <div className="flex flex-wrap gap-1">
                              {/* Deduplicate sources based on uri */}
                              {Array.from(new Set(msg.sources.map(s => s.uri))).map(uri => {
                                  const source = msg.sources?.find(s => s.uri === uri);
                                  return (
                                    <a 
                                        key={uri} 
                                        href={uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block text-xs bg-slate-100 text-indigo-600 px-2 py-1 rounded hover:bg-slate-200 truncate max-w-full"
                                    >
                                        {source?.title || 'Web Result'}
                                    </a>
                                  )
                              })}
                          </div>
                      </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className="text-xs text-slate-500">Thinking...</span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
             {useSearch && (
                 <div className="mb-2 text-xs text-indigo-600 flex items-center gap-1 bg-indigo-50 p-1.5 rounded">
                     <Sparkles className="w-3 h-3" />
                     <span>Using Google Search Grounding</span>
                 </div>
             )}
             {aiConfig.provider === 'openai' && (
                 <div className="mb-2 text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                     <span>Powered by OpenAI</span>
                 </div>
             )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={useSearch ? "Ask a question about current rates..." : "Ask about your data..."}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
