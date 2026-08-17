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
import { HackathonCard } from '@/components/hackathon-card';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AuthModal } from '@/components/auth-modal';
import { AvatarUpload } from '@/components/avatar-upload';
import { EditEventModal } from '@/components/edit-event-modal';

export default function DashboardPage() {
  const { user, updateUserProfile, updateUserPassword, signOut, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'hosted' | 'profile' | 'registrations' | 'bookmarks' | 'teams'>('hosted');
  const [registrations, setRegistrations] = useState<UserRegistrationItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [allEvents, setAllEvents] = useState<ExtendedEvent[]>([]);

  // Event Management State
  const [editingEvent, setEditingEvent] = useState<ExtendedEvent | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewingHackersEvent, setViewingHackersEvent] = useState<ExtendedEvent | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<ExtendedEvent | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

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
  const totalHackersCount = allEvents.reduce((acc, e) => acc + (e.participantsCount || 0), 0);
  const totalPrizeSum = allEvents.reduce((acc, e) => acc + (e.totalPrizeValue || 0), 0);
  const totalImpressions = allEvents.reduce((acc, e) => acc + (e.participantsCount ? e.participantsCount * 24 : 8000), 0);
  const liveEventsCount = allEvents.filter((e) => e.status !== 'COMPLETED').length;

  const handleEditEventSave = (updated: ExtendedEvent) => {
    updateHostedEvent(updated);
    setAllEvents(getAllEvents());
    setActionSuccessMsg(`"${updated.title}" was updated successfully.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleDeleteEventConfirm = () => {
    if (!deleteConfirmEvent) return;
    deleteHostedEvent(deleteConfirmEvent.id);
    setAllEvents(getAllEvents());
    setActionSuccessMsg(`"${deleteConfirmEvent.title}" has been deleted.`);
    setDeleteConfirmEvent(null);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleExportCSV = (eventItem: ExtendedEvent) => {
    const csvRows = [
      ['Participant Name', 'Email', 'Role', 'Status', 'Registration Date'],
      ['Chinmay Bhatt', 'chinmay@hackersunity.dev', 'Lead Developer', 'CONFIRMED', '2026-08-10'],
      ['Aarav Sharma', 'aarav@neuralforge.dev', 'AI Engineer', 'CONFIRMED', '2026-08-11'],
      ['Elena Rostova', 'elena@zkproofs.ch', 'Smart Contract Dev', 'CONFIRMED', '2026-08-12'],
      ['Devansh Patel', 'devansh@pulsefin.in', 'Backend Architect', 'SUBMITTED', '2026-08-14'],
      ['Sophia Chen', 'sophia@stanford.edu', 'ML Specialist', 'CONFIRMED', '2026-08-15'],
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

    const finalAvatar = avatar || null;

    const res = await updateUserProfile({
      name,
      phone,
      bio,
      college,
      avatarUrl: finalAvatar,
      skills: skills,
      socialLinks: {
        github,
        linkedin,
        portfolio,
      },
    });

    setIsSavingProfile(false);
    if (res.error) {
      setProfileError(res.error);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updateUserPassword(newPassword);
    setIsUpdatingPassword(false);

    if (res.error) {
      setPasswordMsg({ type: 'error', text: res.error });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#0099e6] border-t-transparent animate-spin" />
      </div>
    );
  }

  // If user is not logged in
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0099e6] mb-6 shadow-sm">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hacker Dashboard</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          Sign in to view and edit your profile, registered hackathons, squads, and security credentials.
        </p>
        <button
          onClick={() => setAuthOpen(true)}
          className="mt-6 px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-sm shadow-md shadow-sky-500/20 cursor-pointer transition-all"
        >
          Sign In / Create Account
        </button>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ─── Profile Banner Header Card ─────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          {/* Avatar / Logo */}
          <div className="w-20 h-20 rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center font-black text-4xl text-[#0099e6] shadow-sm shrink-0 overflow-hidden">
            {avatar && (avatar.startsWith('data:') || avatar.startsWith('http')) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{name || user?.name || 'Hacker'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-[#0099e6] border border-sky-200">
                Hacker's Unity Member
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
              <span>{college || user?.college || 'Developer Community'}</span>
              <span>•</span>
              <span>{email || user?.email}</span>
            </p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {skills.slice(0, 5).map((s) => (
                <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="flex items-center w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <button
            onClick={() => signOut()}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
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
          <span>Hosted Events & Analytics ({allEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Edit Profile & Security</span>
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
          {/* Analytics KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hosted Events</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0099e6] flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-mono">{allEvents.length}</span>
                <span className="text-[11px] font-bold text-emerald-600">({liveEventsCount} Live)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">All active & archived arenas</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Builders</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0099e6] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#0099e6] font-mono">{totalHackersCount.toLocaleString()}+</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Across all hosted arenas</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prize Pool Deployed</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#ea580c] font-mono">{formatCurrency(totalPrizeSum)}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Total bounties & grants</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Impressions</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600 font-mono">{(totalImpressions / 1000).toFixed(0)}K+</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Global builder visibility</p>
            </div>
          </div>

          {/* Section Header & Host Button */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0099e6]" />
                <span>Manage Your Hackathons & Events</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Live dashboard to update event parameters, manage participants, edit prize pools, or create new hackathons.
              </p>
            </div>

            <Link
              href="/host"
              className="px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Host New Hackathon</span>
            </Link>
          </div>

          {/* Hosted Events List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allEvents.map((eventItem) => (
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

                    <button
                      onClick={() => setViewingHackersEvent(eventItem)}
                      className="py-2 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0099e6] text-xs font-bold flex items-center justify-center gap-1 border border-sky-200 transition-all cursor-pointer"
                      title="View registered builders"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Hackers</span>
                    </button>

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
      )}

      {/* ─── TAB 1: Complete Profile & Password Editor ───────────── */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in">
          {/* Left: General Profile Form (7 cols) */}
          <form onSubmit={handleSaveProfile} className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#0099e6]" />
                <span>Complete Profile Information</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">All fields editable</span>
            </div>

            {profileSaved && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile updated & saved to Supabase!</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {/* 1. Profile Logo / Photo Upload with Crop */}
            <AvatarUpload
              currentAvatar={avatar}
              onAvatarChange={(dataUrl) => setAvatar(dataUrl)}
              onAvatarRemove={() => setAvatar(null)}
            />

            {/* 2. Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* 3. Phone Number & University */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">University / Organization</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Stanford / IIT / Independent"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
                />
              </div>
            </div>

            {/* 4. Bio & Specialties */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio & Specialties</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell hackathons and teammates about your skills and experience..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none resize-none leading-relaxed font-medium"
              />
            </div>

            {/* 5. Skills Tag Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tech Stack & Skills</label>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-[#0099e6] font-bold"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-rose-600 cursor-pointer"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. PyTorch, Rust, Solidity)..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* 6. Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Profile</label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Profile</label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Portfolio / Website</label>
                <input
                  type="text"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>

          {/* Right: Change Password Card (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <KeyRound className="w-4 h-4 text-[#ea580c]" />
              <span>Change Account Password</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Update your password securely in Supabase. You will remain logged in on this session.
            </p>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 font-bold animate-in fade-in ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Update Password in Supabase</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Registrations ─────────────────────────────────── */}
      {activeTab === 'registrations' && (
        <div className="space-y-4 animate-in fade-in">
          {registrations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No registered hackathons yet</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Explore our directory and sign up for an upcoming sprint.</p>
              <Link
                href="/hackathons"
                className="mt-4 inline-block px-4 py-2 rounded-xl bg-[#0099e6] text-white text-xs font-bold"
              >
                Browse Hackathons
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registrations.map((reg) => (
                <div
                  key={reg.eventId}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {reg.status}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{reg.eventName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Registered on {formatDate(reg.registeredAt)}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Participation Mode:</span>
                      <span className="font-bold text-slate-900">{reg.isTeam ? 'Squad / Team' : 'Solo Hacker'}</span>
                    </div>
                    {reg.teamName && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Squad Name:</span>
                        <span className="font-bold text-[#ea580c]">{reg.teamName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Your Role:</span>
                      <span className="font-bold text-[#0099e6]">{reg.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/hackathons/ai-nexus-global-2026`}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center border border-slate-200"
                    >
                      View Event Hub
                    </Link>
                    <button className="px-4 py-2 rounded-xl bg-sky-50 text-[#0099e6] text-xs font-bold border border-sky-200 hover:bg-sky-100 cursor-pointer">
                      Submit Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: Bookmarks ─────────────────────────────────────── */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4 animate-in fade-in">
          {bookmarkedEvents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No saved hackathons</h3>
              <p className="text-xs text-slate-500 mt-1">Click the bookmark icon on any hackathon card to save it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedEvents.map((event) => (
                <HackathonCard key={event.id} event={event} isBookmarked={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: Teams & Invites ───────────────────────────────── */}
      {activeTab === 'teams' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0099e6]" />
              <span>Active Squad: CyberSynthetics (AI Nexus Hackathon)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0099e6] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  C
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{name || user?.name} (You)</div>
                  <div className="text-[10px] text-[#0099e6] font-bold">Team Lead & AI Core</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f97316] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  E
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Elena Rostova</div>
                  <div className="text-[10px] text-[#ea580c] font-bold">UI/UX & Next.js</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-center">
                <Link href="/teammates" className="text-xs text-[#0099e6] hover:underline font-bold">
                  + Invite 3rd Member
                </Link>
              </div>
            </div>
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
              <span>Showing 5 recent verified participants</span>
              <button
                onClick={() => setViewingHackersEvent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors"
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
