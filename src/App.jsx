import React, { useState, useEffect } from 'react';
import BrandHeader from './components/BrandHeader';
import Dashboard from './components/Dashboard';
import EventWorkspace from './components/EventWorkspace';
import EventCreationModal from './components/EventCreationModal';
import EntryModal from './components/EntryModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import StatementPreviewModal from './components/StatementPreviewModal';
import OfficialStatementDocument from './components/OfficialStatementDocument';
import PeriodicStatementModal from './components/PeriodicStatementModal';
import OfficialPeriodicStatementDocument from './components/OfficialPeriodicStatementDocument';
import CloudSyncModal from './components/CloudSyncModal';
import { 
  getStoredEvents, 
  saveStoredEvents, 
  getStoredCategories, 
  saveStoredCategories 
} from './utils/storage';
import { formatINR } from './utils/currency';
import { api } from './utils/api';

export default function App() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [activeEventId, setActiveEventId] = useState(null);

  // Cloud Sync & Backend Status
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('offline'); // 'connected' | 'offline'
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryModalType, setEntryModalType] = useState('income');
  const [editingEntry, setEditingEntry] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'event'|'income'|'expense', item, eventId }

  const [previewEvent, setPreviewEvent] = useState(null); // Event for Statement Preview Modal

  const [isPeriodicModalOpen, setIsPeriodicModalOpen] = useState(false);
  const [periodicModalType, setPeriodicModalType] = useState('monthly'); // 'monthly' | 'yearly' | 'all'
  const [activePeriodicStatementData, setActivePeriodicStatementData] = useState(null);

  const handleOpenPeriodicStatements = (type = 'monthly') => {
    setPeriodicModalType(type);
    setIsPeriodicModalOpen(true);
  };

  // Safe bidirectional sync with backend & MongoDB
  const handleSyncWithBackend = async (eventsToSync = events, categoriesToSync = categories) => {
    setIsSyncing(true);
    try {
      const health = await api.checkHealth();
      if (!health.connected) {
        setSyncStatus('offline');
        return { success: false, offline: true, error: health.error };
      }

      // Safe sync: upload local events to merge with MongoDB
      const res = await api.syncEvents(eventsToSync);
      if (res.success && Array.isArray(res.data)) {
        // Merge into React state and LocalStorage - ZERO DATA LOSS
        setEvents(res.data);
        saveStoredEvents(res.data);

        // Sync categories
        const catRes = await api.syncCategories(categoriesToSync);
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
          saveStoredCategories(catRes.data);
        }

        setSyncStatus('connected');
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(now);
        return { success: true, count: res.totalCount };
      } else {
        setSyncStatus('offline');
        return { success: false, error: res.error };
      }
    } catch (err) {
      console.warn('Backend sync failed:', err);
      setSyncStatus('offline');
      return { success: false, error: err.message };
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // 1. Instantly load from LocalStorage (ZERO latency, zero data loss)
    const loadedEvents = getStoredEvents();
    const loadedCategories = getStoredCategories();
    setEvents(loadedEvents);
    setCategories(loadedCategories);

    // 2. Silently attempt background sync with MongoDB if server is active
    api.checkHealth().then((health) => {
      if (health.connected) {
        setSyncStatus('connected');
        handleSyncWithBackend(loadedEvents, loadedCategories);
      } else {
        setSyncStatus('offline');
      }
    }).catch(() => {
      setSyncStatus('offline');
    });

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

  // Persist events helper (always guarantees local storage preservation)
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
    setActiveEventId(eventPayload.id);

    // Background push to MongoDB if backend is reachable
    api.saveEvent(eventPayload).then((res) => {
      if (res.success) {
        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    }).catch(() => {});
  };

  const handleUpdateEventFromPreview = (updatedEvt) => {
    const existingIndex = events.findIndex((e) => e.id === updatedEvt.id);
    if (existingIndex >= 0) {
      const updated = [...events];
      const mergedEvt = {
        ...updated[existingIndex],
        ...updatedEvt,
        updatedAt: new Date().toISOString(),
      };
      updated[existingIndex] = mergedEvt;
      updateEventsState(updated);
      setPreviewEvent(mergedEvt);

      // Background push to MongoDB
      api.saveEvent(mergedEvt).then((res) => {
        if (res.success) {
          setSyncStatus('connected');
        }
      }).catch(() => {});
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

    // Background push to MongoDB
    api.saveEvent(currentEvent).then((res) => {
      if (res.success) {
        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    }).catch(() => {});

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
        api.syncCategories(updatedCats).catch(() => {});
      }
    }
  };

  // --- CONFIRM DELETION ---
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'event') {
      const deletedId = deleteTarget.item.id;
      const updated = events.filter((e) => e.id !== deletedId);
      updateEventsState(updated);
      if (activeEventId === deletedId) {
        setActiveEventId(null);
      }
      // Delete from MongoDB in background
      api.deleteEvent(deletedId).then((res) => {
        if (res.success) {
          setSyncStatus('connected');
        }
      }).catch(() => {});
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

      // Save updated event to MongoDB in background
      api.saveEvent(currentEvent).then((res) => {
        if (res.success) {
          setSyncStatus('connected');
        }
      }).catch(() => {});
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
          onOpenPeriodicStatements={handleOpenPeriodicStatements}
          onOpenCloudSync={() => setIsCloudSyncOpen(true)}
          syncStatus={syncStatus}
          isSyncing={isSyncing}
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
              onOpenPeriodicStatements={handleOpenPeriodicStatements}
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

        {/* Monthly & Yearly Periodic Statement Modal */}
        <PeriodicStatementModal
          isOpen={isPeriodicModalOpen}
          onClose={() => setIsPeriodicModalOpen(false)}
          events={events}
          initialPeriodType={periodicModalType}
          initialYear={new Date().getFullYear()}
          initialMonth={new Date().getMonth() + 1}
          onSetActiveStatementData={setActivePeriodicStatementData}
        />

        {/* Cloud Sync & MongoDB Connection Modal */}
        <CloudSyncModal
          isOpen={isCloudSyncOpen}
          onClose={() => setIsCloudSyncOpen(false)}
          localEventsCount={events.length}
          onSyncSuccess={() => handleSyncWithBackend(events, categories)}
          syncStatus={syncStatus}
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
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
        {isPeriodicModalOpen && activePeriodicStatementData ? (
          <OfficialPeriodicStatementDocument statementData={activePeriodicStatementData} />
        ) : (
          <OfficialStatementDocument event={printTargetEvent} />
        )}
      </div>
    </>
  );
}
