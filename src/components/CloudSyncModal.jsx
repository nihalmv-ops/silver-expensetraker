import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  CloudOff, 
  RefreshCw, 
  Database, 
  Server, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Check, 
  ExternalLink,
  Laptop
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, api } from '../utils/api';

export default function CloudSyncModal({ 
  isOpen, 
  onClose, 
  localEventsCount = 0,
  onSyncSuccess,
  syncStatus,
  isSyncing,
  lastSyncTime
}) {
  const [backendUrl, setBackendUrlInput] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);
  const [localSyncing, setLocalSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBackendUrlInput(getApiBaseUrl());
      setConnectionResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    setApiBaseUrl(backendUrl);

    try {
      const health = await api.checkHealth();
      setConnectionResult(health);
      if (health.connected && onSyncSuccess) {
        // Trigger a background sync after successful health check
        onSyncSuccess();
      }
    } catch (err) {
      setConnectionResult({ connected: false, error: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleManualSync = async () => {
    if (onSyncSuccess) {
      setLocalSyncing(true);
      try {
        await onSyncSuccess();
      } finally {
        setLocalSyncing(false);
      }
    }
  };

  const isConnected = syncStatus === 'connected' || (connectionResult && connectionResult.connected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-slate-700/60 text-slate-300'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Database & Cloud Sync</h3>
              <p className="text-xs text-slate-300">Node.js Express + MongoDB Backend</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Current Status Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isConnected 
              ? 'bg-emerald-50/70 border-emerald-200' 
              : 'bg-amber-50/70 border-amber-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-lg ${isConnected ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                  {isConnected ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isConnected ? 'MongoDB Cloud Database Connected' : 'Offline / LocalStorage Mode'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isConnected 
                      ? 'Live bidirectional sync with MongoDB is active. Your data is backed up both locally and in the cloud.' 
                      : 'All records are saved securely inside your browser LocalStorage. Data is 100% safe and retained.'}
                  </p>
                  {lastSyncTime && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Last synchronized: <span className="font-semibold text-slate-700">{lastSyncTime}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isConnected ? 'ONLINE' : 'LOCAL ONLY'}
                </span>
              </div>
            </div>
          </div>

          {/* Guaranteed Zero Data Loss Alert */}
          <div className="flex items-start gap-3 p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900 text-xs">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Zero Data Loss Guarantee:</span>
              <span className="text-blue-800 block mt-0.5">
                Existing LocalStorage data is <strong>never erased or overwritten</strong>. When connected, local events are seamlessly uploaded and merged into MongoDB.
              </span>
            </div>
          </div>

          {/* Server URL Configuration */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Backend API URL
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Server className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrlInput(e.target.value)}
                  placeholder="http://localhost:5050"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-mono text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveAndTest}
                disabled={testingConnection}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test & Save'
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setBackendUrlInput('https://silver-expensetraker.onrender.com')}
                className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors font-medium flex items-center gap-1 cursor-pointer"
              >
                <Cloud className="w-3 h-3" /> Render Cloud
              </button>
              <button
                type="button"
                onClick={() => setBackendUrlInput('http://localhost:5050')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors font-medium flex items-center gap-1 cursor-pointer"
              >
                <Laptop className="w-3 h-3" /> Localhost:5050
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Live Cloud: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">https://silver-expensetraker.onrender.com</code>
            </p>
          </div>

          {/* Test connection feedback */}
          {connectionResult && (
            <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${
              connectionResult.connected 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {connectionResult.connected ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>
                  {connectionResult.connected 
                    ? `Connected successfully! Database status: ${connectionResult.database || 'online'}` 
                    : `Cannot reach backend (${connectionResult.error})`}
                </span>
              </div>
            </div>
          )}

          {/* Data Statistics & Sync Action */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Local Events Loaded</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">
                {localEventsCount} {localEventsCount === 1 ? 'Event' : 'Events'}
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing || localSyncing}
              className="px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(isSyncing || localSyncing) ? 'animate-spin' : ''}`} />
              {isSyncing || localSyncing ? 'Syncing with MongoDB...' : 'Sync Now with Cloud'}
            </button>
          </div>

          {/* Setup Instructions Accordion/Help */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-slate-600" />
              How to start your MongoDB Backend
            </h5>
            
            <div className="text-xs text-slate-700 space-y-2">
              <div className="flex items-start gap-2">
                <span className="bg-slate-200 text-slate-800 font-bold w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  Open terminal in project directory:
                  <div className="bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] my-1 selection:bg-emerald-800">
                    cd backend &amp;&amp; npm install &amp;&amp; npm run dev
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-slate-200 text-slate-800 font-bold w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  Configure MongoDB connection in <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[11px]">backend/.env</code>:
                  <div className="bg-slate-900 text-slate-300 p-2 rounded-lg font-mono text-[11px] my-1">
                    MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/silver_catering
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-slate-200 text-slate-800 font-bold w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  Click <strong>"Test &amp; Save"</strong> above. All your events will auto-sync to MongoDB instantly!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
