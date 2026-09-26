import React, { useState, useEffect } from 'react';
import BrandHeader from './components/BrandHeader';
import Dashboard from './components/Dashboard';
import EventWorkspace from './components/EventWorkspace';
import EventCreationModal from './components/EventCreationModal';
import EntryModal from './components/EntryModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import StatementPreviewModal from './components/StatementPreviewModal';
import OfficialStatementDocument from './components/OfficialStatementDocument';
import { 
  getStoredEvents, 
  saveStoredEvents, 
  getStoredCategories, 
  saveStoredCategories 
} from './utils/storage';
import { formatINR } from './utils/currency';

export default function App() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [activeEventId, setActiveEventId] = useState(null);

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryModalType, setEntryModalType] = useState('income');
  const [editingEntry, setEditingEntry] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'event'|'income'|'expense', item, eventId }

  const [previewEvent, setPreviewEvent] = useState(null); // Event for Statement Preview Modal

  // Load stored data on initial mount & support direct query params
  useEffect(() => {
    const loadedEvents = getStoredEvents();
    const loadedCategories = getStoredCategories();
    setEvents(loadedEvents);
    setCategories(loadedCategories);

    // Support deep-link / direct view via query params e.g. ?event=EVT-2026-0001&preview=true
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const evtId = params.get('event');
      const isPreview = params.get('preview') === 'true';
      if (evtId) {
        const found = loadedEvents.find((e) => e.id === evtId);
        if (found) {
          setActiveEventId(found.id);
          if (isPreview) {
            setPreviewEvent(found);
          }
        }
      }
    }
  }, []);

  const activeEvent = events.find((e) => e.id === activeEventId) || null;

  // Persist events helper
  const updateEventsState = (newEvents) => {
    setEvents(newEvents);
    saveStoredEvents(newEvents);
  };

  // Persist categories helper
  const updateCategoriesState = (newCategories) => {
    setCategories(newCategories);
    saveStoredCategories(newCategories);
  };

  // --- EVENT HANDLERS ---
  const handleCreateNewEvent = () => {
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (evt) => {
    setEditingEvent(evt);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (eventPayload) => {
    const existingIndex = events.findIndex((e) => e.id === eventPayload.id);
    let updated;
    if (existingIndex >= 0) {
      updated = [...events];
      updated[existingIndex] = { ...updated[existingIndex], ...eventPayload };
    } else {
      updated = [eventPayload, ...events];
    }
    updateEventsState(updated);
    setActiveEventId(eventPayload.id); // Open newly created or updated event
  };

  const handleUpdateEventFromPreview = (updatedEvt) => {
    const existingIndex = events.findIndex((e) => e.id === updatedEvt.id);
    if (existingIndex >= 0) {
      const updated = [...events];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...updatedEvt,
        updatedAt: new Date().toISOString(),
      };
      updateEventsState(updated);
      setPreviewEvent(updated[existingIndex]);
    }
  };

  const handleDeleteEventClick = (evt) => {
    setDeleteTarget({
      type: 'event',
      item: evt,
      title: 'Delete Entire Event?',
      message: `Are you sure you want to delete "${evt.name}" (${evt.id})? All recorded income and expenses for this event will be permanently deleted.`,
      itemName: evt.name,
    });
    setIsDeleteModalOpen(true);
  };

  // --- ENTRY HANDLERS ---
  const handleOpenAddIncome = () => {
    setEntryModalType('income');
    setEditingEntry(null);
    setIsEntryModalOpen(true);
  };

  const handleOpenAddExpense = () => {
    setEntryModalType('expense');
    setEditingEntry(null);
    setIsEntryModalOpen(true);
  };

  const handleEditEntry = (entry, type) => {
    setEntryModalType(type);
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const handleDeleteEntryClick = (entry, type) => {
    setDeleteTarget({
      type,
      item: entry,
      title: `Delete ${type === 'income' ? 'Income' : 'Expense'} Entry?`,
      message: `Are you sure you want to delete this ${type} item? The event totals will be recalculated immediately.`,
      itemName: entry.item,
      amount: formatINR(entry.amount),
    });
    setIsDeleteModalOpen(true);
  };

  const handleSaveEntry = (entryData, isIncome, isEdit) => {
    if (!activeEvent) return;

    const eventListCopy = [...events];
    const targetEventIndex = eventListCopy.findIndex((e) => e.id === activeEvent.id);
    if (targetEventIndex === -1) return;

    const currentEvent = { ...eventListCopy[targetEventIndex] };
    const listKey = isIncome ? 'incomeEntries' : 'expenseEntries';
    const entriesList = [...(currentEvent[listKey] || [])];

    if (isEdit) {
      const entryIndex = entriesList.findIndex((item) => item.id === entryData.id);
      if (entryIndex >= 0) {
        entriesList[entryIndex] = entryData;
      } else {
        entriesList.push(entryData);
      }
    } else {
      entriesList.push(entryData);
    }

    currentEvent[listKey] = entriesList;
    currentEvent.updatedAt = new Date().toISOString();
    eventListCopy[targetEventIndex] = currentEvent;

    updateEventsState(eventListCopy);

    // Save custom category if new
    if (entryData.category) {
      const catKey = isIncome ? 'income' : 'expense';
      const existingCats = categories[catKey] || [];
      if (!existingCats.includes(entryData.category)) {
        const updatedCats = {
          ...categories,
          [catKey]: [...existingCats, entryData.category],
        };
        updateCategoriesState(updatedCats);
      }
    }
  };

  // --- CONFIRM DELETION ---
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'event') {
      const updated = events.filter((e) => e.id !== deleteTarget.item.id);
      updateEventsState(updated);
      if (activeEventId === deleteTarget.item.id) {
        setActiveEventId(null);
      }
    } else if (deleteTarget.type === 'income' || deleteTarget.type === 'expense') {
      if (!activeEvent) return;
      const isIncome = deleteTarget.type === 'income';
      const listKey = isIncome ? 'incomeEntries' : 'expenseEntries';

      const eventListCopy = [...events];
      const targetEventIndex = eventListCopy.findIndex((e) => e.id === activeEvent.id);
      if (targetEventIndex === -1) return;

      const currentEvent = { ...eventListCopy[targetEventIndex] };
      currentEvent[listKey] = (currentEvent[listKey] || []).filter(
        (item) => item.id !== deleteTarget.item.id
      );
      currentEvent.updatedAt = new Date().toISOString();
      eventListCopy[targetEventIndex] = currentEvent;

      updateEventsState(eventListCopy);
    }

    setDeleteTarget(null);
  };

  const handleDataImported = () => {
    setEvents(getStoredEvents());
    setCategories(getStoredCategories());
  };

  const printTargetEvent =
    (previewEvent && events.find((e) => e.id === previewEvent.id)) ||
    previewEvent ||
    activeEvent ||
    events[0] ||
    null;

  return (
    <>
      <div className="screen-ui-root no-print min-h-screen bg-[#FAF9F6] text-[#161B18] flex flex-col font-sans">
        
        {/* Brand Navigation Header */}
        <BrandHeader
          activeEvent={activeEvent}
          onNavigateHome={() => setActiveEventId(null)}
          onDataImported={handleDataImported}
        />

        {/* Main Workspace / Dashboard Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
          {activeEvent ? (
            <EventWorkspace
              event={activeEvent}
              onNavigateHome={() => setActiveEventId(null)}
              onEditEventInfo={() => handleEditEvent(activeEvent)}
              onOpenAddIncome={handleOpenAddIncome}
              onOpenAddExpense={handleOpenAddExpense}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntryClick}
              onOpenPreview={(evt) => setPreviewEvent(evt)}
              incomeCategories={categories.income || []}
              expenseCategories={categories.expense || []}
            />
          ) : (
            <Dashboard
              events={events}
              onCreateNewEvent={handleCreateNewEvent}
              onOpenEvent={(evt) => setActiveEventId(evt.id)}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEventClick}
              onPreviewEvent={(evt) => setPreviewEvent(evt)}
            />
          )}
        </main>

        {/* Event Creation & Edit Modal */}
        <EventCreationModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          existingEvents={events}
          editEvent={editingEvent}
          onSaveEvent={handleSaveEvent}
        />

        {/* Entry Modal for Quick Custom Income / Expense */}
        <EntryModal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          type={entryModalType}
          editEntry={editingEntry}
          defaultDate={activeEvent?.date || ''}
          categories={entryModalType === 'income' ? categories.income : categories.expense}
          onSaveEntry={handleSaveEntry}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
          }}
          onConfirm={handleConfirmDelete}
          title={deleteTarget?.title}
          message={deleteTarget?.message}
          itemName={deleteTarget?.itemName}
          amount={deleteTarget?.amount}
        />

        {/* Official A4 Statement Preview & Print Modal */}
        <StatementPreviewModal
          isOpen={Boolean(previewEvent)}
          onClose={() => setPreviewEvent(null)}
          event={
            (previewEvent && events.find((e) => e.id === previewEvent.id)) ||
            previewEvent
          }
          onUpdateEvent={handleUpdateEventFromPreview}
        />

        {/* Subtle Professional Footer */}
        <footer className="border-t border-[#E7E9E7] bg-white py-5 sm:py-6 text-center text-xs text-[#6B7280]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1F3D2B]">SILVER CATERING</span>
              <span>•</span>
              <span>Event Income & Expense Calculator</span>
            </div>

            <div className="text-[11px] text-gray-400">
              Valanchery, Kerala | <a href="https://www.silvercatering.in" target="_blank" rel="noreferrer" className="hover:text-[#9D8050] underline">www.silvercatering.in</a>
            </div>
          </div>
        </footer>

      </div>

      {/* Dedicated A4 Print Statement Output (Hidden on screen, ONLY visible in @media print) */}
      <div className="hidden print-only-container">
        <OfficialStatementDocument event={printTargetEvent} />
      </div>
    </>
  );
}
