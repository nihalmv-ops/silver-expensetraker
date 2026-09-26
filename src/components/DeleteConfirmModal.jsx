import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Entry?',
  message = 'Are you sure you want to delete this entry? This action cannot be undone.',
  itemName = '',
  amount = null,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-red-100 w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-[#161B18] tracking-tight">
              {title}
            </h3>

            <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
              {message}
            </p>

            {itemName && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <span className="font-semibold text-gray-800">{itemName}</span>
                {amount && (
                  <span className="ml-2 font-mono font-bold text-red-600">
                    ({amount})
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#161B18] hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

