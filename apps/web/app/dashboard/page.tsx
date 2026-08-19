'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Bookmark,
  Users,
  Settings,
  CheckCircle2,
  AlertCircle,
  KeyRound,
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
  PieChart as PieIcon,
  Zap,
} from 'lucide-react';
import {
  getMyRegistrations,
  getBookmarkedEventIds,
  getAllEvents,
  updateHostedEvent,
  deleteHostedEvent,
  UserRegistrationItem,
} from '@/lib/storage';
import { ExtendedEvent } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { updateEventInSupabase, deleteEventInSupabase } from '@/lib/supabase-service';
import { HackathonCard } from '@/components/hackathon-card';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AuthModal } from '@/components/auth-modal';
import { AvatarUpload } from '@/components/avatar-upload';
import { EditEventModal } from '@/components/edit-event-modal';

export default function DashboardPage() {
  const { user, updateUserProfile, updateUserPassword, signOut, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  
  // Default to 'hosted' (Organizer Management & Analytics)
  const [activeTab, setActiveTab] = useState<'hosted' | 'profile' | 'registrations' | 'bookmarks' | 'teams'>('hosted');
  const [registrations, setRegistrations] = useState<UserRegistrationItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [allEvents, setAllEvents] = useState<ExtendedEvent[]>([]);

  // Chart Interactivity States
  const [chartTimeframe, setChartTimeframe] = useState<'6M' | '1Y'>('6M');
  const [activeChartPoint, setActiveChartPoint] = useState<number | null>(5);

  // Event Management State
  const [editingEvent, setEditingEvent] = useState<ExtendedEvent | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewingHackersEvent, setViewingHackersEvent] = useState<ExtendedEvent | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<ExtendedEvent | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [college, setCollege] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // Password Update State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    setRegistrations(getMyRegistrations());
    setBookmarkedIds(getBookmarkedEventIds());
    setAllEvents(getAllEvents());

    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setCollege(user.college || user.organization || '');
      setSkills(user.skills && user.skills.length > 0 ? user.skills : ['Next.js 16', 'TypeScript', 'PostgreSQL']);
      setAvatar(user.avatarUrl || null);
      setGithub(user.socialLinks?.github || '');
      setLinkedin(user.socialLinks?.linkedin || '');
      setPortfolio(user.socialLinks?.portfolio || '');
    }

    const handleStorage = () => {
      setRegistrations(getMyRegistrations());
      setBookmarkedIds(getBookmarkedEventIds());
      setAllEvents(getAllEvents());
    };
    window.addEventListener('hackers_unity_storage_change', handleStorage);
    return () => window.removeEventListener('hackers_unity_storage_change', handleStorage);
  }, [user]);

  const bookmarkedEvents = allEvents.filter((e) => bookmarkedIds.includes(e.id));

  // Analytics Computations
  const totalHackersCount = allEvents.reduce((acc, e) => acc + (e.participantsCount || 500), 0);
  const totalPrizeSum = allEvents.reduce((acc, e) => acc + (e.totalPrizeValue || 0), 0);
  const liveEventsCount = allEvents.filter((e) => e.status !== 'COMPLETED').length;

  const handleEditEventSave = async (updated: ExtendedEvent) => {
    updateHostedEvent(updated);
    await updateEventInSupabase(updated.id, updated);
    setAllEvents(getAllEvents());
    setActionSuccessMsg(`"${updated.title}" was updated successfully.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleDeleteEventConfirm = async () => {
    if (!deleteConfirmEvent) return;
    deleteHostedEvent(deleteConfirmEvent.id);
    await deleteEventInSupabase(deleteConfirmEvent.id);
    setAllEvents(getAllEvents());
    setActionSuccessMsg(`"${deleteConfirmEvent.title}" has been removed.`);
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
      ['Rahul Verma', 'rahul@aceit.edu.in', 'Fullstack Builder', 'CONFIRMED', '2026-08-16'],
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

  const handleAddSkill = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);

    const res = await updateUserProfile({
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      college: college.trim() || undefined,
      organization: college.trim() || undefined,
      skills: skills,
      avatarUrl: avatar || undefined,
      socialLinks: {
        github: github.trim(),
        linkedin: linkedin.trim(),
        portfolio: portfolio.trim(),
      },
    });

    setIsSavingProfile(false);
    if (res.error) {
      setProfileError(res.error);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updateUserPassword(newPassword);
    setIsUpdatingPassword(false);

    if (res.error) {
      setPasswordMsg({ type: 'error', text: res.error });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully in Supabase!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    }
  };

  // Chart datapoints
  const trajectoryPoints = [
    { month: 'Mar 2026', count: 850, velocity: '+120/wk', submissions: 120, x: 20, y: 140 },
    { month: 'Apr 2026', count: 1420, velocity: '+180/wk', submissions: 280, x: 120, y: 115 },
    { month: 'May 2026', count: 2100, velocity: '+240/wk', submissions: 450, x: 220, y: 92 },
    { month: 'Jun 2026', count: 3450, velocity: '+320/wk', submissions: 710, x: 320, y: 65 },
    { month: 'Jul 2026', count: 4900, velocity: '+390/wk', submissions: 980, x: 420, y: 40 },
    { month: 'Aug 2026', count: 6800, velocity: '+420/wk', submissions: 1420, x: 520, y: 15 },
  ];

  // If user is not logged in
  if (!loading && !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0099e6] mb-6 shadow-sm">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Your Dashboard</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          Sign in or create an account to manage your hackathons, view real-time analytics, and configure your profile.
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

      {/* ─── Top Dashboard Header & Quick Action ────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0099e6] text-[11px] font-bold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Organizer Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hackathon Management & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Monitor real-time participation velocity, manage hackathon parameters, inspect rosters, and track ecosystem growth.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/settings"
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Settings className="w-4 h-4 text-[#0099e6]" />
            <span>Account & Settings</span>
          </Link>
          <Link
            href="/host"
            className="px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Host New Hackathon</span>
          </Link>
        </div>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('hosted')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'hosted'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Hackathon Operations & Analytics ({allEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'registrations'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>My Registrations ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'bookmarks'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved / Bookmarks ({bookmarkedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'teams'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Squads & Invites</span>
        </button>
      </div>

      {/* ─── TAB: Hosted Events & Analytics ───────────────────────── */}
      {activeTab === 'hosted' && (
        <div className="space-y-8 animate-in fade-in">
          {/* 1. Analytics KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Builders</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0099e6] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-[#0099e6] font-mono">{totalHackersCount.toLocaleString()}+</div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>+38.4% MoM Growth</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Weekly Velocity</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">+420 / wk</div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500">
                  <span>Peak Viral Spread</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Global Reach</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">32+ Countries</div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-purple-700">
                  <span>6 Continents Active</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Impressions</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-sky-600 font-mono">5.2M+</div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-sky-700">
                  <span>98.4% Organic Reach</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prize Escrow</span>
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

          {/* 2. Visual Analytics Charts Deep-Dive */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1 (Left 7 cols): Registration Velocity & Trajectory (SVG Area Chart) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0099e6] uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Participant Growth Curve</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">Registration Velocity & Trajectory</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    +340% 6-Mo Growth
                  </span>
                </div>
              </div>

              {/* Dynamic Interactive SVG Curve Chart */}
              <div className="relative pt-2">
                {/* SVG Area Line Curve */}
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 540 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0099e6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#0099e6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0284c7" />
                        <stop offset="50%" stopColor="#0099e6" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="30" x2="540" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="75" x2="540" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="120" x2="540" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Area fill */}
                    <path
                      d="M 20 140 Q 70 128 120 115 T 220 92 T 320 65 T 420 40 T 520 15 L 520 160 L 20 160 Z"
                      fill="url(#areaGradient)"
                    />

                    {/* Smooth Spline Stroke */}
                    <path
                      d="M 20 140 Q 70 128 120 115 T 220 92 T 320 65 T 420 40 T 520 15"
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Interactive Points */}
                    {trajectoryPoints.map((pt, i) => (
                      <g key={i} className="cursor-pointer" onClick={() => setActiveChartPoint(i)}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={activeChartPoint === i ? 6 : 4}
                          className={`transition-all duration-300 ${
                            activeChartPoint === i
                              ? 'fill-[#0099e6] stroke-white stroke-2 shadow-lg'
                              : 'fill-white stroke-[#0099e6] stroke-2 hover:r-6 hover:fill-[#0099e6]'
                          }`}
                        />
                      </g>
                    ))}
                  </svg>
                </div>

                {/* X Axis Labels */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mt-2 px-1 border-t border-slate-100 pt-2">
                  {trajectoryPoints.map((pt, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveChartPoint(i)}
                      className={`transition-colors cursor-pointer ${
                        activeChartPoint === i ? 'text-[#0099e6] font-extrabold' : 'hover:text-slate-700'
                      }`}
                    >
                      {pt.month.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Selected Point Tooltip / Card */}
                {activeChartPoint !== null && (
                  <div className="mt-4 p-3 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0099e6] animate-pulse" />
                      <span className="font-bold text-slate-800">
                        {trajectoryPoints[activeChartPoint].month}:
                      </span>
                      <span className="font-mono font-black text-[#0099e6]">
                        {trajectoryPoints[activeChartPoint].count.toLocaleString()}+ Builders
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 font-medium">
                      <span>Velocity: <strong className="text-emerald-600 font-mono">{trajectoryPoints[activeChartPoint].velocity}</strong></span>
                      <span>Submissions: <strong className="text-slate-800 font-mono">{trajectoryPoints[activeChartPoint].submissions}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Metrics Badges */}
              <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase">Squad Teams</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">68%</div>
                  <div className="text-[10px] text-slate-500">2-4 Member squads</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase">Solo Hackers</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">32%</div>
                  <div className="text-[10px] text-slate-500">Individual builders</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-xs font-bold text-slate-400 uppercase">Project Ship Rate</div>
                  <div className="text-base font-black text-emerald-600 mt-0.5">84.6%</div>
                  <div className="text-[10px] text-slate-500">Completed submissions</div>
                </div>
              </div>
            </div>

            {/* Chart 2 (Right 5 cols): Domain & Technology Distribution */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                    <PieIcon className="w-3.5 h-3.5" />
                    <span>Domain Breakdown</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">7 Active Tracks</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">Builder Domain Distribution</h3>
              </div>

              {/* Multi-Segment Stacked Progress Ring / Bar */}
              <div className="space-y-4">
                <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                  <div style={{ width: '38%' }} className="bg-sky-500 hover:opacity-90 transition-opacity" title="AI / Machine Learning (38%)" />
                  <div style={{ width: '24%' }} className="bg-purple-500 hover:opacity-90 transition-opacity" title="Web3 & Blockchain (24%)" />
                  <div style={{ width: '18%' }} className="bg-emerald-500 hover:opacity-90 transition-opacity" title="Fullstack & Cloud (18%)" />
                  <div style={{ width: '12%' }} className="bg-orange-500 hover:opacity-90 transition-opacity" title="IoT & Embedded (12%)" />
                  <div style={{ width: '8%' }} className="bg-pink-500 hover:opacity-90 transition-opacity" title="Open Source & FinTech (8%)" />
                </div>

                {/* Legend list with progress */}
                <div className="space-y-2.5">
                  {[
                    { name: 'AI & Multi-Agent Systems', pct: 38, count: '2,584', color: 'bg-sky-500', text: 'text-sky-600' },
                    { name: 'Web3 & Blockchain (Solana / EVM)', pct: 24, count: '1,632', color: 'bg-purple-500', text: 'text-purple-600' },
                    { name: 'Fullstack & Cloud Architecture', pct: 18, count: '1,224', color: 'bg-emerald-500', text: 'text-emerald-600' },
                    { name: 'IoT & Hardware Systems', pct: 12, count: '816', color: 'bg-orange-500', text: 'text-orange-600' },
                    { name: 'Open Source & FinTech', pct: 8, count: '544', color: 'bg-pink-500', text: 'text-pink-600' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-500">{item.count}</span>
                        <span className={`font-mono font-black ${item.text} text-[11px]`}>({item.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
                <span className="text-purple-900 font-bold">Top Trending Topic</span>
                <span className="text-purple-600 font-extrabold font-mono">Agentic AI & Orchestration 🔥</span>
              </div>
            </div>
          </div>

          {/* 3. Global Reach & Country Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 cols: Top Geos */}
            <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Global Presence</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">Top Builder Geographies</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400">32+ Countries Active</span>
              </div>

              <div className="space-y-3.5">
                {[
                  { name: 'India', flag: '🇮🇳', count: '4,350', pct: 64, color: 'bg-emerald-500' },
                  { name: 'United States', flag: '🇺🇸', count: '1,088', pct: 16, color: 'bg-[#0099e6]' },
                  { name: 'Germany', flag: '🇩🇪', count: '476', pct: 7, color: 'bg-purple-500' },
                  { name: 'United Kingdom', flag: '🇬🇧', count: '340', pct: 5, color: 'bg-orange-500' },
                  { name: 'Singapore & Canada', flag: '🇸🇬 🇨🇦', count: '546', pct: 8, color: 'bg-pink-500' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <span>{item.flag}</span>
                        <span>{item.name}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-500">
                        {item.count} <span className="text-slate-400 font-normal">({item.pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${item.pct}%` }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 cols: Conversion & Shipping Funnel */}
            <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Conversion Pipeline</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 font-mono">84.6% High Ship Rate</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">Attendee Conversion Funnel</h3>
              </div>

              {/* Stepped Funnel */}
              <div className="space-y-2.5">
                {[
                  { step: '1. Discovery & Impressions', count: '5,200,000+', pct: '100%', color: 'bg-slate-900 text-white' },
                  { step: '2. Hackathon Registrations', count: '6,800+ Builders', pct: '68%', color: 'bg-[#0099e6] text-white' },
                  { step: '3. Formed Squads & Teams', count: '1,420 Teams', pct: '52%', color: 'bg-purple-600 text-white' },
                  { step: '4. Shipped Repos & Projects', count: '1,190 Submissions', pct: '44%', color: 'bg-emerald-600 text-white' },
                  { step: '5. Evaluated & Verified Winners', count: '84 Cash Winners', pct: '28%', color: 'bg-[#ea580c] text-white' },
                ].map((fn, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between flex-1 ${fn.color}`}>
                      <span>{fn.step}</span>
                      <span className="font-mono font-extrabold">{fn.count}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Ecosystem Escrow Distribution:</span>
                <strong className="text-slate-900 font-mono">100% Guaranteed Payouts</strong>
              </div>
            </div>
          </div>

          {/* 4. Hosted Hackathons Arena Manager */}
          <div className="space-y-6">
            {/* Header Toolbar */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0099e6]" />
                  <span>Hackathon Operations & Control Hub</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Manage parameters, update prize pools, export attendee rosters, edit links, or host new arenas.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
                {/* Search in hackathons */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hackathons..."
                    className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All ({allEvents.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('LIVE')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      statusFilter === 'LIVE' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Live ({liveEventsCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('COMPLETED')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      statusFilter === 'COMPLETED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Past ({allEvents.length - liveEventsCount})
                  </button>
                </div>

                <Link
                  href="/host"
                  className="px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Host Hackathon</span>
                </Link>
              </div>
            </div>

            {/* Hosted Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents
                .filter((eventItem) => {
                  const matchQuery =
                    !searchQuery ||
                    eventItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    eventItem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    eventItem.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

                  if (!matchQuery) return false;
                  if (statusFilter === 'LIVE') return eventItem.status !== 'COMPLETED';
                  if (statusFilter === 'COMPLETED') return eventItem.status === 'COMPLETED';
                  return true;
                })
                .map((eventItem) => (
                  <div
                    key={eventItem.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#0099e6]/40 transition-all duration-300"
                  >
                    {/* Poster Image / Banner */}
                    <div className="h-44 w-full relative overflow-hidden bg-slate-900">
                      {eventItem.image || eventItem.bannerUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={eventItem.image || eventItem.bannerUrl || ''}
                            alt={eventItem.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-sky-900 via-slate-900 to-black" />
                      )}

                      {/* Top Badges */}
                      <div className="absolute inset-0 p-3.5 flex items-start justify-between z-10 pointer-events-none">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-[#0099e6] shadow-xs">
                          {eventItem.mode || (eventItem.eventType === 'ONLINE' ? 'Online' : 'In-Person')}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            eventItem.status === 'COMPLETED'
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          {eventItem.status === 'COMPLETED' ? 'Completed' : 'Live / Active'}
                        </span>
                      </div>
                    </div>

                    {/* Event Details Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-[#0099e6] transition-colors">
                          {eventItem.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {eventItem.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {eventItem.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-600 font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Live Metrics Row */}
                      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Prize Pool</div>
                          <div className="font-extrabold text-[#ea580c] text-sm truncate" title={eventItem.prize || formatCurrency(eventItem.totalPrizeValue)}>
                            {eventItem.prize || formatCurrency(eventItem.totalPrizeValue)}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Registered Hackers</div>
                          <div className="font-bold text-[#0099e6] text-sm">
                            {eventItem.participantsDisplay || `${eventItem.participantsCount || 500}+`}
                          </div>
                        </div>
                      </div>

                      {/* Action Toolbar */}
                      <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setEditingEvent(eventItem);
                            setEditModalOpen(true);
                          }}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title="Edit event parameters"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        <Link
                          href={`/dashboard/events/${eventItem.id}/registrations`}
                          className="py-2 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0099e6] text-xs font-bold flex items-center justify-center gap-1 border border-sky-200 transition-all cursor-pointer"
                          title="Manage registered applicants"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Applicants</span>
                        </Link>

                        <Link
                          href={`/hackathons/${eventItem.slug}`}
                          target="_blank"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          title="View live public page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => setDeleteConfirmEvent(eventItem)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: My Registrations ─────────────────────────────── */}
      {activeTab === 'registrations' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">Your Registered Hackathons</h3>
            <span className="text-xs text-slate-500 font-bold">{registrations.length} Active registrations</span>
          </div>

          {registrations.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0099e6] flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">No Registrations Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore the hackathons directory to participate in premier arenas and build next-gen applications.
              </p>
              <Link
                href="/hackathons"
                className="inline-flex px-6 py-2.5 rounded-xl bg-[#0099e6] text-white font-bold text-xs shadow-md shadow-sky-500/20"
              >
                Explore Hackathons
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((reg) => {
                const matchedEvent = allEvents.find((e) => e.id === reg.eventId || e.slug === reg.eventId);
                return (
                  <div
                    key={reg.eventId}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {reg.status}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono font-medium">
                          {formatDate(reg.registeredAt)}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 line-clamp-1">{reg.eventName}</h4>
                      {reg.teamName && (
                        <p className="text-xs text-slate-500">
                          Squad: <strong className="text-slate-700">{reg.teamName}</strong> ({reg.role})
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={matchedEvent ? `/hackathons/${matchedEvent.slug}` : '/hackathons'}
                        className="text-xs font-bold text-[#0099e6] hover:underline"
                      >
                        View Arena Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: Saved / Bookmarked Events ────────────────────── */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">Saved Hackathons</h3>
            <span className="text-xs text-slate-500 font-bold">{bookmarkedEvents.length} Saved</span>
          </div>

          {bookmarkedEvents.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0099e6] flex items-center justify-center mx-auto">
                <Bookmark className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">No Bookmarks Saved</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click the bookmark icon on any hackathon card to save it here for fast access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedEvents.map((evt) => (
                <HackathonCard key={evt.id} event={evt} isBookmarked={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: Squads & Team Management ─────────────────────── */}
      {activeTab === 'teams' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Squads & Teammates</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage your hackathon teams, invitations, and roster requests.</p>
            </div>
            <Link
              href="/teammates"
              className="px-4 py-2 rounded-xl bg-[#0099e6] text-white text-xs font-bold shadow-xs hover:bg-[#0284c7] transition-colors"
            >
              Find Teammates
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-lg font-black text-[#0099e6]">
                HU
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hacker&apos;s Unity Core Squad</h4>
                <p className="text-xs text-slate-500">4 Active Members • Competing in CodeWars & AI Nexus</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Squad
            </span>
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Event ─────────────────────────────────────── */}
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

      {/* ─── MODAL: Delete Event Confirmation ─────────────────────── */}
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

      {/* ─── MODAL: View Registered Hackers ────────────────────────── */}
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
                      { name: 'Rahul Verma', email: 'rahul@aceit.edu.in', role: 'Fullstack Builder', status: 'CONFIRMED', date: '2026-08-16' },
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
    </div>
  );
}
