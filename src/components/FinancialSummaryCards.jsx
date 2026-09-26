import React from 'react';
import { TrendingUp, TrendingDown, Scale, Layers } from 'lucide-react';
import { formatINR } from '../utils/currency';

export default function FinancialSummaryCards({
  incomeEntries = [],
  expenseEntries = []
}) {
  const totalIncome = incomeEntries.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpense = expenseEntries.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netBalance = totalIncome - totalExpense;
  const totalEntriesCount = incomeEntries.length + expenseEntries.length;

  let balanceStatus = 'Break Even';
  let statusBadgeClass = 'bg-gray-100 text-gray-700 border-gray-300';
  let balanceCardTheme = 'border-[#E7E9E7] bg-white';
  let balanceTextTheme = 'text-[#161B18]';

  if (netBalance > 0) {
    balanceStatus = 'Positive Balance';
    statusBadgeClass = 'bg-[#EBF5EE] text-[#1F3D2B] border-[#1F3D2B]/20';
    balanceCardTheme = 'border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white';
    balanceTextTheme = 'text-[#1F3D2B]';
  } else if (netBalance < 0) {
    balanceStatus = 'Negative Balance';
    statusBadgeClass = 'bg-red-50 text-red-700 border-red-200';
    balanceCardTheme = 'border-red-200 bg-gradient-to-br from-red-50/40 to-white';
    balanceTextTheme = 'text-red-700';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Total Income Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#E7E9E7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-[#1F3D2B]/40 transition-all duration-300 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            TOTAL INCOME
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#1F3D2B] flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="text-2xl sm:text-[1.75rem] font-bold text-[#1F3D2B] tracking-tight mb-2">
          {formatINR(totalIncome)}
        </div>

        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span>{incomeEntries.length} {incomeEntries.length === 1 ? 'entry' : 'entries'}</span>
          <span className="text-[10px] font-semibold text-[#1F3D2B] bg-[#EBF5EE] px-2 py-0.5 rounded-full">
            Inflow
          </span>
        </div>
      </div>

      {/* 2. Total Expense Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#E7E9E7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-red-200 transition-all duration-300 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            TOTAL EXPENSE
          </span>
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        <div className="text-2xl sm:text-[1.75rem] font-bold text-red-700 tracking-tight mb-2">
          {formatINR(totalExpense)}
        </div>

        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span>{expenseEntries.length} {expenseEntries.length === 1 ? 'entry' : 'entries'}</span>
          <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
            Outflow
          </span>
        </div>
      </div>

      {/* 3. Net Balance Card */}
      <div className={`rounded-2xl p-5 border shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 ${balanceCardTheme}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            NET BALANCE
          </span>
          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
        </div>

        <div className={`text-2xl sm:text-[1.75rem] font-bold tracking-tight mb-2 ${balanceTextTheme}`}>
          {netBalance < 0 ? (
            <span>LOSS: {formatINR(Math.abs(netBalance))}</span>
          ) : (
            <span>{formatINR(netBalance)}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
            {balanceStatus}
          </span>
          <span className="text-[11px] text-[#6B7280]">
            {netBalance >= 0 ? 'Surplus' : 'Deficit'}
          </span>
        </div>
      </div>

      {/* 4. Total Entries Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#E7E9E7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-[#9D8050]/40 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            TOTAL ENTRIES
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FAF6EE] text-[#9D8050] flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="text-2xl sm:text-[1.75rem] font-bold text-[#161B18] tracking-tight mb-2">
          {totalEntriesCount}
        </div>

        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span>{incomeEntries.length} Income • {expenseEntries.length} Expense</span>
          <span className="text-[10px] font-semibold text-[#9D8050] bg-[#FAF6EE] px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>
      </div>

    </div>
  );
}

