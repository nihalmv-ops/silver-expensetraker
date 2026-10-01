import React, { useState } from 'react';
import { ChefHat, ArrowLeft, Download, Upload, ShieldCheck, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { exportBackupData, importBackupData } from '../utils/storage';

export default function BrandHeader({
  activeEvent,
  onNavigateHome,
  onDataImported,
  onOpenPeriodicStatements,
}) {
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  const handleExportBackup = () => {
    const dataStr = exportBackupData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Silver_Catering_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowBackupMenu(false);
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const result = importBackupData(content);
        if (result.success) {
          setImportStatus(`Imported ${result.count} events successfully!`);
          setTimeout(() => setImportStatus(''), 3000);
          if (onDataImported) onDataImported();
        } else {
          alert(`Failed to import backup: ${result.error}`);
        }
      }
    };
    reader.readAsText(file);
    setShowBackupMenu(false);
  };

  const logoUrl = `${import.meta.env.BASE_URL || './'}silver_logo.png`;

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E7E9E7] shadow-[0_2px_8px_rgba(0,0,0,0.03)] no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {activeEvent && (
              <button
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#1F3D2B] bg-[#F4EFE6] hover:bg-[#EAE2D2] rounded-lg transition-colors border border-[#9D8050]/20 shrink-0 cursor-pointer"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}

            <div 
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-[#E7E9E7] shadow-sm flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300 shrink-0">
                <img 
                  src={logoUrl} 
                  alt="Silver Catering Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.innerHTML = '<span class="text-sm font-bold text-[#1F3D2B]">SC</span>';
                  }}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-xl font-bold tracking-tight text-[#161B18] font-sans truncate">
                    SILVER CATERING
                  </span>
                  <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-[#1F3D2B]/10 text-[#1F3D2B] rounded shrink-0">
                    FINANCIALS
                  </span>
                </div>
                <p className="text-[9.5px] sm:text-xs tracking-wider uppercase font-semibold text-[#9D8050] truncate">
                  Premium Catering Services in Kerala
                </p>
              </div>
            </div>
          </div>

          {/* Active Event Breadcrumb or Backup Options */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {activeEvent ? (
              <div className="hidden lg:flex items-center gap-2 text-xs text-[#6B7280] bg-[#FAF9F6] px-3 py-1.5 rounded-lg border border-[#E7E9E7]">
                <span className="text-[#161B18] font-medium">Event:</span>
                <span className="font-semibold text-[#1F3D2B] max-w-[200px] truncate">{activeEvent.name}</span>
                <span className="text-gray-300">|</span>
                <span className="text-[#9D8050] font-mono text-[11px] font-bold">{activeEvent.id}</span>
              </div>
            ) : null}

            {/* Statements & Reports Button */}
            <button
              onClick={() => onOpenPeriodicStatements ? onOpenPeriodicStatements('monthly') : null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1A3826] bg-[#FAF6EE] hover:bg-[#F3EDE0] border border-[#9D8050]/40 rounded-lg shadow-2xs transition-all hover:border-[#9D8050] cursor-pointer"
              title="Open Monthly & Yearly Financial Statements (PDF & Print)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#9D8050]" />
              <span className="hidden sm:inline">Statements & Reports</span>
            </button>

            {/* Backup & Portability Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBackupMenu(!showBackupMenu)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#4B5563] hover:text-[#161B18] bg-white hover:bg-gray-50 border border-[#E5E7EB] rounded-lg shadow-sm transition-all"
                title="Backup and Restore Data"
              >
                <ShieldCheck className="w-4 h-4 text-[#9D8050]" />
                <span className="hidden sm:inline">Data Backup</span>
              </button>

              {showBackupMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowBackupMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E5E7EB] py-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      LocalStorage Backup
                    </div>
                    <button
                      onClick={handleExportBackup}
                      className="w-full text-left px-3 py-2 text-xs text-[#161B18] hover:bg-[#F9F6F0] flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#1F3D2B]" />
                      <div>
                        <div className="font-medium">Export JSON Backup</div>
                        <div className="text-[10px] text-gray-500">Save all events to your computer</div>
                      </div>
                    </button>

                    <label className="w-full text-left px-3 py-2 text-xs text-[#161B18] hover:bg-[#F9F6F0] flex items-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#9D8050]" />
                      <div>
                        <div className="font-medium">Import JSON Backup</div>
                        <div className="text-[10px] text-gray-500">Restore events from backup file</div>
                      </div>
                      <input 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={handleFileImport}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>

            {importStatus && (
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                {importStatus}
              </span>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

