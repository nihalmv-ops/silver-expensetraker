import React from 'react';
import { Edit2, Trash2, TrendingUp, Plus } from 'lucide-react';
import { formatINR } from '../utils/currency';

export default function IncomeTable({
  entries = [],
  onEditEntry,
  onDeleteEntry,
  onAddNew,
}) {
  const totalAmount = entries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E9E7] p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#EBF5EE] text-[#1F3D2B] flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-[#161B18] mb-1">No Income Entries Recorded</h4>
        <p className="text-xs text-[#6B7280] max-w-sm mx-auto mb-4">
          Record client payments, advance bookings, extra plate orders, or any custom event revenue.
        </p>
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1F3D2B] hover:bg-[#14281C] rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          + Add First Income
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E7E9E7] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
      
      {/* Table Title Bar */}
      <div className="px-5 py-4 border-b border-[#E7E9E7] bg-[#FAF9F6] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#1F3D2B] text-white flex items-center justify-center text-xs font-bold">
            ₹
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#161B18] tracking-tight">Income Breakdown</h3>
            <p className="text-[11px] text-[#6B7280]">{entries.length} custom {entries.length === 1 ? 'record' : 'records'}</p>
          </div>
        </div>

        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1F3D2B] bg-[#EBF5EE] hover:bg-[#D8ECD8] border border-[#1F3D2B]/20 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Income
        </button>
      </div>

      {/* Desktop / Tablet View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAF9F6] border-b border-[#E7E9E7] text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              <th className="py-3 px-4 w-12 text-center">No.</th>
              <th className="py-3 px-4 min-w-[160px]">Item</th>
              <th className="py-3 px-4 min-w-[180px]">Description</th>
              <th className="py-3 px-3 text-center">Qty</th>
              <th className="py-3 px-3 text-center">Unit</th>
              <th className="py-3 px-4 text-right">Rate</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-3 text-center">Date</th>
              <th className="py-3 px-4 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F0] text-xs text-[#242B27]">
            {entries.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-[#F9F6F0]/40 transition-colors">
                <td className="py-3 px-4 text-center font-mono text-gray-400 font-medium">
                  {index + 1}
                </td>
                <td className="py-3 px-4 font-semibold text-[#161B18]">
                  <div className="flex items-center gap-2">
                    <span>{item.item}</span>
                    {item.category && (
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        {item.category}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-500 truncate max-w-xs">
                  {item.description || '-'}
                </td>
                <td className="py-3 px-3 text-center font-medium">
                  {item.quantity ?? '-'}
                </td>
                <td className="py-3 px-3 text-center text-gray-500">
                  {item.unit || '-'}
                </td>
                <td className="py-3 px-4 text-right font-medium text-gray-600">
                  {item.rate ? formatINR(item.rate) : '-'}
                </td>
                <td className="py-3 px-4 text-right font-bold text-[#1F3D2B] text-sm">
                  {formatINR(item.amount)}
                </td>
                <td className="py-3 px-3 text-center text-gray-500 whitespace-nowrap">
                  {item.date || '-'}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEditEntry(item)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-[#1F3D2B] hover:bg-gray-100 transition-colors"
                      title="Edit Entry"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(item)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#FAF9F6] border-t-2 border-[#E7E9E7] text-xs font-bold text-[#161B18]">
              <td colSpan={6} className="py-3.5 px-4 text-right uppercase tracking-wider text-gray-500">
                Total Income:
              </td>
              <td className="py-3.5 px-4 text-right text-base text-[#1F3D2B]">
                {formatINR(totalAmount)}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden divide-y divide-[#F0F2F0]">
        {entries.map((item, index) => (
          <div key={item.id || index} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-gray-400">#{index + 1}</span>
                  <span className="text-sm font-bold text-[#161B18]">{item.item}</span>
                </div>
                {item.category && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {item.category}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-base font-bold text-[#1F3D2B]">
                  {formatINR(item.amount)}
                </span>
                <div className="text-[10px] text-gray-400">{item.date}</div>
              </div>
            </div>

            {item.description && (
              <p className="text-xs text-gray-500">{item.description}</p>
            )}

            {(item.quantity || item.rate) && (
              <div className="text-xs text-gray-600 bg-[#FAF9F6] p-2 rounded-lg flex items-center justify-between">
                <span>Calc: {item.quantity || 0} {item.unit} @ {formatINR(item.rate || 0)}</span>
                <span className="font-semibold text-[#1F3D2B]">= {formatINR(item.amount)}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => onEditEntry(item)}
                className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => onDeleteEntry(item)}
                className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}

        <div className="p-4 bg-[#FAF9F6] flex items-center justify-between border-t border-[#E7E9E7]">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Total Income:</span>
          <span className="text-base font-bold text-[#1F3D2B]">{formatINR(totalAmount)}</span>
        </div>
      </div>

    </div>
  );
}

