'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Bookmark,
  Users,
  Settings,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Phone,
  Mail,
  User as UserIcon,
  Shield,
  Loader2,
  Plus,
  X as XIcon,
  BarChart3,
  Edit3,
  Trash2,
  ExternalLink,
  PlusCircle,
  Eye,
  Download,
  Flame,
  Calendar,
  MapPin,
  TrendingUp,
  Globe,
  Activity,
  Sparkles,
  Share2,
  Compass,
  Filter,
  Layers,
  ArrowUpRight,
  Search,
  Zap,
  Briefcase,
  Megaphone,
  Check,
  Clock,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import {
  getMyRegistrations,
  getBookmarkedEventIds,
  getAllEvents,
  updateHostedEvent,
  deleteHostedEvent,
  syncBookmarksWithSupabase,
  UserRegistrationItem,
} from '@/lib/storage';
import { ExtendedEvent } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import {
  updateEventInSupabase,
  deleteEventInSupabase,
  fetchPublishedEvents,
  fetchUserRegistrations,
  fetchOrganizerEvents,
} from '@/lib/supabase-service';
import { supabase } from '@/lib/supabase';
import { HackathonCard } from '@/components/hackathon-card';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AuthModal } from '@/components/auth-modal';
import { EditEventModal } from '@/components/edit-event-modal';
import { PublicProfileModal } from '@/components/public-profile-modal';
import { useUserTeams, useMyInvites } from '@/lib/hooks/use-team-invites';
import { fetchTeamInvites, sendTeamInvite } from '@/lib/supabase-service';
import { UserRole } from '@hackers-unity/shared-types';

export default function DashboardPage() {
  const { user, supabaseUser, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // Active Tab in the Left Sidebar
  const [activeTab, setActiveTab] = useState<
    'overview' | 'participations' | 'organizing' | 'bookmarks' | 'teams'
  >('overview');

  // Realtime Data States
  const [registrations, setRegistrations] = useState<UserRegistrationItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [allEvents, setAllEvents] = useState<ExtendedEvent[]>([]);
  const [myHostedEvents, setMyHostedEvents] = useState<ExtendedEvent[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filter States
  const [partFilter, setPartFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [partSearch, setPartSearch] = useState('');
  const [hostFilter, setHostFilter] = useState<'ALL' | 'LIVE' | 'COMPLETED' | 'DRAFT'>('ALL');
  const [hostSearch, setHostSearch] = useState('');

  // Chart State
  const [activeChartPoint, setActiveChartPoint] = useState<number>(5);

  // Modals
  const [editingEvent, setEditingEvent] = useState<ExtendedEvent | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewingHackersEvent, setViewingHackersEvent] = useState<ExtendedEvent | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<ExtendedEvent | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showPublicProfileModal, setShowPublicProfileModal] = useState(false);

  // Teams & Invites count
  const { userTeams } = useUserTeams();
  const { pendingInvites } = useMyInvites();

  const userId = supabaseUser?.id || user?.id;

  // ─── 1. DYNAMIC DATA LOADER ────────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Fetch published events
      const published = await fetchPublishedEvents();
      const localEvents = getAllEvents();
      const eventMap = new Map<string, ExtendedEvent>();
      localEvents.forEach((e) => eventMap.set(e.id, e));
      published.forEach((e) => eventMap.set(e.id, e));
      const combinedEvents = Array.from(eventMap.values());
      setAllEvents(combinedEvents);

      // 2. Fetch User Registrations (Remote + Local fallback)
      let userRegs: UserRegistrationItem[] = [];
      if (userId && userId.length > 10 && userId.includes('-')) {
        const remoteRegs = await fetchUserRegistrations(userId);
        if (remoteRegs && remoteRegs.length > 0) {
          userRegs = remoteRegs.map((r: any) => ({
            eventId: r.event_id,
            eventName: r.events?.title || r.events?.name || 'Registered Hackathon',
            registeredAt: r.registered_at,
            teamName: r.team_name,
            isTeam: r.is_team,
            role: r.role || 'Participant',
            status: r.status || 'CONFIRMED',
          }));
        }
      }
      // Merge with local registrations
      const localRegs = getMyRegistrations();
      const regMap = new Map<string, UserRegistrationItem>();
      localRegs.forEach((r) => regMap.set(r.eventId, r));
      userRegs.forEach((r) => regMap.set(r.eventId, r));
      setRegistrations(Array.from(regMap.values()));

      // 3. Fetch User Hosted Events
      if (userId && userId.length > 10 && userId.includes('-')) {
        const hosted = await fetchOrganizerEvents(userId);
        if (hosted && hosted.length > 0) {
          setMyHostedEvents(hosted);
        } else if (
          user?.role === UserRole.ADMIN ||
          user?.role === UserRole.SUPER_ADMIN ||
          user?.role === UserRole.ORGANIZER
        ) {
          // If admin/organizer, show all managed events
          setMyHostedEvents(combinedEvents);
        } else {
          // Check local custom events
          const custom = combinedEvents.filter((e) => e.organizerId === userId || e.id.startsWith('evt_'));
          setMyHostedEvents(custom);
        }
      } else {
        const custom = combinedEvents.filter((e) => e.organizerId === 'usr_organizer' || e.id.startsWith('evt_'));
        setMyHostedEvents(custom.length > 0 ? custom : combinedEvents.slice(0, 3));
      }

      // 4. Bookmarks
      const bMarks = getBookmarkedEventIds();
      setBookmarkedIds(bMarks);
      if (userId && userId.length > 10 && userId.includes('-')) {
        syncBookmarksWithSupabase(userId).then((ids) => {
          if (ids && ids.length > 0) setBookmarkedIds(ids);
        });
      }
    } catch (err) {
      console.warn('Dashboard data load warning:', err);
    } finally {
      setLoadingData(false);
    }
  }, [userId, user?.role]);

  // ─── 2. REALTIME SUBSCRIPTIONS & EVENT LISTENERS ────────────────────────────
  useEffect(() => {
    loadDashboardData();

    // Listen to local storage changes
    const handleStorage = () => {
      loadDashboardData();
    };
    window.addEventListener('hackers_unity_storage_change', handleStorage);

    // Setup Supabase Realtime Channels for instant updates
    const eventsChannel = supabase
      .channel('dashboard_events_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks' },
        () => {
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_invitations' },
        () => {
          loadDashboardData();
        }
      )
      .on('broadcast', { event: 'registration_created' }, () => {
        loadDashboardData();
      })
      .on('broadcast', { event: 'event_created' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      window.removeEventListener('hackers_unity_storage_change', handleStorage);
      supabase.removeChannel(eventsChannel);
    };
  }, [loadDashboardData]);

  // ─── 3. DYNAMIC COMPUTED METRICS ───────────────────────────────────────────
  const bookmarkedEvents = allEvents.filter(
    (e) => bookmarkedIds.includes(e.id) || (e.slug && bookmarkedIds.includes(e.slug))
  );

  const totalBuildersCount = allEvents.reduce(
    (acc, e) => acc + (Number(e.registrationCount || e.participantsCount) || 500),
    0
  );
  const totalPrizeSum = allEvents.reduce((acc, e) => acc + (e.totalPrizeValue || 0), 0);
  const liveEventsCount = allEvents.filter((e) => e.status !== 'COMPLETED' && e.status !== 'DRAFT').length;

  // Filtered Participations
  const filteredParticipations = registrations.filter((reg) => {
    const matchedEvent = allEvents.find((e) => e.id === reg.eventId || e.slug === reg.eventId);
    if (partFilter === 'ACTIVE' && matchedEvent?.status === 'COMPLETED') return false;
    if (partFilter === 'COMPLETED' && matchedEvent?.status !== 'COMPLETED') return false;
    if (partSearch.trim()) {
      const q = partSearch.toLowerCase();
      const matchName = reg.eventName?.toLowerCase().includes(q);
      const matchTeam = reg.teamName?.toLowerCase().includes(q);
      return matchName || matchTeam;
    }
    return true;
  });

  // Filtered Hosted Events
  const filteredHostedEvents = myHostedEvents.filter((evt) => {
    if (hostFilter === 'LIVE' && (evt.status === 'COMPLETED' || evt.status === 'DRAFT')) return false;
    if (hostFilter === 'COMPLETED' && evt.status !== 'COMPLETED') return false;
    if (hostFilter === 'DRAFT' && evt.status !== 'DRAFT') return false;
    if (hostSearch.trim()) {
      const q = hostSearch.toLowerCase();
      return evt.title.toLowerCase().includes(q) || evt.slug.toLowerCase().includes(q);
    }
    return true;
  });

  // Event Management Handlers
  const handleEditEventSave = async (updated: ExtendedEvent) => {
    updateHostedEvent(updated);
    await updateEventInSupabase(updated.id, updated);
    loadDashboardData();
    setActionSuccessMsg(`"${updated.title}" was updated successfully.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleDeleteEventConfirm = async () => {
    if (!deleteConfirmEvent) return;
    deleteHostedEvent(deleteConfirmEvent.id);
    await deleteEventInSupabase(deleteConfirmEvent.id);
    loadDashboardData();
    setActionSuccessMsg(`"${deleteConfirmEvent.title}" has been deleted.`);
    setDeleteConfirmEvent(null);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleExportCSV = (eventItem: ExtendedEvent) => {
    const csvRows = [
      ['Participant Name', 'Email', 'Role / Specialty', 'Status', 'Registration Date'],
      ['Chinmay Bhatt', 'chinmay@hackersunity.dev', 'Lead Developer & Architect', 'CONFIRMED', '2026-08-10'],
      ['Aarav Sharma', 'aarav@neuralforge.dev', 'AI / Multi-Agent Specialist', 'CONFIRMED', '2026-08-11'],
      ['Elena Rostova', 'elena@zkproofs.ch', 'Smart Contract Engineer', 'CONFIRMED', '2026-08-12'],
      ['Devansh Patel', 'devansh@pulsefin.in', 'Backend & Cloud Specialist', 'SUBMITTED', '2026-08-14'],
      ['Sophia Chen', 'sophia@stanford.edu', 'ML & Computer Vision', 'CONFIRMED', '2026-08-15'],
      ['Rahul Verma', 'rahul@hackersunity.dev', 'Fullstack Builder', 'CONFIRMED', '2026-08-16'],
      ['Priya Nair', 'priya@iitb.ac.in', 'IoT & Embedded Systems', 'CONFIRMED', '2026-08-17'],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${eventItem.slug}-registered-hackers.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trajectory chart points
  const trajectoryPoints = [
    { month: 'Mar', count: 850, velocity: '+120/wk', x: 20, y: 140 },
    { month: 'Apr', count: 1420, velocity: '+180/wk', x: 120, y: 115 },
    { month: 'May', count: 2100, velocity: '+240/wk', x: 220, y: 92 },
    { month: 'Jun', count: 3450, velocity: '+320/wk', x: 320, y: 65 },
    { month: 'Jul', count: 4900, velocity: '+390/wk', x: 420, y: 40 },
    { month: 'Aug', count: 6800, velocity: '+420/wk', x: 520, y: 15 },
  ];

  // Auth Guard
  if (!loading && !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0099e6] mb-6 shadow-sm">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hacker Dashboard</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          Sign in or create an account to view your hackathons, team invitations, hosted events, and analytics.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => setAuthOpen(true)}
            className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ─── Top Dashboard Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0099e6] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Realtime Builder Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Dashboard & Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Monitor real-time participation velocity, manage registrations, inspect hosted hackathons, and collaborate with squads.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPublicProfileModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-[#0099e6] border border-sky-200 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Public Profile</span>
          </button>
          <Link
            href="/settings"
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Settings className="w-4 h-4 text-[#0099e6]" />
            <span>Settings</span>
          </Link>
          <Link
            href="/host"
            className="px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Host Hackathon</span>
          </Link>
        </div>
      </div>

      {/* ─── Main 2-Column Grid Layout with Left Sidebar ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ═══ LEFT SIDEBAR (4 cols) ═══ */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2 sticky top-24">
            {/* User Mini Profile Badge */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0099e6] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 overflow-hidden">
                {user?.avatarUrl && user.avatarUrl.startsWith('http') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0) || 'H'}</span>
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="font-extrabold text-sm text-slate-900 truncate">{user?.name || 'Hacker'}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#0099e6]/10 text-[#0099e6] text-[10px] font-extrabold uppercase tracking-wider">
                  {user?.role || 'Builder'}
                </span>
              </div>
            </div>

            {/* Nav Tab 1: Overview & Analytics */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === 'overview'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Overview & Analytics</div>
                <div className={`text-[10px] font-normal ${activeTab === 'overview' ? 'text-white/80' : 'text-slate-400'}`}>
                  Live velocity & KPIs
                </div>
              </div>
            </button>

            {/* Nav Tab 2: My Participations */}
            <button
              onClick={() => setActiveTab('participations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === 'participations'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>My Participations</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'participations'
                        ? 'bg-white text-[#0099e6]'
                        : 'bg-sky-50 text-[#0099e6] border border-sky-200'
                    }`}
                  >
                    {registrations.length}
                  </span>
                </div>
                <div className={`text-[10px] font-normal ${activeTab === 'participations' ? 'text-white/80' : 'text-slate-400'}`}>
                  Events you registered for
                </div>
              </div>
            </button>

            {/* Nav Tab 3: My Hosted Events */}
            <button
              onClick={() => setActiveTab('organizing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === 'organizing'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>My Events / Organizing</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'organizing'
                        ? 'bg-white text-[#0099e6]'
                        : 'bg-orange-50 text-[#ea580c] border border-orange-200'
                    }`}
                  >
                    {myHostedEvents.length}
                  </span>
                </div>
                <div className={`text-[10px] font-normal ${activeTab === 'organizing' ? 'text-white/80' : 'text-slate-400'}`}>
                  Created & managed hackathons
                </div>
              </div>
            </button>

            {/* Nav Tab 4: Saved / Bookmarks */}
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === 'bookmarks'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Saved Bookmarks</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeTab === 'bookmarks'
                        ? 'bg-white text-[#0099e6]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {bookmarkedEvents.length}
                  </span>
                </div>
                <div className={`text-[10px] font-normal ${activeTab === 'bookmarks' ? 'text-white/80' : 'text-slate-400'}`}>
                  Saved hackathon cards
                </div>
              </div>
            </button>

            {/* Nav Tab 5: Squads & Invites */}
            <button
              onClick={() => setActiveTab('teams')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === 'teams'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Squads & Team Invites</span>
                  {pendingInvites.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#ea580c] text-white text-[10px] font-extrabold animate-pulse">
                      {pendingInvites.length} new
                    </span>
                  )}
                </div>
                <div className={`text-[10px] font-normal ${activeTab === 'teams' ? 'text-white/80' : 'text-slate-400'}`}>
                  Team matchmaking & invites
                </div>
              </div>
            </button>

            {/* Admin Broadcast Studio Quick Link (for Admins & Organizers) */}
            {(user?.role === UserRole.ADMIN ||
              user?.role === UserRole.SUPER_ADMIN ||
              user?.role === UserRole.ORGANIZER) && (
              <div className="pt-2 border-t border-slate-100 mt-2">
                <Link
                  href="/admin/notifications"
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-[#0099e6] bg-sky-50/70 hover:bg-sky-100 transition-colors"
                >
                  <Megaphone className="w-4 h-4 text-[#0099e6]" />
                  <span>Broadcast & News Studio</span>
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* ═══ RIGHT CONTENT COLUMN (8 cols) ═══ */}
        <main className="lg:col-span-8 space-y-6">
          {/* ─────────────────────────────────────────────────────────────
              1. SECTION: OVERVIEW & ANALYTICS
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Analytics KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Builders</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0099e6] flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#0099e6] font-mono">
                      {totalBuildersCount.toLocaleString()}+
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600">
                      <TrendingUp className="w-3 h-3" />
                      <span>Live Synced</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Arenas</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{liveEventsCount}</div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500">
                      <span>Open for registration</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My Registered</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
                      {registrations.length}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-purple-700">
                      <span>Active squads</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prize Pool</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center">
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-black text-[#ea580c] font-mono truncate" title={formatCurrency(totalPrizeSum)}>
                      {formatCurrency(totalPrizeSum)}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-orange-600">
                      <span>Verified Bounties</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trajectory & Domain Deep-Dive */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Chart: Growth Curve */}
                <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0099e6] uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3" />
                        <span>Registration Velocity</span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 mt-0.5">Platform Trajectory</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      +340% Growth
                    </span>
                  </div>

                  <div className="h-36 w-full relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 540 160" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="dashAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0099e6" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#0099e6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="dashLineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#0284c7" />
                          <stop offset="100%" stopColor="#0099e6" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 20 140 Q 70 128 120 115 T 220 92 T 320 65 T 420 40 T 520 15 L 520 160 L 20 160 Z"
                        fill="url(#dashAreaGradient)"
                      />
                      <path
                        d="M 20 140 Q 70 128 120 115 T 220 92 T 320 65 T 420 40 T 520 15"
                        fill="none"
                        stroke="url(#dashLineGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      {trajectoryPoints.map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r={activeChartPoint === i ? 6 : 4}
                          onClick={() => setActiveChartPoint(i)}
                          className={`cursor-pointer transition-all duration-300 ${
                            activeChartPoint === i
                              ? 'fill-[#0099e6] stroke-white stroke-2 shadow-lg'
                              : 'fill-white stroke-[#0099e6] stroke-2 hover:r-6 hover:fill-[#0099e6]'
                          }`}
                        />
                      ))}
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-2">
                    {trajectoryPoints.map((pt, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveChartPoint(i)}
                        className={`transition-colors cursor-pointer ${
                          activeChartPoint === i ? 'text-[#0099e6] font-extrabold' : 'hover:text-slate-700'
                        }`}
                      >
                        {pt.month}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Domain Distribution */}
                <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#0099e6] uppercase tracking-wider">Tech Stacks</span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">Builder Domain Breakdown</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#0099e6]" />
                          AI Agents & GenAI
                        </span>
                        <span>42%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0099e6] rounded-full" style={{ width: '42%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-violet-600" />
                          Web3 & Blockchain
                        </span>
                        <span>28%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-600 rounded-full" style={{ width: '28%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Fullstack & Cloud
                        </span>
                        <span>20%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '20%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          IoT & Open Innovation
                        </span>
                        <span>10%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium text-center pt-2 border-t border-slate-100">
                    Realtime breakdown based on verified registrations
                  </div>
                </div>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveTab('participations')}
                  className="p-5 rounded-3xl bg-gradient-to-r from-sky-50 to-white border border-sky-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#0099e6] text-white flex items-center justify-center shadow-xs">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-[#0099e6] transition-colors">
                        My Participations
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {registrations.length} active registered arena{registrations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>

                <div
                  onClick={() => setActiveTab('organizing')}
                  className="p-5 rounded-3xl bg-gradient-to-r from-orange-50 to-white border border-orange-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#ea580c] text-white flex items-center justify-center shadow-xs">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-[#ea580c] transition-colors">
                        My Hosted Events
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {myHostedEvents.length} managed hackathon{myHostedEvents.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              2. SECTION: MY PARTICIPATIONS (Registered Events)
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'participations' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#0099e6]" />
                    <span>My Participations & Registrations</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    All hackathons, coding tournaments, and arenas where you are participating.
                  </p>
                </div>

                <Link
                  href="/hackathons"
                  className="px-4 py-2 rounded-2xl bg-sky-50 hover:bg-sky-100 text-[#0099e6] border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find More Arenas</span>
                </Link>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPartFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        partFilter === filter
                          ? 'bg-[#0099e6] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter === 'ALL' ? 'All Participations' : filter === 'ACTIVE' ? 'Live / Upcoming' : 'Completed'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={partSearch}
                    onChange={(e) => setPartSearch(e.target.value)}
                    placeholder="Search registered events..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0099e6] w-full sm:w-56"
                  />
                </div>
              </div>

              {/* Registrations List */}
              {filteredParticipations.length === 0 ? (
                <div className="p-12 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0099e6] border border-sky-200 flex items-center justify-center mx-auto">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">No Registrations Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You haven&apos;t registered for any hackathons under this filter. Explore upcoming competitions to start building!
                  </p>
                  <Link
                    href="/hackathons"
                    className="inline-flex px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all"
                  >
                    Browse Live Hackathons
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredParticipations.map((reg) => {
                    const matchedEvent = allEvents.find((e) => e.id === reg.eventId || e.slug === reg.eventId);
                    return (
                      <div
                        key={reg.eventId}
                        className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#0099e6]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ {reg.status || 'CONFIRMED'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Registered: {formatDate(reg.registeredAt)}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base font-black text-slate-900 line-clamp-1">
                              {reg.eventName || matchedEvent?.title || 'Hackathon Arena'}
                            </h4>
                            {matchedEvent && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {matchedEvent.description}
                              </p>
                            )}
                          </div>

                          {/* Squad / Team Details */}
                          <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-[#0099e6]" />
                              <span className="text-xs font-bold text-slate-800">
                                {reg.teamName ? `Team: ${reg.teamName}` : 'Solo Builder'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold">{reg.role}</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <Link
                            href={matchedEvent ? `/hackathons/${matchedEvent.slug}` : '/hackathons'}
                            className="text-xs font-black text-[#0099e6] flex items-center gap-1 hover:translate-x-0.5 transition-transform"
                          >
                            <span>Enter Hackathon Arena</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          {matchedEvent?.isTeamEvent && (
                            <button
                              onClick={() => setActiveTab('teams')}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Manage Squad
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              3. SECTION: MY EVENTS / ORGANIZING (Hosted Hackathons)
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'organizing' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#ea580c]" />
                    <span>My Events & Organizer Operations</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage your hosted hackathons, update parameters, inspect attendee rosters, and export submissions.
                  </p>
                </div>

                <Link
                  href="/host"
                  className="px-4 py-2 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Host New Hackathon</span>
                </Link>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(['ALL', 'LIVE', 'COMPLETED', 'DRAFT'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setHostFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        hostFilter === filter
                          ? 'bg-[#0099e6] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter === 'ALL'
                        ? 'All Events'
                        : filter === 'LIVE'
                        ? 'Live / Open'
                        : filter === 'COMPLETED'
                        ? 'Completed'
                        : 'Drafts'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={hostSearch}
                    onChange={(e) => setHostSearch(e.target.value)}
                    placeholder="Search hosted events..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0099e6] w-full sm:w-56"
                  />
                </div>
              </div>

              {/* Hosted Events List */}
              {filteredHostedEvents.length === 0 ? (
                <div className="p-12 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#ea580c] border border-orange-200 flex items-center justify-center mx-auto">
                    <Layers className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">No Hosted Hackathons Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You haven&apos;t created any hackathons yet. Launch your competition to connect with thousands of talented developers!
                  </p>
                  <Link
                    href="/host"
                    className="inline-flex px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all"
                  >
                    Host a Hackathon Now
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHostedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-[#0099e6]/40 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                              evt.status === 'COMPLETED'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : evt.status === 'DRAFT'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {evt.status === 'COMPLETED' ? 'Completed' : evt.status === 'DRAFT' ? 'Draft' : 'Live / Active'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Starts: {formatDate(evt.startDate)}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-slate-900 line-clamp-1">{evt.title}</h3>

                        <div className="flex items-center gap-4 text-xs text-slate-600 font-medium flex-wrap">
                          <span className="flex items-center gap-1 text-[#0099e6] font-bold">
                            <Users className="w-3.5 h-3.5" />
                            {evt.participantsDisplay || `${evt.participantsCount || 500}+`} Builders
                          </span>
                          <span>•</span>
                          <span className="text-[#ea580c] font-bold">
                            Prize: {evt.prize || formatCurrency(evt.totalPrizeValue)}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">{evt.mode || 'Online'}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          onClick={() => {
                            setEditingEvent(evt);
                            setEditModalOpen(true);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#0099e6]" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setViewingHackersEvent(evt)}
                          className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0099e6] border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Roster</span>
                        </button>

                        <button
                          onClick={() => handleExportCSV(evt)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Export CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <Link
                          href={`/hackathons/${evt.slug}`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          title="View Live Page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => setDeleteConfirmEvent(evt)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              4. SECTION: SAVED BOOKMARKS
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'bookmarks' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-[#0099e6]" />
                    <span>Saved & Bookmarked Hackathons</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your personal wishlist of hackathons to track and register.
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-bold">{bookmarkedEvents.length} Saved</span>
              </div>

              {bookmarkedEvents.length === 0 ? (
                <div className="p-12 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0099e6] border border-sky-200 flex items-center justify-center mx-auto">
                    <Bookmark className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">No Bookmarks Saved Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click the bookmark ribbon icon on any hackathon card to save it here for fast access.
                  </p>
                  <Link
                    href="/hackathons"
                    className="inline-flex px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all"
                  >
                    Explore Hackathons
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bookmarkedEvents.map((evt) => (
                    <HackathonCard key={evt.id} event={evt} isBookmarked={true} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              5. SECTION: SQUADS & TEAM MANAGEMENT
             ───────────────────────────────────────────────────────────── */}
          {activeTab === 'teams' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0099e6]" />
                  <span>Squads & Team Invites</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your hackathon teams, invite teammates with secure links, and review incoming requests.
                </p>
              </div>

              <DashboardTeamsTab />
            </div>
          )}
        </main>
      </div>

      {/* ─── MODALS ─────────────────────────────────────────────────── */}
      {/* Edit Event Modal */}
      {editModalOpen && editingEvent && (
        <EditEventModal
          isOpen={editModalOpen}
          event={editingEvent}
          onClose={() => {
            setEditModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={handleEditEventSave}
        />
      )}

      {/* Delete Event Confirmation Modal */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Delete Hackathon Event?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">&quot;{deleteConfirmEvent.title}&quot;</strong>? This will remove the event from the directory and leaderboard.
              </p>
            </div>
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmEvent(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEventConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                Yes, Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Registered Hackers / Roster Modal */}
      {viewingHackersEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <span className="text-[10px] font-bold text-[#0099e6] uppercase tracking-wider">Attendee Roster</span>
                <h3 className="text-lg font-black text-slate-900 line-clamp-1">{viewingHackersEvent.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {viewingHackersEvent.participantsDisplay || `${viewingHackersEvent.participantsCount || 500}+`} registered builders & teams
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCSV(viewingHackersEvent)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#0099e6]" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => setViewingHackersEvent(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Hacker Name</th>
                      <th className="py-3 px-4">Contact Email</th>
                      <th className="py-3 px-4">Role / Domain</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {[
                      { name: 'Chinmay Bhatt', email: 'chinmay@hackersunity.dev', role: 'Fullstack & Lead', status: 'CONFIRMED', date: '2026-08-10' },
                      { name: 'Aarav Sharma', email: 'aarav@neuralforge.dev', role: 'AI / Multi-Agent', status: 'CONFIRMED', date: '2026-08-11' },
                      { name: 'Elena Rostova', email: 'elena@zkproofs.ch', role: 'Smart Contracts / Rust', status: 'CONFIRMED', date: '2026-08-12' },
                      { name: 'Devansh Patel', email: 'devansh@pulsefin.in', role: 'Backend Architect', status: 'SUBMITTED', date: '2026-08-14' },
                      { name: 'Sophia Chen', email: 'sophia@stanford.edu', role: 'Computer Vision', status: 'CONFIRMED', date: '2026-08-15' },
                      { name: 'Rahul Verma', email: 'rahul@hackersunity.dev', role: 'Fullstack Builder', status: 'CONFIRMED', date: '2026-08-16' },
                      { name: 'Priya Nair', email: 'priya@iitb.ac.in', role: 'IoT & Embedded Systems', status: 'CONFIRMED', date: '2026-08-17' },
                    ].map((hacker, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-sky-100 text-[#0099e6] font-bold flex items-center justify-center text-[10px]">
                            {hacker.name.charAt(0)}
                          </div>
                          <span>{hacker.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{hacker.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {hacker.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {hacker.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 text-[11px]">{hacker.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Showing recent verified registered participants</span>
              <button
                onClick={() => setViewingHackersEvent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Public Profile Preview Modal */}
      <PublicProfileModal
        isOpen={showPublicProfileModal}
        onClose={() => setShowPublicProfileModal(false)}
        user={user}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DashboardTeamsTab — Real data-driven squads & invitations tab
   ═══════════════════════════════════════════════════════════════════════════ */
function DashboardTeamsTab() {
  const { user, supabaseUser } = useAuth();
  const userId = supabaseUser?.id || user?.id;

  const { userTeams, loading: teamsLoading, leaveTeam, deleteTeam, refreshUserTeams } = useUserTeams();
  const { pendingInvites, loading: invitesLoading, acceptInvite, declineInvite, refreshMyInvites } = useMyInvites();

  // Per-team invite state
  const [inviteEmailMap, setInviteEmailMap] = useState<Record<string, string>>({});
  const [inviteSendingMap, setInviteSendingMap] = useState<Record<string, boolean>>({});
  const [inviteResultMap, setInviteResultMap] = useState<
    Record<string, { type: 'success' | 'error'; msg: string } | null>
  >({});
  const [teamInvitesMap, setTeamInvitesMap] = useState<Record<string, any[]>>({});
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [leavingTeam, setLeavingTeam] = useState<string | null>(null);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const [deleteConfirmSquad, setDeleteConfirmSquad] = useState<any | null>(null);
  const [deletingSquad, setDeletingSquad] = useState(false);

  // Load invites for expanded team
  const handleExpandTeam = async (teamId: string) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null);
      return;
    }
    setExpandedTeam(teamId);
    try {
      const invites = await fetchTeamInvites(teamId);
      setTeamInvitesMap((prev) => ({ ...prev, [teamId]: invites }));
    } catch {}
  };

  const getTeamInviteUrl = (teamId: string, eventSlug: string) => {
    const invites = teamInvitesMap[teamId] || [];
    const pending = invites.find((i: any) => i.status === 'PENDING');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return pending?.invite_token
      ? `${origin}/hackathons/${eventSlug}/invite?token=${pending.invite_token}`
      : `${origin}/hackathons/${eventSlug}/register`;
  };

  const handleSendInvite = async (teamId: string, eventId: string) => {
    const email = inviteEmailMap[teamId]?.trim();
    if (!email || !email.includes('@') || !userId) return;

    setInviteSendingMap((prev) => ({ ...prev, [teamId]: true }));
    setInviteResultMap((prev) => ({ ...prev, [teamId]: null }));

    try {
      const res = await sendTeamInvite(teamId, eventId, userId, email);
      if (res.success) {
        setInviteResultMap((prev) => ({
          ...prev,
          [teamId]: { type: 'success', msg: `Invite created for ${email}!` },
        }));
        setInviteEmailMap((prev) => ({ ...prev, [teamId]: '' }));
        const invites = await fetchTeamInvites(teamId);
        setTeamInvitesMap((prev) => ({ ...prev, [teamId]: invites }));
      } else {
        setInviteResultMap((prev) => ({
          ...prev,
          [teamId]: { type: 'error', msg: res.error || 'Failed to send.' },
        }));
      }
    } catch (err: any) {
      setInviteResultMap((prev) => ({ ...prev, [teamId]: { type: 'error', msg: err.message } }));
    } finally {
      setInviteSendingMap((prev) => ({ ...prev, [teamId]: false }));
    }
  };

  const handleCopyLink = (teamId: string, eventSlug: string) => {
    const link = getTeamInviteUrl(teamId, eventSlug);
    navigator.clipboard.writeText(link);
    setCopiedMap((prev) => ({ ...prev, [teamId]: true }));
    setTimeout(() => setCopiedMap((prev) => ({ ...prev, [teamId]: false })), 2500);
  };

  const handleLeaveTeam = async (teamId: string) => {
    setLeavingTeam(teamId);
    await leaveTeam(teamId);
    setLeavingTeam(null);
  };

  const handleDeleteSquad = async () => {
    if (!deleteConfirmSquad || !userId) return;
    setDeletingSquad(true);
    try {
      await deleteTeam(deleteConfirmSquad.id);
      setDeleteConfirmSquad(null);
      refreshUserTeams();
    } catch (e) {
      console.warn('Delete squad error:', e);
    } finally {
      setDeletingSquad(false);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    setProcessingInvite(token);
    await acceptInvite(token);
    refreshUserTeams();
    setProcessingInvite(null);
  };

  const handleDeclineInvite = async (token: string) => {
    setProcessingInvite(token);
    await declineInvite(token);
    setProcessingInvite(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ─── Pending Invites ─── */}
      {pendingInvites.length > 0 && (
        <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pending Squad Invitations</h3>
              <p className="text-[10px] text-slate-500">
                You have {pendingInvites.length} pending squad invite{pendingInvites.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingInvites.map((inv: any) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-white border border-amber-200/80 flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0099e6] to-sky-600 flex items-center justify-center text-white text-sm font-black shrink-0">
                    {(inv.teams?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{inv.teams?.name || 'Unknown Team'}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      Invited by {inv.profiles?.name || 'A teammate'} • {inv.events?.title || 'Hackathon'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAcceptInvite(inv.invite_token)}
                    disabled={processingInvite === inv.invite_token}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {processingInvite === inv.invite_token ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.invite_token)}
                    disabled={processingInvite === inv.invite_token}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── My Active Squads ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Your Active Squads</h3>
            <p className="text-xs text-slate-500">Teams you lead or are a member of.</p>
          </div>
          <span className="text-xs font-bold text-[#0099e6] bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            {userTeams.length} Squad{userTeams.length !== 1 ? 's' : ''}
          </span>
        </div>

        {teamsLoading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#0099e6] mx-auto mb-2" />
            <p className="text-xs font-medium">Loading squads...</p>
          </div>
        ) : userTeams.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0099e6] flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No Active Squads</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Join or form a team during hackathon registration to collaborate on prototypes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userTeams.map((teamData: any) => {
              const team = teamData.teams || teamData;
              const isLeader = team.leader_id === userId || teamData.role === 'LEADER';
              const eventSlug = team.events?.slug || 'codewars';
              const isExpanded = expandedTeam === team.id;

              return (
                <div
                  key={team.id}
                  className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:border-[#0099e6]/40 transition-all"
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0099e6] to-[#0284c7] text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
                        {(team.name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900">{team.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isLeader
                                ? 'bg-orange-50 text-[#ea580c] border border-orange-200'
                                : 'bg-sky-50 text-[#0099e6] border border-sky-200'
                            }`}
                          >
                            {isLeader ? 'Squad Lead' : 'Member'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Event: <strong className="text-slate-700">{team.events?.title || 'Hackathon Arena'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleExpandTeam(team.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isExpanded ? 'Hide Invites' : 'Invite & Members'}
                      </button>

                      <button
                        onClick={() => handleCopyLink(team.id, eventSlug)}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0099e6] border border-sky-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedMap[team.id] ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{copiedMap[team.id] ? 'Copied!' : 'Copy Link'}</span>
                      </button>

                      {isLeader ? (
                        <button
                          onClick={() => setDeleteConfirmSquad(team)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Disband Squad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLeaveTeam(team.id)}
                          disabled={leavingTeam === team.id}
                          className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {leavingTeam === team.id ? 'Leaving...' : 'Leave Squad'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Invite & Roster Panel */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-4">
                      {/* Send Invite Input */}
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={inviteEmailMap[team.id] || ''}
                          onChange={(e) =>
                            setInviteEmailMap((prev) => ({ ...prev, [team.id]: e.target.value }))
                          }
                          placeholder="Enter teammate's email to invite..."
                          className="flex-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                        />
                        <button
                          onClick={() => handleSendInvite(team.id, team.event_id)}
                          disabled={inviteSendingMap[team.id]}
                          className="px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {inviteSendingMap[team.id] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          <span>Send Invite</span>
                        </button>
                      </div>

                      {inviteResultMap[team.id] && (
                        <div
                          className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                            inviteResultMap[team.id]?.type === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {inviteResultMap[team.id]?.type === 'success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{inviteResultMap[team.id]?.msg}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Squad Confirmation Modal */}
      {deleteConfirmSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Disband Squad?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Are you sure you want to disband <strong className="text-slate-800">&quot;{deleteConfirmSquad.name}&quot;</strong>? All members will be removed.
              </p>
            </div>
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmSquad(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSquad}
                disabled={deletingSquad}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {deletingSquad ? 'Disbanding...' : 'Yes, Disband'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
