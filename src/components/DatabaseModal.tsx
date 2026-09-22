import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Copy, Check, RefreshCw, Layers } from 'lucide-react';
import { DatabaseHealth } from '../services/api';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbHealth: DatabaseHealth | null;
  onRefreshHealth: () => void;
  onSeedDatabase: () => void;
  schemaSql: string;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  dbHealth,
  onRefreshHealth,
  onSeedDatabase,
  schemaSql,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'schema'>('status');

  if (!isOpen) return null;

  const handleCopySchema = () => {
    if (!schemaSql) return;
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConnected = dbHealth?.connected ?? false;
  const isConfigured = dbHealth?.configured ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div
        id="database-management-modal"
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Supabase PostgreSQL Backend</h2>
              <p className="text-xs text-stone-400">Database migration & table synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-2">
          <button
            onClick={() => setActiveSubTab('status')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'status'
                ? 'border-amber-600 text-amber-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Connection & Tables</span>
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'schema'
                ? 'border-amber-600 text-amber-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL Schema (SQL)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeSubTab === 'status' && (
            <div className="space-y-5">
              {/* Connection Status Card */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  isConnected
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : isConfigured
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                {isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 text-xs leading-relaxed">
                  <div className="flex items-center justify-between font-bold text-sm mb-1">
                    <span>{isConnected ? 'Connected to Supabase PostgreSQL' : isConfigured ? 'Supabase Credentials Found' : 'Operating in Safe Local Cache Mode'}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/80 border border-current">
                      {dbHealth?.database || 'PostgreSQL'}
                    </span>
                  </div>
                  <p className="opacity-90">{dbHealth?.message}</p>
                </div>
              </div>

              {/* Verified Tables Grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Database Tables & Row Counts
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-center">
                    <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wide block">
                      public.tasks
                    </span>
                    <span className="text-xl font-extrabold text-stone-900 mt-1 block">
                      {dbHealth?.tables.tasks ?? 0}
                    </span>
                    <span className="text-[10px] text-stone-600">Bakery tasks</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-center">
                    <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wide block">
                      public.projects
                    </span>
                    <span className="text-xl font-extrabold text-stone-900 mt-1 block">
                      {dbHealth?.tables.projects ?? 0}
                    </span>
                    <span className="text-[10px] text-stone-600">Wholesale orders</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-center">
                    <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wide block">
                      public.ovens
                    </span>
                    <span className="text-xl font-extrabold text-stone-900 mt-1 block">
                      {dbHealth?.tables.ovens ?? 0}
                    </span>
                    <span className="text-[10px] text-stone-600">Ovens telemetry</span>
                  </div>
                </div>
              </div>

              {/* Migration Architecture Details */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs text-stone-700 space-y-2">
                <p className="font-bold text-stone-900">PostgreSQL Migration Architecture:</p>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  <li>Direct backend ORM/client connection via <code className="text-amber-800 font-mono">@supabase/supabase-js</code>.</li>
                  <li>Type-safe serialization between camelCase client domain and PostgreSQL snake_case columns.</li>
                  <li>Foreign key constraints between <code className="text-amber-800 font-mono">tasks.project_id</code> and <code className="text-amber-800 font-mono">projects.id</code>.</li>
                  <li>Row-Level Security (RLS) policies configured for verified operational access.</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={onRefreshHealth}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-check Connection</span>
                </button>

                <button
                  onClick={onSeedDatabase}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <span>Sync Initial Dataset to Supabase</span>
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-600">
                  Run this SQL in your Supabase SQL Editor to create tables, indexes, and initial data:
                </p>
                <button
                  onClick={handleCopySchema}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-stone-900 text-stone-100 hover:bg-stone-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="p-4 bg-stone-900 text-stone-200 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-96 border border-stone-800">
                {schemaSql || '-- Loading schema...'}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
