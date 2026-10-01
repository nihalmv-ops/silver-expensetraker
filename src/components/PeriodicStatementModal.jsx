import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  Calendar,
  CalendarDays,
  UserCheck,
  AlignLeft,
  ChevronDown,
  Layers,
} from 'lucide-react';
import OfficialPeriodicStatementDocument from './OfficialPeriodicStatementDocument.jsx';
import {
  MONTH_NAMES,
  getAvailableYears,
  buildPeriodicStatementData,
} from '../utils/periodicStatementPagination.js';
import { generatePeriodicFinancialPDF } from '../utils/pdfGenerator.js';
import { formatINR } from '../utils/currency.js';

export default function PeriodicStatementModal({
  isOpen,
  onClose,
  events = [],
  initialPeriodType = 'monthly', // 'monthly' | 'yearly' | 'all'
  initialYear = 2026,
  initialMonth = 9,
  onSetActiveStatementData, // To wire with App.jsx print container
}) {
  const availableYears = useMemo(() => getAvailableYears(events), [events]);

  const [periodType, setPeriodType] = useState(initialPeriodType);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPeriodType(initialPeriodType || 'monthly');
      setSelectedYear(initialYear || new Date().getFullYear());
      setSelectedMonth(initialMonth || (new Date().getMonth() + 1));
    }
  }, [isOpen, initialPeriodType, initialYear, initialMonth]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const statementData = useMemo(() => {
    if (!isOpen) return null;
    return buildPeriodicStatementData(events, {
      periodType,
      selectedYear: Number(selectedYear),
      selectedMonth: Number(selectedMonth),
      startDate,
      endDate,
      preparedBy,
      notes,
    });
  }, [isOpen, events, periodType, selectedYear, selectedMonth, startDate, endDate, preparedBy, notes]);

  // Synchronize active statement data with App.jsx so @media print prints the exact statement
  useEffect(() => {
    if (onSetActiveStatementData) {
      onSetActiveStatementData(statementData);
    }
  }, [statementData, onSetActiveStatementData]);

  if (!isOpen || !statementData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    try {
      setIsDownloading(true);
      await generatePeriodicFinancialPDF(statementData);
    } catch (err) {
      console.error('Periodic PDF error:', err);
      alert('Failed to generate PDF statement: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-black/75 backdrop-blur-xs no-print">
      <div
        className="bg-[#F3F4F6] rounded-xl sm:rounded-2xl shadow-2xl border border-[#D1D5DB] w-full max-w-6xl max-h-[97vh] sm:max-h-[96vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Print Preview Header & Action Bar */}
        <div className="px-3.5 sm:px-5 py-3 bg-[#161B18] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#374151]">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#C29C5E] shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                  <h2 className="text-xs sm:text-base font-bold tracking-tight text-white truncate">
                    {periodType === 'monthly' ? 'Monthly' : periodType === 'yearly' ? 'Annual' : 'Overall'} Financial Statement
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#C29C5E] border border-[#C29C5E]/30 shrink-0">
                    {statementData.periodSubtitle}
                  </span>
                </div>
                <p className="text-[10.5px] sm:text-[11px] text-gray-300 truncate">
                  Official Silver Catering Period Audit & Financial Report
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="sm:hidden w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#111827] bg-white hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              title="Print official statement"
            >
              <Printer className="w-3.5 h-3.5 text-[#1F3D2B] shrink-0" />
              <span>PRINT STATEMENT</span>
            </button>

            <button
              onClick={handleSavePdf}
              disabled={isDownloading}
              className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white bg-[#1F3D2B] hover:bg-[#14281C] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/15"
              title="Save statement as PDF"
            >
              <Download className={`w-3.5 h-3.5 text-[#C29C5E] shrink-0 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'SAVING PDF...' : 'SAVE AS PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="hidden sm:flex w-8 h-8 rounded-xl items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Period Selector Tabs & Controls Bar */}
        <div className="px-3.5 sm:px-5 py-2.5 bg-white border-b border-[#E5E7EB] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Mode Tabs */}
            <div className="grid grid-cols-3 bg-[#F3F4F6] p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPeriodType('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  periodType === 'monthly'
                    ? 'bg-[#1F3D2B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#111827]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Monthly</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('yearly')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  periodType === 'yearly'
                    ? 'bg-[#1F3D2B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#111827]'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Yearly</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  periodType === 'all'
                    ? 'bg-[#1F3D2B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#111827]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Events</span>
              </button>
            </div>

            {/* Date Pickers based on Period Type */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {periodType === 'monthly' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Month:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#1F3D2B]"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={idx} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Year:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#1F3D2B]"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {periodType === 'yearly' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Select Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#1F3D2B]"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Period Stat Pill */}
              <div className="hidden md:flex items-center gap-2 bg-[#FAF6EE] border border-[#9D8050]/30 px-3 py-1 rounded-lg text-[11px]">
                <span className="font-semibold text-gray-600">{statementData.eventsCount} Events</span>
                <span className="text-gray-300">•</span>
                <span className="font-semibold text-[#1F3D2B]">In: {formatINR(statementData.totalIncome)}</span>
                <span className="text-gray-300">•</span>
                <span className="font-semibold text-red-700">Out: {formatINR(statementData.totalExpense)}</span>
                <span className="text-gray-300">•</span>
                <span className={`font-bold ${statementData.netBalance >= 0 ? 'text-[#1F3D2B]' : 'text-red-700'}`}>
                  Net: {formatINR(statementData.netBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Pre-Print Customization Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-center text-xs pt-1 border-t border-gray-100">
            <div className="md:col-span-4 flex items-center gap-2">
              <label className="text-[10.5px] sm:text-[11px] font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1 shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-[#9D8050]" />
                Prepared By:
              </label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="Auditor / Coordinator Name"
                className="w-full px-2.5 py-1 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#1F3D2B] text-xs text-[#111827]"
              />
            </div>

            <div className="md:col-span-8 flex items-center gap-2">
              <label className="text-[10.5px] sm:text-[11px] font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1 shrink-0">
                <AlignLeft className="w-3.5 h-3.5 text-[#9D8050]" />
                Audit Notes:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Custom management remarks before printing..."
                className="w-full px-2.5 py-1 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#1F3D2B] text-xs text-[#111827]"
              />
            </div>
          </div>
        </div>

        {/* Scrollable A4 Document Viewport */}
        <div className="flex-1 overflow-auto p-2.5 sm:p-6 md:p-8 bg-[#525659]">
          <OfficialPeriodicStatementDocument statementData={statementData} />
        </div>
      </div>
    </div>
  );
}