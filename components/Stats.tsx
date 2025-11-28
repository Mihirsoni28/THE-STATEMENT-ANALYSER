import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface StatsProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Stats: React.FC<StatsProps> = ({ transactions }) => {
  
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const catMap = new Map<string, number>();

    transactions.forEach(t => {
      if (t.type === 'credit') {
        income += t.amount;
      } else {
        expenses += t.amount;
        catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
      }
    });

    const categoryData = Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories

    return { income, expenses, net: income - expenses, categoryData };
  }, [transactions]);

  const monthlyData = useMemo(() => {
    // Basic aggregation by date (simplified)
    const data: any[] = [];
    transactions.forEach(t => {
        // Just for demo, assuming relatively close dates.
        const d = t.date.substring(5); // MM-DD
        data.push({
            name: d,
            amount: t.type === 'credit' ? t.amount : -t.amount
        })
    })
    // Sort by date
    return data.sort((a,b) => a.name.localeCompare(b.name)).slice(-10); // Last 10 txs
  }, [transactions]);

  if (transactions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Summary Cards */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Income</h4>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">${stats.income.toFixed(2)}</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
             <div className="flex justify-between items-center">
                 <span className="text-sm text-slate-500">Expenses</span>
                 <span className="text-sm font-semibold text-red-500">${stats.expenses.toFixed(2)}</span>
             </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
         <div>
          <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Net Balance</h4>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${stats.net >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                ${stats.net.toFixed(2)}
            </span>
            <Wallet className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
             <div className="flex justify-between items-center">
                 <span className="text-sm text-slate-500">Transaction Count</span>
                 <span className="text-sm font-semibold text-slate-800">{transactions.length}</span>
             </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:row-span-2">
         <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Top Expenses</h4>
         <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
         </div>
         <div className="space-y-3 mt-2">
            {stats.categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-slate-600 truncate max-w-[120px]">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">${cat.value.toFixed(2)}</span>
                </div>
            ))}
         </div>
      </div>

        {/* Cash Flow Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-2">
         <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Recent Cash Flow</h4>
         <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={monthlyData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                 <Tooltip cursor={{fill: '#f8fafc'}} />
                 <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};
