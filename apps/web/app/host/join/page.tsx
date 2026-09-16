'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  Users,
  Edit3,
  Rocket,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchInvitePreview, joinEventTeamByCode } from '@/lib/supabase-service';

function JoinAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCode = searchParams?.get('code') || searchParams?.get('token') || '';
  const code = rawCode.trim();

  const { user, supabaseUser, loading: isAuthLoading } = useAuth();
  const currentUserId = supabaseUser?.id || user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [eventData, setEventData] = useState<any | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAlreadyAdmin, setIsAlreadyAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError('No invite code provided. Please use the complete invite link sent by the event organizer.');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadPreview() {
      setIsLoading(true);
      setError(null);
      const res = await fetchInvitePreview(code);
      if (!isMounted) return;

      if (!res.success || !res.data?.event) {
        setError(res.error || 'This invite link is invalid or has been revoked by the event organizer.');
        setIsLoading(false);
        return;
      }

      if (res.data?.event?.slug) {
        router.replace(`/host/${encodeURIComponent(res.data.event.slug)}/admin/join/${encodeURIComponent(code)}`);
        return;
      }

      setEventData(res.data.event);
      setIsOwner(Boolean(res.data.isOwner));
      setIsAlreadyAdmin(Boolean(res.data.isAlreadyAdmin));
      setIsLoading(false);
    }

    loadPreview();
    return () => {
      isMounted = false;
    };
  }, [code, currentUserId]);

  const handleJoin = async () => {
    if (!code) return;
    setIsJoining(true);
    setError(null);

    const res = await joinEventTeamByCode(code);
    setIsJoining(false);

    if (!res.success) {
      setError(res.error || 'Failed to accept invitation. Please try again.');
      return;
    }

    setJoinSuccess(res.data?.message || 'You have joined as an Event Admin!');
    setTimeout(() => {
      const targetId = res.data?.eventId || eventData?.id || eventData?.slug;
      router.push(`/host?edit=${encodeURIComponent(targetId)}&step=7`);
    }, 1200);
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#0099e6]/10 border border-[#0099e6]/30 flex items-center justify-center text-[#0099e6] mb-4 animate-pulse">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verifying Event Invitation...</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Checking hackathon co-host credentials</p>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Invalid or Expired Invite</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {error || 'This invite link is either expired, revoked, or formatted incorrectly.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Link
            href="/dashboard"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors text-center"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/hackathons"
            className="w-full py-2.5 px-4 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-md shadow-sky-500/20 text-center transition-all"
          >
            Explore Hackathons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl">
        {/* Main Invite Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Subtle Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-[#0099e6]/15 blur-3xl pointer-events-none" />

          {/* Header Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-[#0099e6] dark:text-[#38bdf8] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Event Admin Invitation</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Hacker&apos;s Unity Platform
            </span>
          </div>

          {/* Event Mini Banner / Header */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/[0.03] dark:to-white/[0.01] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0099e6]/10 border border-[#0099e6]/20 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                {eventData.logoUrl ? (
                  <img src={eventData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{eventData.organizerAvatar || '⚡'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {eventData.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Hosted by <strong className="text-slate-800 dark:text-slate-200">{eventData.organizerName}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-1 border-t border-slate-200/60 dark:border-white/[0.04]">
              {eventData.startDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0099e6]" />
                  <span>{new Date(eventData.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {eventData.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0099e6]" />
                  <span>{eventData.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Invitation Pitch */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              You&apos;re invited to join as an Event Admin
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Accepting this invitation grants you full administrative privileges to co-manage, edit, and organize{' '}
              <strong className="text-slate-900 dark:text-white">{eventData.title}</strong> alongside the host.
            </p>
          </div>

          {/* Admin Privileges Checklist */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.05]">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Your Admin Privileges:</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Edit hackathon schedule, parameters, tracks, and prizes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Manage submission requirements, stages, and eligibility</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Access the event directly from your Organizer Dashboard anytime</span>
              </li>
            </ul>
          </div>

          {/* Success message if just joined */}
          {joinSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{joinSuccess} Redirecting to Studio...</span>
            </div>
          )}

          {/* Actions depending on Auth State */}
          <div className="pt-2 space-y-3">
            {!currentUserId ? (
              <div className="space-y-3">
                <Link
                  href={`/login?redirectTo=${encodeURIComponent(`/host/join?code=${code}`)}`}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Accept Invitation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                  You need a Hacker&apos;s Unity builder account to be assigned admin privileges.
                </p>
              </div>
            ) : isOwner ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>You are the primary host & owner of this hackathon!</span>
                </div>
                <Link
                  href={`/host?edit=${encodeURIComponent(eventData.id || eventData.slug)}&step=7`}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-sm shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Open Hackathon Studio (Team Tab)</span>
                </Link>
              </div>
            ) : isAlreadyAdmin ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-sky-800 dark:text-sky-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>You are already an authorized Event Admin for this hackathon.</span>
                </div>
                <Link
                  href={`/host?edit=${encodeURIComponent(eventData.id || eventData.slug)}`}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-sm shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Open Hackathon Studio to Edit</span>
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleJoin}
                disabled={isJoining || Boolean(joinSuccess)}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining Event Team...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Accept & Join as Event Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-500 dark:text-slate-500 mt-6">
          Hacker&apos;s Unity • India&apos;s Fastest Growing Tech & Hackathon Platform
        </p>
      </div>
    </div>
  );
}

export default function JoinAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0099e6]" />
        </div>
      }
    >
      <JoinAdminContent />
    </Suspense>
  );
}
