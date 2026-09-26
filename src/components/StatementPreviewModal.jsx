import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  UserCheck,
  AlignLeft,
} from 'lucide-react';
import OfficialStatementDocument from './OfficialStatementDocument.jsx';
import { generateEventFinancialPDF } from '../utils/pdfGenerator.js';
import { paginateEventStatement } from '../utils/statementPagination.js';

export default function StatementPreviewModal({
  isOpen,
  onClose,
  event,
  onUpdateEvent,
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [coordinator, setCoordinator] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (event) {
      setCoordinator(event.coordinator || '');
      setNotes(event.notes || '');
    }
  }, [event]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentEvent = useMemo(() => {
    if (!event) return null;
    return {
      ...event,
      coordinator,
      notes,
    };
  }, [event, coordinator, notes]);

  const pages = useMemo(() => {
    if (!currentEvent) return [];
    return paginateEventStatement(currentEvent);
  }, [currentEvent]);

  if (!isOpen || !currentEvent) return null;

  const handleFieldChange = (field, value) => {
    if (field === 'coordinator') setCoordinator(value);
    if (field === 'notes') setNotes(value);

    if (onUpdateEvent) {
      onUpdateEvent({
        ...event,
        coordinator: field === 'coordinator' ? value : coordinator,
        notes: field === 'notes' ? value : notes,
      });
    }
  };

  const handleSaveAsPdf = async () => {
    try {
      setIsDownloading(true);
      await generateEventFinancialPDF(currentEvent);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-black/75 backdrop-blur-xs no-print">
      <div
        className="bg-[#F3F4F6] rounded-xl sm:rounded-2xl shadow-2xl border border-[#D1D5DB] w-full max-w-6xl max-h-[97vh] sm:max-h-[96vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Print Preview Header & Action Bar */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 bg-[#161B18] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-[#374151]">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#C29C5E] shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                  <h2 className="text-xs sm:text-base font-bold tracking-tight text-white truncate">
                    A4 Print Preview — Official Statement
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#C29C5E] border border-[#C29C5E]/30 shrink-0">
                    {pages.length === 1 ? '1 A4 Page' : `${pages.length} A4 Pages`}
                  </span>
                </div>
                <p className="text-[10.5px] sm:text-[11px] text-gray-300 truncate">
                  Silver Catering A4 Layout ({currentEvent.name} • {currentEvent.id})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="sm:hidden w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrintStatement}
              className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#111827] bg-white hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              title="Print official A4 statement directly"
            >
              <Printer className="w-3.5 h-3.5 text-[#1F3D2B] shrink-0" />
              <span>PRINT STATEMENT</span>
            </button>

            <button
              onClick={handleSaveAsPdf}
              disabled={isDownloading}
              className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white bg-[#1F3D2B] hover:bg-[#14281C] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/15"
              title="Save exact A4 statement as PDF"
            >
              <Download className={`w-3.5 h-3.5 text-[#C29C5E] shrink-0 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'SAVING PDF...' : 'SAVE AS PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="hidden sm:flex w-8 h-8 rounded-xl items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pre-Print Quick Customization Bar (Coordinator & Custom Notes before printing) */}
        <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-white border-b border-[#E5E7EB] grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-center text-xs">
          <div className="md:col-span-4 flex items-center gap-2">
            <label className="text-[10.5px] sm:text-[11px] font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1 shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-[#9D8050]" />
              Coordinator:
            </label>
            <input
              type="text"
              value={coordinator}
              onChange={(e) => handleFieldChange('coordinator', e.target.value)}
              placeholder="Optional name (or leave blank for line)"
              className="w-full px-2.5 py-1 sm:py-1.5 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#1F3D2B] text-xs text-[#111827]"
            />
          </div>

          <div className="md:col-span-8 flex items-center gap-2">
            <label className="text-[10.5px] sm:text-[11px] font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1 shrink-0">
              <AlignLeft className="w-3.5 h-3.5 text-[#9D8050]" />
              Notes:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Enter custom notes before printing (or leave blank for ruled lines)..."
              className="w-full px-2.5 py-1 sm:py-1.5 rounded-lg border border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-[#1F3D2B] text-xs text-[#111827]"
            />
          </div>
        </div>

        {/* Scrollable A4 Pages Viewport */}
        <div className="flex-1 overflow-auto p-2.5 sm:p-6 md:p-8 bg-[#525659]">
          <OfficialStatementDocument event={currentEvent} />
        </div>
      </div>
    </div>
  );
}

