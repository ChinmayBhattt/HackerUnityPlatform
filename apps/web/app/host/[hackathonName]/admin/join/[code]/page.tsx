'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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
  Lock,
  XCircle,
  Tag,
  Share2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchInvitePreview, joinEventTeamByCode } from '@/lib/supabase-service';

interface PageProps {
  params: Promise<{
    hackathonName: string;
    code: string;
  }>;
}

function JoinAdminContent({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const hackathonSlug = resolvedParams?.hackathonName || '';
  const code = (resolvedParams?.code || '').trim();

  const { user, supabaseUser, loading: isAuthLoading } = useAuth();
  const currentUserId = supabaseUser?.id || user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [eventData, setEventData] = useState<any | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAlreadyAdmin, setIsAlreadyAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Reject state
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('No invite code provided in the link.');
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
        setError(res.error || 'This invite link is invalid, expired, or has been revoked by the host.');
        setIsLoading(false);
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

  const handleAccept = async () => {
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
      const targetId = res.data?.eventId || eventData?.id || eventData?.slug || hackathonSlug;
      router.push(`/host?edit=${encodeURIComponent(targetId)}&step=7`);
    }, 1200);
  };

  const handleRejectConfirm = () => {
    setIsRejected(true);
    setShowRejectConfirm(false);
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#0099e6]/10 border border-[#0099e6]/30 flex items-center justify-center text-[#0099e6] mb-4 animate-pulse">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verifying Co-Host Invitation...</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Loading hackathon details for <span className="font-mono text-[#0099e6]">{hackathonSlug}</span>
        </p>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 shadow-lg shadow-rose-500/10">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Invalid or Expired Invitation</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {error || 'This invite link is either expired, revoked by the event owner, or formatted incorrectly.'}
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

  // If user declined the invitation
  if (isRejected) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center text-slate-500 mb-4">
          <XCircle className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Invitation Declined</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          You have declined the invitation to co-host <strong className="text-slate-800 dark:text-slate-200">{eventData.title}</strong>. You will not receive admin access to this hackathon.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Link
            href={`/hackathons/${eventData.slug || hackathonSlug}`}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors text-center flex items-center justify-center gap-1.5"
          >
            <span>View Hackathon Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full py-2.5 px-4 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-md shadow-sky-500/20 text-center transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentPath = `/host/${encodeURIComponent(hackathonSlug)}/admin/join/${encodeURIComponent(code)}`;

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl">
        {/* Main Invite Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Top Subtle Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-gradient-to-b from-[#0099e6]/20 to-transparent blur-3xl pointer-events-none" />

          {/* Header Badges */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/50 text-[#0099e6] dark:text-[#38bdf8] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Co-Host Admin Invitation</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Hacker&apos;s Unity Platform
            </span>
          </div>

          {/* Event Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#111622] dark:to-[#0a0d14] border border-slate-200/80 dark:border-white/[0.06] p-4 sm:p-5 space-y-3.5">
            {eventData.bannerUrl && (
              <div className="w-full h-28 sm:h-32 rounded-xl overflow-hidden mb-3 border border-slate-200/50 dark:border-white/[0.05]">
                <img
                  src={eventData.bannerUrl}
                  alt={eventData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-[#0099e6]/10 border border-[#0099e6]/25 flex items-center justify-center text-xl shrink-0 overflow-hidden shadow-xs">
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
                  Organized by <strong className="text-slate-800 dark:text-slate-200">{eventData.organizerName || 'Event Host'}</strong>
                </p>
              </div>
            </div>

            {/* Event Metadata Tags */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
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
              {eventData.category && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#0099e6]" />
                  <span>{eventData.category}</span>
                </div>
              )}
            </div>
          </div>

          {/* Invitation Headline */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              You&apos;re invited to join as an Event Admin
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <strong className="text-slate-900 dark:text-white">{eventData.organizerName || 'The host'}</strong> has invited you to collaborate as a Co-Host Administrator for{' '}
              <strong className="text-[#0099e6] dark:text-[#38bdf8]">{eventData.title}</strong>.
            </p>
          </div>

          {/* Privileges Checklist */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.05]">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Permissions Granted Upon Joining:</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Full access to edit hackathon schedule, parameters, tracks, and prizes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Review participant registrations, submissions, and team details</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Manage hackathon live studio directly from your Organizer Dashboard</span>
              </li>
            </ul>
          </div>

          {/* Success Notification */}
          {joinSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{joinSuccess} Redirecting to Hackathon Studio...</span>
            </div>
          )}

          {/* Reject Confirmation Dialog State */}
          {showRejectConfirm && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Decline this invitation?
                  </h4>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    You will not be added as an admin for this hackathon. You can always ask the host to send a new link later.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Yes, Decline
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectConfirm(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-white/[0.08] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons Section */}
          <div className="pt-2 space-y-3">
            {!currentUserId ? (
              <div className="space-y-3">
                <Link
                  href={`/login?redirectTo=${encodeURIComponent(currentPath)}`}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Accept Invitation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRejectConfirm(true)}
                    className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium transition-colors cursor-pointer"
                  >
                    Decline Invitation
                  </button>
                </div>
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
              <div className="space-y-3">
                {/* Accept and Reject Buttons Row */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Reject Button */}
                  <button
                    type="button"
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={isJoining || Boolean(joinSuccess)}
                    className="w-full sm:w-1/3 py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-rose-50 dark:bg-white/[0.06] dark:hover:bg-rose-950/30 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 hover:border-rose-200 dark:border-white/[0.08] dark:hover:border-rose-900/40 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  {/* Accept Button */}
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={isJoining || Boolean(joinSuccess)}
                    className="w-full sm:w-2/3 py-3.5 px-6 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] active:scale-[0.99] disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Accepting & Joining...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Invitation</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                  By accepting, you agree to co-manage this event in accordance with platform policies.
                </p>
              </div>
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

export default function DynamicJoinAdminPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0099e6]" />
        </div>
      }
    >
      <JoinAdminContent params={params} />
    </Suspense>
  );
}
