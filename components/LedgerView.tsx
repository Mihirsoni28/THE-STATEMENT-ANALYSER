import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { ArrowDownRight, ArrowUpRight, Filter, Download } from 'lucide-react';

interface LedgerViewProps {
  transactions: Transaction[];
}

export const LedgerView: React.FC<LedgerViewProps> = ({ transactions }) => {
  
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Balance'];
    const csvContent = [
      headers.join(','),
      ...sortedTransactions.map(t => 
        [t.date, `"${t.description.replace(/"/g, '""')}"`, t.category, t.type, t.amount, t.balance || ''].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'acculedger_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500">No transactions to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h3 className="text-xl font-bold text-slate-800">General Ledger</h3>
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Date</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Description</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Category</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Debit</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Credit</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-sm text-slate-600 whitespace-nowrap">{tx.date}</td>
                <td className="p-4 text-sm font-medium text-slate-800">{tx.description}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                    {tx.category}
                  </span>
                </td>
                <td className="p-4 text-sm text-right text-red-600 font-mono">
                  {tx.type === 'debit' ? (
                    <span className="flex items-center justify-end gap-1">
                      {tx.amount.toFixed(2)}
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  ) : '-'}
                </td>
                <td className="p-4 text-sm text-right text-emerald-600 font-mono">
                  {tx.type === 'credit' ? (
                     <span className="flex items-center justify-end gap-1">
                     {tx.amount.toFixed(2)}
                     <ArrowDownRight className="w-3 h-3" />
                   </span>
                  ) : '-'}
                </td>
                <td className="p-4 text-sm text-right text-slate-600 font-mono font-medium">
                  {tx.balance ? tx.balance.toFixed(2) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
