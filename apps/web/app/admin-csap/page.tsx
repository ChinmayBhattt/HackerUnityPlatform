'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  RefreshCw,
  LogOut,
  Check,
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Trophy,
  Users,
  Building,
  Building2,
  Mail,
  Phone,
  Tag,
  Layers,
  FileText,
  Lock,
  User,
  Sparkles,
  Radio,
  Loader2,
  Globe,
  Trash2,
  ChevronDown,
  Info,
  ArrowUpRight,
  HelpCircle,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

interface AdminEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  tagline?: string;
  category: string;
  event_type: string;
  location: string;
  organizer_id?: string;
  organizer_name: string;
  organizer_avatar?: string;
  organizer_email?: string;
  organizer_phone?: string;
  host_type?: string;
  institution_name?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  registration_start?: string;
  total_prize_value: number;
  currency?: string;
  prizes?: any[];
  tracks?: any[];
  stages?: any[];
  faqs?: any[];
  sponsors?: any[];
  tags?: string[];
  min_team_size: number;
  max_team_size: number;
  is_team_event: boolean;
  featured: boolean;
  status: string;
  banner_url?: string;
  logo_url?: string;
  timezone?: string;
  eligibility?: string;
  difficulty?: string;
  rules_text?: string;
  custom_questions?: any[];
  admin_feedback?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminCsapPortal() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [username, setUsername] = useState('HU');
  const [password, setPassword] = useState('HU269');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard states
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT'>('PENDING');
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rejectModalEvent, setRejectModalEvent] = useState<AdminEvent | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  // ─── 1. Check existing session on load ──────────────────────────────────────
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin-csap');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setEvents(data.events || []);
          return;
        }
      }
      setIsAuthenticated(false);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // ─── 2. Fetch Events ────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/admin-csap');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setEvents(data.events || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // ─── 3. Realtime Supabase Subscription ──────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen to real-time broadcasts and Postgres changes on events
    const channel = supabase
      .channel('public:admin_csap_events_sync')
      .on('broadcast', { event: 'event_created' }, (payload) => {
        setNotificationMsg({
          type: 'success',
          text: `🔔 New hackathon submitted: "${payload?.payload?.event?.title || 'New Hackathon'}"`,
        });
        fetchEvents();
      })
      .on('broadcast', { event: 'event_updated' }, () => {
        fetchEvents();
      })
      .on('broadcast', { event: 'event_deleted' }, () => {
        fetchEvents();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, fetchEvents]);

  // Auto-dismiss notification toast
  useEffect(() => {
    if (notificationMsg) {
      const timer = setTimeout(() => setNotificationMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationMsg]);

  // ─── 4. Login Handler ───────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin-csap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        fetchEvents();
      } else {
        setLoginError(data.error || 'Invalid credentials. Access denied.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login connection failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ─── 5. Logout Handler ──────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await fetch('/api/admin-csap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } finally {
      setIsAuthenticated(false);
      setEvents([]);
      setSelectedEvent(null);
    }
  };

  // ─── 6. Approve Hackathon ───────────────────────────────────────────────────
  const handleApprove = async (event: AdminEvent) => {
    setActionLoadingId(event.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', eventId: event.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotificationMsg({
          type: 'success',
          text: `✅ "${event.title}" has been APPROVED and is now live on the main website!`,
        });
        // Optimistic update
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, status: 'PUBLISHED' } : e))
        );
        if (selectedEvent?.id === event.id) {
          setSelectedEvent((prev) => (prev ? { ...prev, status: 'PUBLISHED' } : null));
        }
      } else {
        setNotificationMsg({
          type: 'error',
          text: `Failed to approve: ${data.error || 'Unknown error'}`,
        });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── 7. Reject Hackathon ────────────────────────────────────────────────────
  const handleRejectConfirm = async () => {
    if (!rejectModalEvent) return;
    const event = rejectModalEvent;
    setActionLoadingId(event.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          eventId: event.id,
          feedback: rejectFeedback,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotificationMsg({
          type: 'success',
          text: `🚫 "${event.title}" has been rejected and will remain hidden from the website.`,
        });
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, status: 'REJECTED' } : e))
        );
        if (selectedEvent?.id === event.id) {
          setSelectedEvent((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
        }
        setRejectModalEvent(null);
        setRejectFeedback('');
      } else {
        setNotificationMsg({
          type: 'error',
          text: `Failed to reject: ${data.error || 'Unknown error'}`,
        });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Statistics ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const isPending = (e: AdminEvent) =>
      e.status === 'PENDING_APPROVAL' ||
      (e.status === 'DRAFT' && Array.isArray(e.tags) && e.tags.includes('PENDING_APPROVAL'));

    const isApproved = (e: AdminEvent) =>
      ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'].includes(
        e.status
      );

    const isRejected = (e: AdminEvent) => e.status === 'REJECTED';
    const isDraft = (e: AdminEvent) => e.status === 'DRAFT' && !isPending(e);

    return {
      total: events.length,
      pending: events.filter(isPending).length,
      approved: events.filter(isApproved).length,
      rejected: events.filter(isRejected).length,
      draft: events.filter(isDraft).length,
    };
  }, [events]);

  // ─── Filtered Events ────────────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Status filtering
      const isPending =
        e.status === 'PENDING_APPROVAL' ||
        (e.status === 'DRAFT' && Array.isArray(e.tags) && e.tags.includes('PENDING_APPROVAL'));
      const isApproved = [
        'PUBLISHED',
        'REGISTRATION_OPEN',
        'LIVE',
        'JUDGING',
        'COMPLETED',
        'ARCHIVED',
      ].includes(e.status);
      const isRejected = e.status === 'REJECTED';
      const isDraft = e.status === 'DRAFT' && !isPending;

      if (statusFilter === 'PENDING' && !isPending) return false;
      if (statusFilter === 'APPROVED' && !isApproved) return false;
      if (statusFilter === 'REJECTED' && !isRejected) return false;
      if (statusFilter === 'DRAFT' && !isDraft) return false;

      // Query filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title?.toLowerCase().includes(q);
        const matchOrg = e.organizer_name?.toLowerCase().includes(q);
        const matchInst = e.institution_name?.toLowerCase().includes(q);
        const matchSlug = e.slug?.toLowerCase().includes(q);
        const matchDesc = e.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchOrg && !matchInst && !matchSlug && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [events, statusFilter, searchQuery]);

  // ─── RENDER: Loading Initial State ──────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <p className="text-slate-400 text-sm tracking-wide">Authenticating Admin Channel...</p>
      </div>
    );
  }

  // ─── RENDER: Login Gate (If not authenticated) ───────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#060912] via-[#090e1c] to-[#04060c] flex items-center justify-center p-4">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#0b1224]/90 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-cyan-950/50">
            {/* Header / Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 text-cyan-400 mb-4 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                Hacker&apos;s Unity
                <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-mono">
                  CSAP
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                CENTRAL SUPER ADMIN PORTAL • RESTRICTED ACCESS
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-6 p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter admin username"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#080d1a] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Admin Security Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#080d1a] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" />
                    Access CSAP Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-[11px] text-slate-500 font-mono flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Real-time Database Connected
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: Authenticated Dashboard ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* ─── Top Admin Navigation Bar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0b1224]/90 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-black text-base shadow-lg shadow-cyan-500/20">
            HU
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">
                Hacker&apos;s Unity
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                ADMIN-CSAP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Hackathon Moderation & Real-Time Approval Engine
            </p>
          </div>
        </div>

        {/* Status indicator & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Realtime Live</span>
          </div>

          <button
            onClick={fetchEvents}
            disabled={loadingEvents}
            title="Refresh submissions"
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingEvents ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            title="Logout from admin panel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ─── Floating Toast Notification ──────────────────────────────────── */}
      {notificationMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-start gap-3 border transition-all animate-in fade-in slide-in-from-bottom-5 ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border-red-500/40 text-red-200'
          }`}
        >
          {notificationMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="text-sm font-medium flex-1">{notificationMsg.text}</div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Main Content Container ───────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Approval (Primary Attention) */}
          <div
            onClick={() => setStatusFilter('PENDING')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-[#0c1324] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Pending Review
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{stats.pending}</span>
              {stats.pending > 0 && (
                <span className="text-xs text-amber-400 font-semibold animate-pulse">
                  Needs Attention
                </span>
              )}
            </div>
          </div>

          {/* Approved & Live */}
          <div
            onClick={() => setStatusFilter('APPROVED')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'bg-[#0c1324] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Live on Website
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white">{stats.approved}</div>
          </div>

          {/* Rejected */}
          <div
            onClick={() => setStatusFilter('REJECTED')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'REJECTED'
                ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10'
                : 'bg-[#0c1324] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Rejected
              </span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white">{stats.rejected}</div>
          </div>

          {/* Total Submissions */}
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'ALL'
                ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'bg-[#0c1324] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Total Applications
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white">{stats.total}</div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0c1324] border border-slate-800 p-3 rounded-2xl">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { key: 'PENDING', label: 'Pending Review', count: stats.pending },
                { key: 'APPROVED', label: 'Approved', count: stats.approved },
                { key: 'REJECTED', label: 'Rejected', count: stats.rejected },
                { key: 'DRAFT', label: 'Drafts', count: stats.draft },
                { key: 'ALL', label: 'All', count: stats.total },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    statusFilter === tab.key ? 'bg-cyan-500 text-black font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hackathons or hosts..."
              className="w-full pl-9 pr-4 py-2 bg-[#070b14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* ─── Hackathon Submissions List ───────────────────────────────────── */}
        {loadingEvents ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading submitted applications...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 text-center bg-[#0c1324] border border-slate-800/80 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No applications found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {statusFilter === 'PENDING'
                ? 'All submitted hackathons have been reviewed! New submissions will appear here in real-time.'
                : 'No hackathons match the current filter or search criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const isPending =
                event.status === 'PENDING_APPROVAL' ||
                (event.status === 'DRAFT' &&
                  Array.isArray(event.tags) &&
                  event.tags.includes('PENDING_APPROVAL'));
              const isApproved = [
                'PUBLISHED',
                'REGISTRATION_OPEN',
                'LIVE',
                'JUDGING',
                'COMPLETED',
                'ARCHIVED',
              ].includes(event.status);
              const isRejected = event.status === 'REJECTED';

              return (
                <div
                  key={event.id}
                  className="bg-[#0c1324] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left info */}
                  <div className="flex-1 space-y-3">
                    {/* Header line: status + dates + category */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          PENDING APPROVAL
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          APPROVED & LIVE
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 font-bold flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          REJECTED
                        </span>
                      )}
                      {!isPending && !isApproved && !isRejected && (
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                          {event.status}
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono text-[11px]">
                        {event.category || 'HACKATHON'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono text-[11px]">
                        {event.event_type || 'ONLINE'}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Submitted {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        {event.title}
                        {isApproved && (
                          <Link
                            href={`/hackathons/${event.slug}`}
                            target="_blank"
                            className="text-cyan-400 hover:text-cyan-300"
                            title="Open public page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </h3>
                      {event.tagline && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {event.tagline}
                        </p>
                      )}
                    </div>

                    {/* Details grid: Host, Dates, Prize */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
                      {/* Host info */}
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="truncate">
                          <span className="text-slate-400 block text-[10px]">ORGANIZER</span>
                          <span className="font-semibold text-white truncate block">
                            {event.organizer_name || 'Independent'}
                          </span>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">EVENT TIMELINE</span>
                          <span className="font-semibold text-white block">
                            {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                            {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Prize */}
                      <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">TOTAL PRIZE</span>
                          <span className="font-bold text-amber-400 block">
                            {formatCurrency(event.total_prize_value || 0, (event.currency as 'INR' | 'USD') || 'INR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      Review Details
                    </button>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(event)}
                          disabled={actionLoadingId === event.id}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                          {actionLoadingId === event.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModalEvent(event)}
                          disabled={actionLoadingId === event.id}
                          className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}

                    {isApproved && (
                      <button
                        onClick={() => setRejectModalEvent(event)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 hover:text-red-300 text-slate-400 text-xs transition"
                      >
                        Revoke Approval
                      </button>
                    )}

                    {isRejected && (
                      <button
                        onClick={() => handleApprove(event)}
                        disabled={actionLoadingId === event.id}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Re-approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Detail Modal: Full Inspection ─────────────────────────────────── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b1224] border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-[#080d1a]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      selectedEvent.status === 'PUBLISHED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedEvent.status === 'REJECTED'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    STATUS: {selectedEvent.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedEvent.slug || selectedEvent.id}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{selectedEvent.title}</h2>
                <p className="text-xs text-slate-400">{selectedEvent.tagline}</p>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {/* Organizer Information Box */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Organizer & Institution Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Organizer Name</span>
                    <span className="font-semibold text-white">{selectedEvent.organizer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Host Entity</span>
                    <span className="font-semibold text-white">
                      {selectedEvent.institution_name || 'Independent / Community'} (
                      {selectedEvent.host_type || 'College'})
                    </span>
                  </div>
                  {selectedEvent.organizer_email && (
                    <div>
                      <span className="text-slate-500 block">Email</span>
                      <span className="font-semibold text-white">{selectedEvent.organizer_email}</span>
                    </div>
                  )}
                  {selectedEvent.organizer_phone && (
                    <div>
                      <span className="text-slate-500 block">Phone</span>
                      <span className="font-semibold text-white">{selectedEvent.organizer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Timeline & Location */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule & Format
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block">Category</span>
                    <span className="font-semibold text-white">{selectedEvent.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mode</span>
                    <span className="font-semibold text-white">{selectedEvent.event_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Location / Venue</span>
                    <span className="font-semibold text-white">{selectedEvent.location || 'Online'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Start Date</span>
                    <span className="font-semibold text-white">
                      {new Date(selectedEvent.start_date).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">End Date</span>
                    <span className="font-semibold text-white">
                      {new Date(selectedEvent.end_date).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Reg. Deadline</span>
                    <span className="font-semibold text-white">
                      {new Date(selectedEvent.registration_deadline).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Description / Pitch
                </h4>
                <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 text-slate-300 text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedEvent.description}
                </div>
              </div>

              {/* Prizes & Tracks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Prizes */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" />
                      Prize Pool
                    </h4>
                    <span className="font-black text-amber-400 text-sm">
                      {formatCurrency(selectedEvent.total_prize_value || 0, (selectedEvent.currency as 'INR' | 'USD') || 'INR')}
                    </span>
                  </div>
                  {Array.isArray(selectedEvent.prizes) && selectedEvent.prizes.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      {selectedEvent.prizes.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 text-[11px]"
                        >
                          <span className="font-semibold text-white">{p.title || `Rank ${idx + 1}`}</span>
                          <span className="font-mono text-amber-300">
                            {formatCurrency(p.amount || 0, (selectedEvent.currency as 'INR' | 'USD') || 'INR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">No individual prize tiers specified.</p>
                  )}
                </div>

                {/* Tracks */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Problem Tracks ({selectedEvent.tracks?.length || 0})
                  </h4>
                  {Array.isArray(selectedEvent.tracks) && selectedEvent.tracks.length > 0 ? (
                    <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto">
                      {selectedEvent.tracks.map((t, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-800/50 text-[11px]">
                          <span className="font-bold text-white block">{t.title || t.name}</span>
                          {t.description && (
                            <span className="text-slate-400 line-clamp-1 text-[10px]">
                              {t.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">Open Innovation / No specific tracks.</p>
                  )}
                </div>
              </div>

              {/* Team Settings */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Team Size:</span>
                <span className="font-bold text-white">
                  {selectedEvent.min_team_size} to {selectedEvent.max_team_size} members
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-[#080d1a] flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setRejectModalEvent(selectedEvent);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs transition"
              >
                Reject Request
              </button>

              <button
                onClick={() => {
                  handleApprove(selectedEvent);
                  setSelectedEvent(null);
                }}
                disabled={actionLoadingId === selectedEvent.id}
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {actionLoadingId === selectedEvent.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve & Publish to Website
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Reason Modal ────────────────────────────────────────────── */}
      {rejectModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1224] border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Hackathon Application</h3>
                <p className="text-xs text-slate-400">
                  {rejectModalEvent.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              This will set the hackathon status to <span className="text-red-400 font-mono">REJECTED</span>. It will NOT appear publicly on the Hacker&apos;s Unity website.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Feedback / Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="e.g. Incomplete prize details or unverifiable institution credentials..."
                rows={3}
                className="w-full p-3 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setRejectModalEvent(null);
                  setRejectFeedback('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoadingId === rejectModalEvent.id}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center gap-2"
              >
                {actionLoadingId === rejectModalEvent.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
