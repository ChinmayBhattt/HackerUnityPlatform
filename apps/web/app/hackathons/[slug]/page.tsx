'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Calendar,
  MapPin,
  Bookmark,
  Share2,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  Layers,
  Award,
  Users,
  ShieldCheck,
  Rocket,
} from 'lucide-react';
import { useEvent } from '@/lib/hooks/use-events';
import { useEventRegistration } from '@/lib/hooks/use-registration';
import { toggleBookmarkEvent, getBookmarkedEventIds } from '@/lib/storage';
import { formatCurrency, formatDate, formatDateTime, getDaysLeft, getStatusBadge, getCategoryBadge, getEventTypeBadge } from '@/lib/utils';
import { RegistrationModal } from '@/components/registration-modal';
import { TeamRegistrationModal } from '@/components/team-registration-modal';
import { fetchUserTeamForEvent } from '@/lib/supabase-service';

import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function HackathonDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { event, loading, refresh } = useEvent(resolvedParams.slug);
  const { isRegistered } = useEventRegistration(event?.id || '');
  const { user, supabaseUser } = useAuth();
  const [userSquad, setUserSquad] = useState<any | null>(null);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  useEffect(() => {
    setUserSquad(null);
    if (!event) return;
    const userId = supabaseUser?.id || user?.id;
    if (userId) {
      fetchUserTeamForEvent(event.id, userId).then((squad) => {
        setUserSquad(squad);
      });
    } else {
      setUserSquad(null);
    }
  }, [event?.id, event?.slug, user?.id, supabaseUser?.id, isRegistered]);

  useEffect(() => {
    if (!event) return;
    const checkState = () => {
      const bookmarks = getBookmarkedEventIds();
      setIsBookmarked(bookmarks.includes(event.id) || bookmarks.includes(event.slug));
    };
    checkState();
    window.addEventListener('hackers_unity_storage_change', checkState);
    return () => window.removeEventListener('hackers_unity_storage_change', checkState);
  }, [event]);

  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'prizes' | 'rules' | 'sponsors' | 'faqs'>('overview');
  const [showRegModal, setShowRegModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#0099e6] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The event you are looking for does not exist or has been removed.</p>
        <Link
          href="/hackathons"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-[#0099e6] text-white text-xs font-bold"
        >
          Explore All Events
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusBadge(event.status);
  const categoryInfo = getCategoryBadge(event.category);
  const eventTypeInfo = getEventTypeBadge(event.eventType);
  const deadlineInfo = getDaysLeft(event.registrationDeadline);

  const handleBookmarkToggle = () => {
    const userId = supabaseUser?.id || user?.id;
    toggleBookmarkEvent(event.id, userId);
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Tracks' },
    { id: 'timeline', label: 'Stages & Timeline' },
    { id: 'prizes', label: 'Prizes & Perks' },
    { id: 'rules', label: 'Rules & Criteria' },
    { id: 'sponsors', label: 'Sponsors & Judges' },
    { id: 'faqs', label: 'FAQs' },
  ];

  return (
    <div className="flex-1 pb-20">
      {/* ─── Top Banner Hero ────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-sky-50 via-white to-orange-50/60 border-b border-slate-200 pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-semibold">
            <Link href="/hackathons" className="flex items-center gap-1 hover:text-[#0099e6] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Hackathons</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 truncate max-w-xs">{event.title}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-6 max-w-3xl">
              {/* Event / Hackathon Logo */}
              {(event.logoUrl || event.organizerLogo) ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-1.5 shadow-md shrink-0 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.logoUrl || event.organizerLogo}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl border border-sky-200/90 bg-gradient-to-br from-sky-50 to-sky-100 shadow-md shrink-0 flex items-center justify-center text-2xl sm:text-3xl font-black text-[#0099e6]">
                  {event.organizerAvatar || '⚡'}
                </div>
              )}

              <div className="space-y-3 sm:space-y-4 flex-1 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#0099e6] border border-[#0099e6]/20 shadow-2xs">
                    {categoryInfo.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200">
                    {eventTypeInfo.icon} {eventTypeInfo.label}
                  </span>
                  {event.featured && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#ea580c] border border-orange-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Featured Flagship
                    </span>
                  )}
                  {isRegistered && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {event.title}
                </h1>

                {/* Tagline if available */}
                {event.tagline && (
                  <p className="text-base sm:text-lg font-medium text-slate-700">
                    {event.tagline}
                  </p>
                )}

                {/* Organizer & Location */}
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{event.organizerAvatar}</span>
                    <span>Organized by <strong className="text-slate-900">{event.organizerName}</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-4 h-4 text-[#0099e6]" />
                    <span>{event.location || 'Virtual / Online'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions (Bookmark, Share) */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBookmarkToggle}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                  isBookmarked
                    ? 'bg-[#0099e6] text-white border-[#0099e6] shadow-sm'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                <Bookmark className="w-4 h-4 fill-current" />
                <span>{isBookmarked ? 'Bookmarked' : 'Save'}</span>
              </button>

              <button
                onClick={handleShare}
                className="p-3 rounded-2xl bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content & Sidebar Layout ──────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Tabs & Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Navigation */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#0099e6] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in">
                {/* ─── Your Registered Squad Card (if registered in a team) ─── */}
                {userSquad && (
                  <div className="bg-gradient-to-br from-sky-50/80 via-white to-orange-50/50 p-6 rounded-3xl border-2 border-sky-200 shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0099e6] to-sky-600 flex items-center justify-center text-white text-lg font-black shadow-md shadow-sky-500/25">
                          {userSquad.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900">{userSquad.name}</h3>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                              Your Squad
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Leader: <strong className="text-slate-700">{userSquad.profiles?.name || 'Squad Lead'}</strong>
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/hackathons/${event.slug}/register`}
                        className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-sm shadow-sky-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Manage Squad & Invites →</span>
                      </Link>
                    </div>

                    {/* Member Avatars list */}
                    {userSquad.team_members && userSquad.team_members.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Squad Members ({userSquad.team_members.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {userSquad.team_members.map((m: any) => (
                            <div
                              key={m.id || m.user_id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs shadow-2xs"
                            >
                              <div className="w-5 h-5 rounded-full bg-sky-100 text-[#0099e6] font-bold text-[9px] flex items-center justify-center">
                                {(m.profiles?.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-800">{m.profiles?.name || 'Teammate'}</span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                m.role === 'LEADER' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {m.role === 'LEADER' ? 'Lead' : 'Member'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Event Photo / Poster with Logo Overlay */}
                {(event.image || event.bannerUrl) && (
                  <div className="relative mb-6">
                    <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.image || event.bannerUrl || ''}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {(event.logoUrl || event.organizerLogo) && (
                      <div className="absolute -bottom-5 left-6 w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden p-1 flex items-center justify-center z-10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.logoUrl || event.organizerLogo}
                          alt={`${event.title} logo`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">About the Hackathon</h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-lg bg-sky-50 border border-sky-100 text-xs font-mono font-semibold text-[#0099e6]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tracks */}
                {event.tracks && event.tracks.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#0099e6]" />
                      <span>Challenge Tracks & Problem Statements</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {event.tracks.map((track) => (
                        <div
                          key={track.title}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900">{track.title}</h4>
                            {track.prize && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-[#ea580c] border border-orange-200">
                                {track.prize}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{track.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Squad Callout for Team Events */}
                {event.isTeamEvent && (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-orange-50 border border-sky-200 flex items-center justify-between gap-4 shadow-sm">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Form or Join a Squad</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        This event allows squads of {event.minTeamSize}-{event.maxTeamSize} builders.
                      </p>
                    </div>
                    <Link
                      href={`/hackathons/${event.slug}/register`}
                      className="px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all shadow-xs whitespace-nowrap"
                    >
                      Squad Registration Portal
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Timeline */}
            {activeTab === 'timeline' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0099e6]" />
                  <span>Stages & Timeline</span>
                </h3>
                <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-200">
                  {event.stages && event.stages.length > 0 ? (
                    event.stages.map((stage) => (
                      <div key={stage.id} className="relative space-y-1">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0099e6] border-4 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs" />
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">
                            Stage {stage.stageOrder}: {stage.stageName}
                          </h4>
                          <span className="text-xs text-[#0099e6] font-mono font-bold">
                            {formatDate(stage.startDate || event.startDate)} - {formatDate(stage.endDate || event.endDate)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{stage.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4">
                      <div className="relative space-y-1">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0099e6] border-4 border-white shadow-xs" />
                        <h4 className="text-sm font-bold text-slate-900">Registration Phase</h4>
                        <span className="text-xs text-[#0099e6] font-mono font-bold">
                          Deadline: {formatDate(event.registrationDeadline)}
                        </span>
                      </div>
                      <div className="relative space-y-1">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#ea580c] border-4 border-white shadow-xs" />
                        <h4 className="text-sm font-bold text-slate-900">Hacking Sprint</h4>
                        <span className="text-xs text-[#ea580c] font-mono font-bold">
                          {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Prizes */}
            {activeTab === 'prizes' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#ea580c]" />
                    <span>Prizes & Perks Breakdown</span>
                  </h3>
                  <div className="text-sm font-black text-[#ea580c] font-mono">
                    Total Pool: {formatCurrency(event.totalPrizeValue)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.prizes && event.prizes.length > 0 ? (
                    event.prizes.map((prize) => (
                      <div
                        key={prize.position}
                        className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 space-y-2 relative overflow-hidden"
                      >
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          {prize.position}
                        </div>
                        <div className="text-2xl font-black text-[#ea580c] font-mono">
                          {formatCurrency(prize.amount)}
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{prize.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                      <div className="text-2xl font-black text-[#ea580c] font-mono">
                        {formatCurrency(event.totalPrizeValue)}
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">Cash prizes, grants, and exclusive swags.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Rules */}
            {activeTab === 'rules' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900">Rules & Guidelines</h3>
                {event.rulesText ? (
                  <p className="text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                    {event.rulesText}
                  </p>
                ) : (
                  <ul className="space-y-3 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>All code must be newly written during the official hackathon sprint duration.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>Teams can consist of <strong>{event.minTeamSize || 1}</strong> to <strong>{event.maxTeamSize || 4}</strong> hackers.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>A public repository and working demo video must be submitted before deadline.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>100% intellectual property (IP) is retained by the builders.</span>
                    </li>
                  </ul>
                )}
              </div>
            )}

            {/* TAB CONTENT: Sponsors */}
            {activeTab === 'sponsors' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#f97316]" />
                  <span>Sponsors & Partners</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {event.sponsors && event.sponsors.length > 0 ? (
                    event.sponsors.map((sponsor) => (
                      <div
                        key={sponsor.name}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center justify-center space-y-2"
                      >
                        <div className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center font-mono font-bold text-xs text-[#0099e6]">
                          {sponsor.logoText || 'PARTNER'}
                        </div>
                        <div className="text-xs font-bold text-slate-900">{sponsor.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">{sponsor.tier}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2">
                      <div className="text-xs font-bold text-slate-900">{event.organizerName}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Lead Organizer</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: FAQs */}
            {activeTab === 'faqs' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#0099e6]" />
                  <span>Frequently Asked Questions</span>
                </h3>
                <div className="space-y-3">
                  {event.faqs && event.faqs.length > 0 ? (
                    event.faqs.map((faq) => {
                      const isOpen = expandedFaq === faq.id;
                      return (
                        <div
                          key={faq.id}
                          className="rounded-xl bg-slate-50 border border-slate-200/80 overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                            className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-900 hover:text-[#0099e6] transition-colors cursor-pointer"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 font-medium">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">No FAQs available for this event yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Action Box (1 col) */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5">
              {/* Prize Pool Highlight */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Prize Pool</div>
                <div className="text-3xl font-black text-[#ea580c] font-mono mt-0.5">
                  {event.prize || formatCurrency(event.totalPrizeValue)}
                </div>
              </div>

              {/* Deadline & Countdown */}
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Registration Closes:</span>
                  <span className="text-[#ea580c] font-black">{deadlineInfo.text}</span>
                </div>
                <div className="text-xs font-mono text-[#0099e6] font-bold">
                  {formatDateTime(event.registrationDeadline)}
                </div>
              </div>

              {/* Primary Register CTA */}
              {isRegistered ? (
                <Link
                  href={`/hackathons/${event.slug}/register`}
                  className="w-full py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-sm text-center flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>You Are Registered • View Squad →</span>
                </Link>
              ) : event.registrationLink && event.registrationLink.startsWith('http') ? (
                <a
                  href={event.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-sm shadow-md shadow-sky-500/20 transition-all text-center block"
                >
                  Register on External Portal ↗
                </a>
              ) : (
                <Link
                  href={`/hackathons/${event.slug}/register`}
                  className="w-full py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-sm shadow-md shadow-sky-500/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Register for Hackathon</span>
                </Link>
              )}

              {/* Quick Info Grid */}
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Team Size</span>
                  <span className="font-bold text-slate-900">
                    {event.minTeamSize === event.maxTeamSize
                      ? `${event.minTeamSize} Members`
                      : `${event.minTeamSize} - ${event.maxTeamSize} Members`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Starts</span>
                  <span className="font-bold text-slate-900">{formatDate(event.startDate)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Ends</span>
                  <span className="font-bold text-slate-900">{formatDate(event.endDate)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Live Participants</span>
                  <span className="font-bold text-[#0099e6] font-mono">
                    {event.participantsCount || 1}+ Builders
                  </span>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-emerald-600 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Realtime Event Arena</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RegistrationModal
        event={event}
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        onSuccess={() => {
          setShowRegModal(false);
          refresh();
        }}
      />

      <TeamRegistrationModal
        event={event}
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onSuccess={() => {
          setShowTeamModal(false);
          refresh();
        }}
      />
    </div>
  );
}
