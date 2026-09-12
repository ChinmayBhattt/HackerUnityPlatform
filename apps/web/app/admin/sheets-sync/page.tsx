'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  ArrowLeft,
  Loader2,
  Table as TableIcon,
  Play,
  Clock,
  Sparkles,
  Database,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@hackers-unity/shared-types';

interface TableStatus {
  table: string;
  sheetName: string;
  primaryKey: string;
  description?: string;
  existsInSpreadsheet: boolean;
  sheetId: number | null;
  rowCount: number | null;
}

interface SyncStatusResponse {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  connectionStatus: 'CONNECTED' | 'ERROR';
  connectionError: string | null;
  configuredTablesCount: number;
  tables: TableStatus[];
}

export default function AdminSheetsSyncPage() {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingTable, setSyncingTable] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<SyncStatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSyncLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 99)]);
  };

  const loadStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/sync-sheets');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Status fetch failed: ${text}`);
      }
      const json = await res.json();
      setStatusData(json);
      addLog(`Status refreshed. ${json.configuredTablesCount} tables configured.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to inspect Google Sheets status');
      addLog(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)) {
      loadStatus();
    }
  }, [user]);

  const handleSyncAll = async () => {
    if (syncingAll) return;
    setSyncingAll(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    addLog('Starting Full Synchronization for all 15 tables...');

    try {
      const res = await fetch('/api/admin/sync-sheets', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Full sync encountered errors');
      }

      setSuccessMsg(
        `Successfully synced all tables! Total records mirrored: ${data.totalRows} across 15 tabs in ${data.totalDurationMs}ms`
      );
      addLog(
        `Full sync completed. Total rows: ${data.totalRows} in ${data.totalDurationMs}ms.`
      );

      (data.results || []).forEach((r: any) => {
        addLog(
          `Tab "${r.sheetName}": ${r.rowsSynced} rows synced (${r.durationMs}ms)`
        );
      });

      // Refresh status table
      await loadStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete full sync');
      addLog(`Sync error: ${err.message}`);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncSingle = async (tableName: string) => {
    if (syncingTable) return;
    setSyncingTable(tableName);
    setErrorMsg(null);
    setSuccessMsg(null);
    addLog(`Starting sync for table "${tableName}"...`);

    try {
      const res = await fetch(`/api/admin/sync-sheets?table=${tableName}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to sync table "${tableName}"`);
      }

      setSuccessMsg(
        `Table "${tableName}" synced: ${data.result?.rowsSynced} rows written to "${data.result?.sheetName}" in ${data.result?.durationMs}ms`
      );
      addLog(
        `Table "${tableName}" synced (${data.result?.rowsSynced} rows in ${data.result?.durationMs}ms)`
      );

      await loadStatus();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to sync table "${tableName}"`);
      addLog(`Sync error for "${tableName}": ${err.message}`);
    } finally {
      setSyncingTable(null);
    }
  };

  // Auth Guard
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-[#0099e6] animate-spin" />
      </div>
    );
  }

  const isAdmin =
    user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Admin Access Required
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Only Hacker&apos;s Unity Administrators can view and execute Google Sheets synchronization.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 px-5 py-2.5 rounded-2xl bg-[#0099e6] text-white text-xs font-bold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const spreadsheetUrl =
    statusData?.spreadsheetUrl ||
    'https://docs.google.com/spreadsheets/d/104nHo8CjXSjDLlQ6kKr28jwfC0YD2Zrip_ZY6OxAZuE/edit';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* ─── Breadcrumb & Top Bar ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Sheets Database Mirror</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Supabase &rarr; Google Sheets Synchronization
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Realtime database replication and full bulk synchronization across all 15 Hacker&apos;s Unity tables.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 dark:bg-[#0c1017] dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Open Google Spreadsheet</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <button
            type="button"
            onClick={loadStatus}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 dark:bg-[#0c1017] dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncingAll || loading}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0099e6] to-[#059669] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {syncingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{syncingAll ? 'Syncing 15 Tables...' : 'Sync All Tables Now'}</span>
          </button>
        </div>
      </div>

      {/* ─── Alerts ─────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Sync Error: </span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* ─── Connection & Info Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Connection Status */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Google Spreadsheet
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {statusData?.connectionStatus === 'CONNECTED' ? 'Connected & Active' : 'Connecting...'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono block truncate mt-0.5">
              ID: {statusData?.spreadsheetId || '104nHo8...'}
            </span>
          </div>
        </div>

        {/* Card 2: Service Account */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Service Account
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate mt-1">
              hackers-unity-sheets
            </span>
            <span className="text-[10px] text-slate-500 font-mono block truncate mt-0.5">
              premium-catbird-457008-b2.iam.gserviceaccount.com
            </span>
          </div>
        </div>

        {/* Card 3: Tables Configured */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Configured Tables
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {statusData?.configuredTablesCount || 15}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
              15 dedicated spreadsheet tabs
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2-Column: Table Directory & Live Logs ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Table Directory (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-[#0099e6]" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Mapped Database Tables & Tabs
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              15 Tables Configured
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.08] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Supabase Table</th>
                  <th className="py-3 px-4">Google Sheet Tab</th>
                  <th className="py-3 px-4">Primary Key</th>
                  <th className="py-3 px-4">Tab Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {(statusData?.tables || []).map((row) => (
                  <tr
                    key={row.table}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {row.table}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{row.sheetName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {row.primaryKey}
                    </td>
                    <td className="py-3 px-4">
                      {row.existsInSpreadsheet ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Tab Exists</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-500">
                          Auto-created on sync
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSyncSingle(row.table)}
                        disabled={syncingTable === row.table || syncingAll}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {syncingTable === row.table ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#0099e6]" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        <span>Sync</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Execution Logs (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] rounded-3xl shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Live Execution Logs
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSyncLogs([])}
              className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="h-[420px] rounded-2xl bg-slate-950 p-3.5 overflow-y-auto font-mono text-[11px] text-emerald-400/90 leading-relaxed border border-slate-800 space-y-1">
            {syncLogs.length === 0 ? (
              <div className="text-slate-500 italic py-4 text-center">
                Ready for sync. Click &quot;Sync All Tables Now&quot; to begin.
              </div>
            ) : (
              syncLogs.map((log, idx) => (
                <div key={idx} className="break-words">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
