import { Transaction } from './types';

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2023-10-01', description: 'Opening Balance', category: 'Balance', type: 'credit', amount: 5000, balance: 5000 },
  { id: '2', date: '2023-10-02', description: 'Office Supplies - Staples', category: 'Office Expenses', type: 'debit', amount: 120.50, balance: 4879.50 },
  { id: '3', date: '2023-10-05', description: 'Client Payment - ACME Corp', category: 'Revenue', type: 'credit', amount: 2500.00, balance: 7379.50 },
  { id: '4', date: '2023-10-10', description: 'Monthly Software Subscription', category: 'Software', type: 'debit', amount: 49.99, balance: 7329.51 },
];

export const SYSTEM_INSTRUCTION_PARSER = `
You are an expert accountant AI. Your task is to extract structured financial transaction data from raw bank statement text.
Analyze the provided text and output a JSON object containing an array of transactions.
For each transaction, determine:
- date (YYYY-MM-DD format)
- description (formatted according to specific instructions provided in the prompt)
- category (classify the expense/income, e.g., "Office Expenses", "Revenue", "Utilities", "Travel", "Transfers")
- type ("debit" or "credit")
- amount (positive number)
- balance (if available, otherwise estimate or leave null)

Ensure precision. If a line item is ambiguous, try to infer from context. Ignore page headers/footers.
When consolidating names for specific materiality rules, ensure you identify the person correctly from the raw description string.
`;

export const SYSTEM_INSTRUCTION_CHAT = `
You are a helpful and knowledgeable Senior Accountant Assistant. 
You help users understand their financial data, explain accounting principles (GAAP/IFRS), and provide business advice.
When asked about specific recent tax laws or financial news, use your search tools.
Always be professional, concise, and accurate.
`;