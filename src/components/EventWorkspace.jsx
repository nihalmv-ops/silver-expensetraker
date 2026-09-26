import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Plus, 
  Download, 
  FileText, 
  Edit3, 
  Sparkles,
  Info,
  Clock,
  Printer
} from 'lucide-react';
import FinancialSummaryCards from './FinancialSummaryCards';
import SearchAndFilterBar from './SearchAndFilterBar';
import IncomeTable from './IncomeTable';
import ExpenseTable from './ExpenseTable';
import { formatINR } from '../utils/currency';
import { generateEventFinancialPDF } from '../utils/pdfGenerator';

export default function EventWorkspace({
  event,
  onNavigateHome,
  onEditEventInfo,
  onOpenAddIncome,
  onOpenAddExpense,
  onEditEntry,
  onDeleteEntry,
  onOpenPreview,
  incomeCategories = [],
  expenseCategories = [],
}) {
  const [activeTypeTab, setActiveTypeTab] = useState('all'); // 'all' | 'income' | 'expense'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Available categories for filter dropdown
  const allCategories = useMemo(() => {
    const set = new Set();
    (event.incomeEntries || []).forEach(i => { if (i.category) set.add(i.category); });
    (event.expenseEntries || []).forEach(e => { if (e.category) set.add(e.category); });
    return Array.from(set);
  }, [event]);

  // Date filtering helper
  const isDateInFilter = (itemDate) => {
    if (dateFilter === 'all' || !itemDate) return true;
    const d = new Date(itemDate);
    const now = new Date();

    if (dateFilter === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      return itemDate === todayStr;
    }

    if (dateFilter === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return d >= sevenDaysAgo && d <= now;
    }

    if (dateFilter === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    if (dateFilter === 'custom') {
      if (customStartDate && itemDate < customStartDate) return false;
      if (customEndDate && itemDate > customEndDate) return false;
      return true;
    }

    return true;
  };

  // Filter Income entries
  const filteredIncomeEntries = useMemo(() => {
    return (event.incomeEntries || []).filter((item) => {
      if (!isDateInFilter(item.date)) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.item && item.item.toLowerCase().includes(q);
        const matchDesc = item.description && item.description.toLowerCase().includes(q);
        const matchCat = item.category && item.category.toLowerCase().includes(q);
        const matchNotes = item.notes && item.notes.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat && !matchNotes) return false;
      }
      return true;
    });
  }, [event.incomeEntries, searchQuery, dateFilter, customStartDate, customEndDate, categoryFilter]);

  // Filter Expense entries
  const filteredExpenseEntries = useMemo(() => {
    return (event.expenseEntries || []).filter((item) => {
      if (!isDateInFilter(item.date)) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.item && item.item.toLowerCase().includes(q);
        const matchDesc = item.description && item.description.toLowerCase().includes(q);
        const matchCat = item.category && item.category.toLowerCase().includes(q);
        const matchNotes = item.notes && item.notes.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat && !matchNotes) return false;
      }
      return true;
    });
  }, [event.expenseEntries, searchQuery, dateFilter, customStartDate, customEndDate, categoryFilter]);

  const handleGeneratePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateEventFinancialPDF(event);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Could not generate PDF: ' + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Event Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-[#E7E9E7] shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
        
        {/* Left: Event Details */}
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="font-mono text-xs font-bold text-[#1F3D2B] bg-[#EBF5EE] px-3 py-1 rounded-lg border border-[#1F3D2B]/20">
              {event.id}
            </span>
            {event.referenceNumber && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                Ref: {event.referenceNumber}
              </span>
            )}
            <button
              onClick={onEditEventInfo}
              className="inline-flex items-center gap-1 text-xs text-[#9D8050] hover:text-[#80663B] font-semibold transition-colors ml-1 cursor-pointer"
              title="Edit Event Details"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Info
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#161B18] tracking-tight break-words">
            {event.name}
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-5 text-xs text-[#6B7280]">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#9D8050] shrink-0" />
              <span className="font-semibold text-[#161B18]">{event.clientName}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{event.date}</span>
            </div>

            {event.venue && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{event.venue}</span>
              </div>
            )}

            {event.contactNumber && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{event.contactNumber}</span>
              </div>
            )}
          </div>

          {event.notes && (
            <p className="text-xs text-gray-500 italic pt-1 max-w-2xl break-words">
              "{event.notes}"
            </p>
          )}
        </div>

        {/* Right: Quick Action Buttons (2x2 Grid on Mobile, Flex on Tablet/Desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          
          {/* Add Income Button */}
          <button
            onClick={onOpenAddIncome}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-[#1F3D2B] hover:bg-[#14281C] rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ Add Income</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-[#181E1B] hover:bg-black rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ Add Expense</span>
          </button>

          {/* Print Statement Button */}
          <button
            onClick={() => onOpenPreview ? onOpenPreview(event) : handleGeneratePdf()}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[#1A3826] bg-[#FAF6EE] hover:bg-[#F3EDE0] border border-[#9D8050]/40 rounded-xl shadow-xs transition-all hover:border-[#9D8050] cursor-pointer"
            title="Open A4 Print Layout for Official Financial Statement"
          >
            <Printer className="w-4 h-4 text-[#9D8050] shrink-0" />
            <span>PRINT STATEMENT</span>
          </button>

          {/* Save as PDF Button */}
          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-[#1A3826] hover:bg-[#13271B] border border-emerald-600/30 rounded-xl shadow-md transition-all cursor-pointer"
            title="Save Official A4 Financial Statement as PDF"
          >
            <Download className={`w-4 h-4 text-[#C29C5E] shrink-0 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
            <span>{isGeneratingPdf ? 'SAVING PDF...' : 'SAVE AS PDF'}</span>
          </button>

        </div>

      </div>

      {/* Top Financial Summary Cards */}
      <FinancialSummaryCards
        incomeEntries={event.incomeEntries || []}
        expenseEntries={event.expenseEntries || []}
      />

      {/* Search, Filter & Quick Type Tabs */}
      <SearchAndFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTypeTab={activeTypeTab}
        onTypeTabChange={setActiveTypeTab}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        availableCategories={allCategories}
        incomeCount={event.incomeEntries?.length || 0}
        expenseCount={event.expenseEntries?.length || 0}
      />

      {/* Tables Breakdown Section */}
      <div className="space-y-6">
        
        {/* Render Income Table if 'all' or 'income' is active */}
        {(activeTypeTab === 'all' || activeTypeTab === 'income') && (
          <IncomeTable
            entries={filteredIncomeEntries}
            onEditEntry={(entry) => onEditEntry(entry, 'income')}
            onDeleteEntry={(entry) => onDeleteEntry(entry, 'income')}
            onAddNew={onOpenAddIncome}
          />
        )}

        {/* Render Expense Table if 'all' or 'expense' is active */}
        {(activeTypeTab === 'all' || activeTypeTab === 'expense') && (
          <ExpenseTable
            entries={filteredExpenseEntries}
            onEditEntry={(entry) => onEditEntry(entry, 'expense')}
            onDeleteEntry={(entry) => onDeleteEntry(entry, 'expense')}
            onAddNew={onOpenAddExpense}
          />
        )}

      </div>

      {/* Event Summary Box at bottom */}
      <div className="bg-[#FAF9F6] rounded-2xl p-5 border border-[#E7E9E7] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#6B7280]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#9D8050] shrink-0" />
          <span>
            Financial entries are saved instantly in your browser's secure local storage.
          </span>
        </div>

        <button
          onClick={() => onOpenPreview ? onOpenPreview(event) : handleGeneratePdf()}
          disabled={isGeneratingPdf}
          className="inline-flex items-center gap-1.5 font-bold text-[#1A3826] hover:text-[#9D8050] hover:underline self-start sm:self-auto transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-[#9D8050]" />
          Preview & Print Official Statement
        </button>
      </div>

    </div>
  );
}

