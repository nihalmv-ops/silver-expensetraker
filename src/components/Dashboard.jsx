import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  User, 
  FileText, 
  Download, 
  Trash2, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Sparkles,
  Edit2,
  Printer
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import { generateEventFinancialPDF } from '../utils/pdfGenerator';

export default function Dashboard({
  events = [],
  onCreateNewEvent,
  onOpenEvent,
  onEditEvent,
  onDeleteEvent,
  onPreviewEvent,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  // Compute aggregate totals across all events
  const totalEventsCount = events.length;
  let aggregateIncome = 0;
  let aggregateExpense = 0;

  events.forEach((evt) => {
    (evt.incomeEntries || []).forEach((inc) => {
      aggregateIncome += Number(inc.amount) || 0;
    });
    (evt.expenseEntries || []).forEach((exp) => {
      aggregateExpense += Number(exp.amount) || 0;
    });
  });

  const aggregateBalance = aggregateIncome - aggregateExpense;

  // Filter events based on search query
  const filteredEvents = events.filter((evt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (evt.name && evt.name.toLowerCase().includes(q)) ||
      (evt.clientName && evt.clientName.toLowerCase().includes(q)) ||
      (evt.venue && evt.venue.toLowerCase().includes(q)) ||
      (evt.id && evt.id.toLowerCase().includes(q)) ||
      (evt.date && evt.date.toLowerCase().includes(q))
    );
  });

  const handleQuickPdfDownload = async (e, evt) => {
    e.stopPropagation();
    try {
      setDownloadingPdfId(evt.id);
      await generateEventFinancialPDF(evt);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Welcome & Quick Stats */}
      <div className="bg-gradient-to-r from-[#181E1B] via-[#1F3D2B] to-[#14281C] rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative gold line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9D8050] via-[#C29C5E] to-[#9D8050]" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C29C5E]">
                EVENT FINANCIAL MANAGEMENT
              </span>
              <span className="w-8 h-[1px] bg-[#9D8050]" />
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-medium tracking-tight text-white mb-2">
              Event Income & Expense Overview
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl font-light leading-relaxed">
              Track custom revenue and expenditures for catering banquets, weddings, and corporate gatherings with automatic net balance calculation.
            </p>
          </div>

          <button
            onClick={onCreateNewEvent}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#9D8050] hover:bg-[#866C41] text-white text-xs sm:text-sm font-bold tracking-wider uppercase rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Create New Event
          </button>
        </div>

        {/* Global Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10">
          
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300 block mb-1">
              Total Events
            </span>
            <span className="text-xl sm:text-3xl font-bold tracking-tight text-white block truncate">
              {totalEventsCount}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300 block mb-1">
              Total Income
            </span>
            <span className="text-base sm:text-2xl font-bold tracking-tight text-emerald-400 block truncate">
              {formatINR(aggregateIncome)}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300 block mb-1">
              Total Expense
            </span>
            <span className="text-base sm:text-2xl font-bold tracking-tight text-rose-300 block truncate">
              {formatINR(aggregateExpense)}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300 block mb-1">
              Total Balance
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-base sm:text-2xl font-bold tracking-tight block truncate ${
                aggregateBalance >= 0 ? 'text-[#C29C5E]' : 'text-red-400'
              }`}>
                {aggregateBalance < 0 
                  ? `LOSS: ${formatINR(Math.abs(aggregateBalance))}` 
                  : formatINR(aggregateBalance)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Events Section Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#161B18] tracking-tight">
            Catering Events List
          </h2>
          <p className="text-xs text-[#6B7280]">
            Select an event to open its full financial workspace or download statement
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event, client, venue, date..."
            className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] bg-white text-[#161B18]"
          />
        </div>
      </div>

      {/* Events Grid / Cards */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E9E7] p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF6EE] text-[#9D8050] flex items-center justify-center mx-auto mb-4 border border-[#9D8050]/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#161B18] mb-1">
            {searchQuery ? 'No Events Match Your Search' : 'No Events Created Yet'}
          </h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto mb-6">
            {searchQuery 
              ? 'Try modifying your search keywords or clear the search input.' 
              : 'Start by creating your first catering event to manage custom income and expenses.'}
          </p>
          <button
            onClick={onCreateNewEvent}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F3D2B] hover:bg-[#14281C] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Event Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const evtIncome = (evt.incomeEntries || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
            const evtExpense = (evt.expenseEntries || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const evtBalance = evtIncome - evtExpense;

            let statusLabel = 'Break Even';
            let statusBadge = 'bg-gray-100 text-gray-700 border-gray-200';
            if (evtBalance > 0) {
              statusLabel = 'Positive Balance';
              statusBadge = 'bg-[#EBF5EE] text-[#1F3D2B] border-[#1F3D2B]/20';
            } else if (evtBalance < 0) {
              statusLabel = 'Negative Balance';
              statusBadge = 'bg-red-50 text-red-700 border-red-200';
            }

            return (
              <div
                key={evt.id}
                onClick={() => onOpenEvent(evt)}
                className="bg-white rounded-2xl border border-[#E7E9E7] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-[#1F3D2B]/40 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Event ID & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[11px] font-bold text-[#9D8050] bg-[#FAF6EE] px-2.5 py-0.5 rounded-md border border-[#9D8050]/20">
                      {evt.id}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Event Title */}
                  <h3 className="text-base font-bold text-[#161B18] group-hover:text-[#1F3D2B] transition-colors line-clamp-1 mb-2">
                    {evt.name}
                  </h3>

                  {/* Metadata: Client, Venue, Date */}
                  <div className="space-y-1.5 text-xs text-[#6B7280] mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#9D8050] shrink-0" />
                      <span className="font-medium text-[#161B18] truncate">{evt.clientName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{evt.date}</span>
                    </div>

                    {evt.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Micro Summary */}
                  <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E7E9E7] mb-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Income:</span>
                      <span className="font-bold text-[#1F3D2B]">{formatINR(evtIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Expense:</span>
                      <span className="font-bold text-red-700">{formatINR(evtExpense)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#E7E9E7]">
                      <span className="font-semibold text-gray-700">Net Balance:</span>
                      <span className={`font-bold ${evtBalance >= 0 ? 'text-[#1F3D2B]' : 'text-red-700'}`}>
                        {evtBalance < 0 
                          ? `LOSS: ${formatINR(Math.abs(evtBalance))}` 
                          : formatINR(evtBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-[#F0F2F0] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(evt);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#161B18] hover:bg-gray-100 transition-colors"
                      title="Edit Event Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPreviewEvent) onPreviewEvent(evt);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#9D8050] hover:bg-[#FAF6EE] transition-colors"
                      title="Preview & Print Statement"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleQuickPdfDownload(e, evt)}
                      disabled={downloadingPdfId === evt.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#1A3826] hover:bg-gray-100 transition-colors"
                      title="Direct Download Statement PDF"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadingPdfId === evt.id ? 'animate-bounce' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(evt);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-xs font-bold text-[#1F3D2B] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

