import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, Phone, FileText, Hash, Check } from 'lucide-react';
import { generateEventId } from '../utils/idGenerator';

export default function EventCreationModal({
  isOpen,
  onClose,
  existingEvents = [],
  editEvent = null,
  onSaveEvent,
}) {
  const isEdit = Boolean(editEvent);

  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [previewId, setPreviewId] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (editEvent) {
      setName(editEvent.name || '');
      setClientName(editEvent.clientName || '');
      setDate(editEvent.date || '');
      setVenue(editEvent.venue || '');
      setContactNumber(editEvent.contactNumber || '');
      setReferenceNumber(editEvent.referenceNumber || '');
      setNotes(editEvent.notes || '');
      setPreviewId(editEvent.id || '');
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      setName('');
      setClientName('');
      setDate(todayStr);
      setVenue('');
      setContactNumber('');
      setReferenceNumber('');
      setNotes('');
      setPreviewId(generateEventId(existingEvents));
    }
  }, [isOpen, editEvent, existingEvents]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter an event name.');
      return;
    }

    if (!clientName.trim()) {
      alert('Please enter a client or host name.');
      return;
    }

    const eventPayload = {
      id: isEdit ? editEvent.id : previewId,
      name: name.trim(),
      clientName: clientName.trim(),
      date: date || new Date().toISOString().slice(0, 10),
      venue: venue.trim(),
      contactNumber: contactNumber.trim(),
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim(),
      createdAt: isEdit ? editEvent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      incomeEntries: isEdit ? editEvent.incomeEntries || [] : [],
      expenseEntries: isEdit ? editEvent.expenseEntries || [] : [],
    };

    onSaveEvent(eventPayload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-[#E7E9E7] w-full max-w-xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#1F3D2B] text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-[#C29C5E]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold tracking-tight truncate">
                {isEdit ? 'Edit Event Details' : 'Create New Catering Event'}
              </h2>
              <p className="text-[11px] sm:text-xs text-white/70 truncate">
                {isEdit ? 'Update venue, date, or contact info' : 'Generate event workspace for custom income and expenses'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
          
          {/* Generated Event ID Banner */}
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E7E9E7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#9D8050]" />
              <span className="text-xs font-semibold text-[#6B7280]">System Generated Event ID:</span>
            </div>
            <span className="font-mono text-xs font-bold text-[#1F3D2B] bg-[#EBF5EE] px-2.5 py-0.5 rounded-lg border border-[#1F3D2B]/20">
              {previewId}
            </span>
          </div>

          {/* Event Name */}
          <div>
            <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1.5">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Wedding Catering, Corporate Gala, Birthday Reception"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm font-medium"
            />
          </div>

          {/* Client Name & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#9D8050]" /> Client / Host Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g., ABC Family, Dr. Suresh, Infosys Team"
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#9D8050]" /> Contact Number
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g., +91 98464 15767"
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm"
              />
            </div>
          </div>

          {/* Event Date & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#9D8050]" /> Event Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#9D8050]" /> Venue / Location
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g., Valanchery, Malappuram Convention Center"
                className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm"
              />
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#9D8050]" /> Event Reference Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., REF-WED-0926"
              className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#161B18] uppercase tracking-wider mb-1.5">
              Event Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Guest count, special menu requests, or arrangement notes..."
              className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] text-sm resize-none"
            />
          </div>

        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E7E9E7] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#161B18] hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-[#1F3D2B] hover:bg-[#14281C] rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {isEdit ? 'Save Changes' : 'Create Event'}
          </button>
        </div>

      </div>
    </div>
  );
}

