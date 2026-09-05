'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ArrowLeft,
  Check,
  X,
  ExternalLink,
  FileSpreadsheet,
  Upload,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getEventRegistrations,
  updateRegistrationStatus,
  getRegistrationStats,
  EventRegistration,
  getAllEvents,
  deleteEventRegistration,
  deleteBulkEventRegistrations,
  clearAllEventRegistrations,
} from '@/lib/storage';
import { ExtendedEvent } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { BulkRegistrationModal } from '@/components/bulk-registration-modal';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default function EventRegistrationsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const loadData = () => {
    const all = getAllEvents();
    const found = all.find((e) => e.id === resolvedParams.eventId || e.slug === resolvedParams.eventId);
    if (found) {
      setEvent(found);
      const regs = getEventRegistrations(found.id);
      setRegistrations(regs);
      setStats(getRegistrationStats(found.id));
    }
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('hackers_unity_storage_change', handleStorage);
    return () => window.removeEventListener('hackers_unity_storage_change', handleStorage);
  }, [resolvedParams.eventId]);

  // Status changes
  const handleStatusChange = (regId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    if (!event) return;
    updateRegistrationStatus(event.id, regId, newStatus);
    loadData();
  };

  // Single delete
  const handleDeleteSingle = (regId: string, name: string) => {
    if (!event) return;
    deleteEventRegistration(event.id, regId);
    setSelectedIds((prev) => prev.filter((id) => id !== regId));
    loadData();
    setNotification({
      text: `Deleted registration for ${name}.`,
      type: 'info',
    });
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'info' ? null : curr));
    }, 4000);
  };

  // Bulk status update
  const handleBulkStatusChange = (status: 'APPROVED' | 'REJECTED') => {
    if (!event || selectedIds.length === 0) return;
    selectedIds.forEach((id) => updateRegistrationStatus(event.id, id, status));
    loadData();
    setNotification({
      text: `Updated ${selectedIds.length} applicants to ${status}.`,
      type: 'success',
    });
    setSelectedIds([]);
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'success' ? null : curr));
    }, 4000);
  };

  // Bulk delete selected
  const handleBulkDeleteSelected = () => {
    if (!event || selectedIds.length === 0) return;
    const count = deleteBulkEventRegistrations(event.id, selectedIds);
    setSelectedIds([]);
    loadData();
    setNotification({
      text: `Successfully deleted ${count} registrations.`,
      type: 'success',
    });
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'success' ? null : curr));
    }, 5000);
  };

  // Clear all registrations
  const handleClearAll = () => {
    if (!event) return;
    const count = clearAllEventRegistrations(event.id);
    setShowClearModal(false);
    setSelectedIds([]);
    loadData();
    setNotification({
      text: `Cleared all ${count} registrations successfully.`,
      type: 'success',
    });
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'success' ? null : curr));
    }, 6000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!event) return;
    const headers = ['Name', 'Email', 'Phone', 'College', 'City', 'GitHub', 'LinkedIn', 'Skills', 'Status', 'Registered At'];
    const rows = filteredRegistrations.map((r) => [
      `"${r.userName || ''}"`,
      `"${r.userEmail || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.college || ''}"`,
      `"${r.city || ''}"`,
      `"${r.githubUrl || ''}"`,
      `"${r.linkedinUrl || ''}"`,
      `"${(r.skills || []).join('; ')}"`,
      `"${r.status}"`,
      `"${r.registeredAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event.slug}-registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        (r.college && r.college.toLowerCase().includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'APPROVED' && (r.status === 'APPROVED' || r.status === 'CONFIRMED')) ||
        r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchQuery, statusFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage, pageSize]);

  // Selection handlers
  const isAllPageSelected =
    paginatedRegistrations.length > 0 &&
    paginatedRegistrations.every((r) => selectedIds.includes(r.id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedRegistrations.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...paginatedRegistrations.map((r) => r.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0099e6] font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Organizer Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Manage Registrations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {event ? (
              <>
                Showing hacker applicants for <strong className="text-slate-900">{event.title}</strong>
              </>
            ) : (
              'Loading hackathon data...'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-linear-to-r from-[#0099e6] to-[#0077b6] hover:from-[#0088cc] hover:to-[#00669e] text-white text-xs font-bold transition-all shadow-xs hover:shadow flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={registrations.length === 0}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            disabled={registrations.length === 0}
            className="px-4 py-2.5 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete all registration data"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Delete All</span>
          </button>
        </div>
      </div>

      {/* ─── Success / Info Alert Notification ──────────────────── */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : notification.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            ) : notification.type === 'info' ? (
              <Users className="w-5 h-5 text-[#0099e6] shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Applicants</span>
            <Users className="w-4 h-4 text-[#0099e6]" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.total}</div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">{stats.approved}</div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">{stats.pending}</div>
        </div>

        <div className="p-5 rounded-2xl bg-red-50/60 border border-red-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700">Rejected</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-900 font-mono">{stats.rejected}</div>
        </div>
      </div>

      {/* ─── Filter & Search Bar ────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by hacker name, email, college, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#0099e6]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-[#0099e6] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {filter === 'ALL' ? 'All Applicants' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Bulk Action Bar (When rows are selected) ─────────────── */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-full bg-[#0099e6] text-white text-[11px] font-black font-mono">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">applicants selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkStatusChange('APPROVED')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Selected</span>
            </button>

            <button
              onClick={() => handleBulkStatusChange('REJECTED')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Selected</span>
            </button>

            <button
              onClick={handleBulkDeleteSelected}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* ─── Registrations Table ────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredRegistrations.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No applicants found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'Registrations will appear here in real-time as builders apply or when uploaded.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAllPage}
                      className="rounded border-slate-300 text-[#0099e6] focus:ring-[#0099e6] cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">College / City</th>
                  <th className="py-3.5 px-4">Profiles & Skills</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedRegistrations.map((reg) => {
                  const isSelected = selectedIds.includes(reg.id);
                  return (
                    <tr
                      key={reg.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(reg.id)}
                          className="rounded border-slate-300 text-[#0099e6] focus:ring-[#0099e6] cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{reg.userName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{reg.userEmail}</div>
                        {reg.phone && <div className="text-[10px] text-slate-400">{reg.phone}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{reg.college || '—'}</div>
                        <div className="text-[11px] text-slate-500">{reg.city || '—'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          {reg.githubUrl && (
                            <a
                              href={reg.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0099e6] hover:underline text-[11px] font-semibold inline-flex items-center gap-0.5"
                            >
                              GitHub <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {reg.linkedinUrl && (
                            <a
                              href={reg.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0099e6] hover:underline text-[11px] font-semibold inline-flex items-center gap-0.5"
                            >
                              LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(reg.skills || []).slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {formatDate(reg.registeredAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        {reg.status === 'APPROVED' || reg.status === 'CONFIRMED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Approved
                          </span>
                        ) : reg.status === 'REJECTED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Review
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleStatusChange(reg.id, 'APPROVED')}
                            title="Approve Applicant"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer border border-emerald-200"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(reg.id, 'REJECTED')}
                            title="Reject Applicant"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer border border-amber-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(reg.id, reg.userName)}
                            title="Delete Applicant"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer border border-red-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination Footer ──────────────────────────────────── */}
        {filteredRegistrations.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-500">
              <span>
                Showing{' '}
                <strong className="text-slate-800 font-mono">
                  {(currentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-800 font-mono">
                  {Math.min(currentPage * pageSize, filteredRegistrations.length)}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-800 font-mono">
                  {filteredRegistrations.length.toLocaleString()}
                </strong>{' '}
                applicants
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="text-slate-600 font-bold font-mono px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Clear All Registrations Confirmation Modal ─────────── */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Delete All Registrations?
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete all{' '}
                <strong className="text-slate-800 font-mono">
                  {registrations.length.toLocaleString()}
                </strong>{' '}
                registrations for <strong className="text-slate-800">{event?.title}</strong>? This
                action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bulk Registration Modal ────────────────────────────── */}
      {event && (
        <BulkRegistrationModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          eventId={event.id}
          eventName={event.title}
          onSuccess={({ added, updated, total }) => {
            loadData();
            setNotification({
              text: `Successfully imported registrations! Added ${added} new applicants, updated ${updated} existing. Total now: ${total.toLocaleString()}.`,
              type: 'success',
            });
            setTimeout(() => {
              setNotification((curr) => (curr?.type === 'success' ? null : curr));
            }, 8000);
          }}
        />
      )}
    </div>
  );
}


