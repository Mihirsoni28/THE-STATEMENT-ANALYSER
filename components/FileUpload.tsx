import React, { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, ArrowRight, Settings } from 'lucide-react';

interface FileUploadProps {
  onProcess: (text: string, materiality: number) => Promise<void>;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onProcess, isProcessing }) => {
  const [textInput, setTextInput] = useState('');
  const [materiality, setMateriality] = useState<number>(5000);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setTextInput(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (textInput.trim()) {
      onProcess(textInput, materiality);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-6 h-6 text-indigo-600" />
            Import Bank Statement
          </h2>
          <p className="text-slate-600 mt-2">
            Upload a CSV/Text file or paste your raw bank statement text below. AI will categorize and structure it for you.
          </p>
        </div>

        <div className="p-8 space-y-6">
          
          {/* Settings Section */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
             <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <label className="text-sm font-semibold text-indigo-900">Accounting Settings</label>
             </div>
             <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                 <div className="flex-1">
                    <p className="text-xs text-indigo-700 mb-1">Materiality Threshold</p>
                    <p className="text-xs text-indigo-600 opacity-80">Aggregate amounts above this value will be named explicitly (e.g., "Person X").</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-indigo-700">Value:</span>
                    <input 
                      type="number" 
                      value={materiality} 
                      onChange={(e) => setMateriality(Number(e.target.value))}
                      className="w-32 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-indigo-900 bg-white"
                      min="0"
                    />
                 </div>
             </div>
          </div>

          {/* Drag & Drop Zone */}
          <div 
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 text-center ${
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept=".csv,.txt,.json"
            />
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-500 mt-1">CSV, TXT, or raw text files</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">OR PASTE TEXT</span>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            className="w-full h-64 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-sm resize-none"
            placeholder="Paste your bank statement raw text here (e.g., date, description, amount columns)..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !textInput.trim()}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white transition-all
                ${isProcessing || !textInput.trim() ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200'}
              `}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Statement...
                </>
              ) : (
                <>
                  Generate Ledger
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};