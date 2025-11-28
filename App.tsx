import React, { useState } from 'react';
import { Transaction, AppView, AIConfig } from './types';
import { FileUpload } from './components/FileUpload';
import { LedgerView } from './components/LedgerView';
import { Stats } from './components/Stats';
import { ChatWidget } from './components/ChatWidget';
import { parseBankStatement } from './services/geminiService';
import { LayoutDashboard, FileSpreadsheet, RefreshCcw, Landmark, Settings, CheckCircle, ShieldCheck } from 'lucide-react';
import { SAMPLE_TRANSACTIONS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasData, setHasData] = useState(false);
  
  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: 'gemini' });

  const handleProcess = async (text: string, materiality: number) => {
    setIsProcessing(true);
    try {
      const parsedTransactions = await parseBankStatement(text, materiality, aiConfig);
      setTransactions(parsedTransactions);
      setHasData(true);
      setView(AppView.DASHBOARD);
    } catch (error: any) {
      alert(`Failed to parse the bank statement.\nError: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSampleData = () => {
      setTransactions(SAMPLE_TRANSACTIONS);
      setHasData(true);
      setView(AppView.DASHBOARD);
  }

  // Sidebar navigation item
  const NavItem = ({ active, icon: Icon, label, onClick }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
        active 
          ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2 border-b border-slate-100">
           <div className="bg-indigo-600 p-2 rounded-lg">
             <Landmark className="w-6 h-6 text-white" />
           </div>
           <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">
             AccuLedger
           </span>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <NavItem 
            active={view === AppView.DASHBOARD} 
            icon={LayoutDashboard} 
            label="Dashboard" 
            onClick={() => setView(AppView.DASHBOARD)} 
          />
          <NavItem 
            active={view === AppView.UPLOAD} 
            icon={RefreshCcw} 
            label="Import Data" 
            onClick={() => setView(AppView.UPLOAD)} 
          />
          <NavItem 
            active={view === AppView.LEDGER} 
            icon={FileSpreadsheet} 
            label="General Ledger" 
            onClick={() => setView(AppView.LEDGER)} 
          />
        </nav>
        
        <div className="p-4 border-t border-slate-100">
             <NavItem 
                active={view === AppView.SETTINGS} 
                icon={Settings} 
                label="AI Settings" 
                onClick={() => setView(AppView.SETTINGS)} 
            />
        </div>

        <div className="p-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-2">PRO TIP</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                    Upload a raw PDF copy-paste to instantly categorize your monthly expenses.
                </p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
           <div className="flex items-center gap-2">
             <Landmark className="w-6 h-6 text-indigo-600" />
             <span className="font-bold text-slate-800">AccuLedger</span>
           </div>
           <button onClick={() => setView(AppView.UPLOAD)} className="text-sm font-medium text-indigo-600">Import</button>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            
            {/* Header Area */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {view === AppView.DASHBOARD ? 'Financial Overview' : 
                     view === AppView.UPLOAD ? 'Import Transactions' : 
                     view === AppView.LEDGER ? 'Transaction Ledger' : 'Settings'}
                  </h1>
                  <p className="text-slate-500 mt-1">
                    {view === AppView.DASHBOARD ? 'Track your income, expenses, and account health.' : 
                     view === AppView.UPLOAD ? 'Parse bank statements with AI precision.' : 
                     view === AppView.LEDGER ? 'Detailed view of all processed records.' : 'Configure your AI provider preferences.'}
                  </p>
               </div>
               
               {/* Global Actions */}
               {view === AppView.DASHBOARD && !hasData && (
                  <button onClick={loadSampleData} className="text-sm text-indigo-600 hover:underline">
                      Load Sample Data
                  </button>
               )}
            </header>

            {/* Content Views */}
            {view === AppView.UPLOAD && (
              <div className="flex-1 flex items-center justify-center">
                <FileUpload onProcess={handleProcess} isProcessing={isProcessing} />
              </div>
            )}

            {view === AppView.SETTINGS && (
                <div className="max-w-2xl">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">AI Provider Configuration</h2>
                            <p className="text-sm text-slate-500 mt-1">Select which AI service powers your accounting assistant.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Gemini Option */}
                            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${aiConfig.provider === 'gemini' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name="provider" 
                                        value="gemini"
                                        checked={aiConfig.provider === 'gemini'}
                                        onChange={() => setAiConfig({ ...aiConfig, provider: 'gemini' })}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900">Google Gemini (Default)</span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">FREE</span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">Uses the built-in Gemini API key. Recommended for most users.</p>
                                    </div>
                                    <ShieldCheck className={`w-6 h-6 ${aiConfig.provider === 'gemini' ? 'text-indigo-600' : 'text-slate-300'}`} />
                                </div>
                            </label>

                            {/* OpenAI Option */}
                            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${aiConfig.provider === 'openai' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                <div className="flex items-start gap-3">
                                    <input 
                                        type="radio" 
                                        name="provider" 
                                        value="openai"
                                        checked={aiConfig.provider === 'openai'}
                                        onChange={() => setAiConfig({ ...aiConfig, provider: 'openai' })}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900">OpenAI (GPT-4o)</span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">BYO KEY</span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">Use your own OpenAI API key. Useful if you prefer GPT-4o reasoning.</p>
                                        
                                        {aiConfig.provider === 'openai' && (
                                            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                                <label className="block text-xs font-medium text-slate-700 mb-1">OpenAI API Key</label>
                                                <input 
                                                    type="password"
                                                    value={aiConfig.apiKey || ''}
                                                    onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                                                    placeholder="sk-..."
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                                                />
                                                <p className="text-xs text-slate-400 mt-1">Your key is processed locally and never stored on our servers.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${aiConfig.provider === 'openai' ? 'border-indigo-600 text-indigo-600' : 'border-slate-300 text-transparent'}`}>
                                        <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                                    </div>
                                </div>
                            </label>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setView(AppView.DASHBOARD)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                                Save & Return
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === AppView.DASHBOARD && (
              <div className="space-y-6">
                {!hasData ? (
                   <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <RefreshCcw className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700">No Data Available</h3>
                      <p className="text-slate-500 max-w-md text-center mt-2 mb-6">
                          Import a bank statement or load sample data to see your financial analytics here.
                      </p>
                      <div className="flex gap-3">
                         <button onClick={loadSampleData} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                             Load Sample
                         </button>
                         <button onClick={() => setView(AppView.UPLOAD)} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                             Import Statement
                         </button>
                      </div>
                   </div>
                ) : (
                  <>
                    <Stats transactions={transactions} />
                    <div className="h-[400px]">
                       <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Transactions</h3>
                       <LedgerView transactions={transactions.slice(0, 5)} />
                       <div className="mt-4 text-center">
                          <button onClick={() => setView(AppView.LEDGER)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                              View All Transactions
                          </button>
                       </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {view === AppView.LEDGER && (
              <div className="flex-1 h-full min-h-[500px]">
                 <LedgerView transactions={transactions} />
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Floating Chat Widget */}
      <ChatWidget aiConfig={aiConfig} />
    </div>
  );
};

export default App;
