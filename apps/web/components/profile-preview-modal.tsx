'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Rocket,
  Github,
  Linkedin,
  Globe,
  ExternalLink,
  Share2,
  Check,
  Building,
  GraduationCap,
  Sparkles,
  Calendar,
  Layers,
  Code2,
} from 'lucide-react';
import Link from 'next/link';
import { FullPublicProfileData, getPublicUserProfileByUsername, PublicProfileResult } from '@/lib/supabase-service';
import { formatCurrency } from '@/lib/utils';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Can be initialized with quick search result or username
  initialProfile?: PublicProfileResult | null;
  username?: string | null;
}

export function ProfilePreviewModal({
  isOpen,
  onClose,
  initialProfile,
  username,
}: ProfilePreviewModalProps) {
  const [data, setData] = useState<FullPublicProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'winnings' | 'participations' | 'projects'>('winnings');
  const [copied, setCopied] = useState(false);

  const targetUsername = username || initialProfile?.username;

  useEffect(() => {
    if (!isOpen || !targetUsername) {
      if (!isOpen) setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getPublicUserProfileByUsername(targetUsername).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
        // Default to winnings if they have any, otherwise participations
        if (res && res.winnings.length === 0 && res.participations.length > 0) {
          setActiveTab('participations');
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetUsername]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const user = data?.user || initialProfile;
  const winnings = data?.winnings || [];
  const participations = data?.participations || [];
  const submissions = data?.submissions || [];

  const shareUrl = typeof window !== 'undefined' && targetUsername
    ? `${window.location.origin}/profile/${encodeURIComponent(targetUsername)}`
    : `https://hackersunity.com/profile/${targetUsername || ''}`;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Safe formatting for external links
  const formatExternalLink = (url?: string | null, prefix = '') => {
    if (!url) return null;
    const clean = url.trim();
    if (!clean) return null;
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    if (prefix && !clean.includes('.')) return `https://${prefix}/${clean.replace(/^@/, '')}`;
    return `https://${clean}`;
  };

  const githubLink = formatExternalLink(user?.socialLinks?.github, 'github.com');
  const linkedinLink = formatExternalLink(user?.socialLinks?.linkedin, 'linkedin.com/in');
  const portfolioLink = formatExternalLink(user?.socialLinks?.portfolio);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer overflow-y-auto"
    >
      <div
        className="relative w-full max-w-2xl my-auto overflow-hidden rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.1] shadow-2xl dark:shadow-black/95 cursor-default transition-all max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="relative h-28 sm:h-36 w-full bg-gradient-to-r from-sky-600 via-indigo-600 to-cyan-500 overflow-hidden shrink-0">
          {user?.bannerUrl ? (
            <img
              src={user.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Header & Stats */}
        <div className="px-5 sm:px-6 pt-0 pb-4 shrink-0 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-14 gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl border-4 border-white dark:border-[#0c1017] bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl overflow-hidden flex items-center justify-center text-white text-2xl font-black">
                {user?.avatarUrl && user.avatarUrl.length > 4 ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(user?.name || 'H')[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-[#0099e6] text-[10px] font-black uppercase text-white shadow-xs">
                PRO
              </div>
            </div>

            {/* Quick Actions (Share & Full Profile) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer"
                title="Copy profile link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>

              {targetUsername && (
                <Link
                  href={`/profile/${encodeURIComponent(targetUsername)}`}
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-xs font-bold text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                >
                  <span>Full Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Identity details */}
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {user?.name || 'Hacker Builder'}
              </h3>
              {targetUsername && (
                <span className="text-xs font-mono font-bold text-[#0099e6] bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-500/20">
                  @{targetUsername}
                </span>
              )}
              {user?.role && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400">
                  {user.role}
                </span>
              )}
            </div>

            {/* University / Company Info */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              {user?.college && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {user.college}
                </span>
              )}
              {user?.organization && user.organization !== user?.college && (
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {user.organization}
                </span>
              )}
            </div>

            {/* Bio */}
            {user?.bio && (
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                {user.bio}
              </p>
            )}

            {/* Social Buttons (LinkedIn, GitHub, Portfolio) */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-2">
              {linkedinLink ? (
                <a
                  href={linkedinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] dark:text-[#38bdf8] text-xs font-bold border border-[#0077b5]/30 transition-all cursor-pointer"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </a>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-400 text-xs font-medium border border-slate-200/50 dark:border-white/[0.04]">
                  <Linkedin className="w-3.5 h-3.5 opacity-40" />
                  <span>No LinkedIn</span>
                </span>
              )}

              {githubLink ? (
                <a
                  href={githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:hover:bg-white/20 text-slate-900 dark:text-white text-xs font-bold border border-slate-300 dark:border-white/20 transition-all cursor-pointer"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-400 text-xs font-medium border border-slate-200/50 dark:border-white/[0.04]">
                  <Github className="w-3.5 h-3.5 opacity-40" />
                  <span>No GitHub</span>
                </span>
              )}

              {portfolioLink && (
                <a
                  href={portfolioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Portfolio</span>
                </a>
              )}
            </div>

            {/* Skills */}
            {user?.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {user.skills.slice(0, 7).map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab navigation: Winnings (🏆) vs Participations (🚀) vs Projects */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('winnings')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'winnings'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Winnings ({winnings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('participations')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'participations'
                ? 'border-[#0099e6] text-[#0099e6]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-[#0099e6]" />
            <span>Participations ({participations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Projects ({submissions.length})</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#0099e6] border-t-transparent animate-spin" />
              <p className="text-xs text-slate-400">Loading builder accomplishments...</p>
            </div>
          ) : activeTab === 'winnings' ? (
            winnings.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-amber-500/5 border border-amber-500/10 p-6">
                <Trophy className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No Podium Wins Recorded Yet
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  This builder is actively competing in upcoming hackathons to claim their first trophy!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {winnings.map((win) => (
                  <div
                    key={win.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-50 to-amber-500/5 dark:from-amber-500/10 dark:via-white/[0.02] dark:to-transparent border border-amber-500/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            PODIUM WINNER
                          </span>
                          {win.track && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              {win.track}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {win.projectTitle}
                        </h4>
                      </div>

                      {(win.totalPrizeValue ?? 0) > 0 && (
                        <div className="text-right">
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                            {formatCurrency(win.totalPrizeValue!)}
                          </span>
                        </div>
                      )}
                    </div>

                    {win.tagline && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">
                        {win.tagline}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-amber-500/20 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Won at: <strong className="text-slate-800 dark:text-white">{win.eventTitle}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {win.repoUrl && (
                          <a
                            href={formatExternalLink(win.repoUrl) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-bold text-[#0099e6] hover:underline"
                          >
                            <Github className="w-3 h-3" /> Code
                          </a>
                        )}
                        {win.demoUrl && (
                          <a
                            href={formatExternalLink(win.demoUrl) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> Demo
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'participations' ? (
            participations.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] p-6">
                <Rocket className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No Hackathon Participations Yet
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  This user has not yet joined any live competitions on Hacker&apos;s Unity.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {participations.map((part) => (
                  <div
                    key={part.registrationId}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] hover:border-[#0099e6]/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#0099e6]/10 text-[#0099e6]">
                          {part.eventType}
                        </span>
                        {part.teamName && (
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            Team: {part.teamName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {part.eventTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Role: {part.role} • By {part.organizerName}
                      </p>
                    </div>

                    <Link
                      href={`/hackathons/${part.eventSlug}`}
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0099e6] hover:text-white dark:bg-white/[0.06] dark:hover:bg-[#0099e6] text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shrink-0"
                    >
                      View Event
                    </Link>
                  </div>
                ))}
              </div>
            )
          ) : (
            submissions.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] p-6">
                <Code2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No Project Submissions
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Projects built for hackathons will appear here once submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {sub.projectTitle}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/[0.1] text-slate-700 dark:text-slate-300 uppercase">
                        {sub.status}
                      </span>
                    </div>
                    {sub.tagline && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {sub.tagline}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-200/50 dark:border-white/[0.06]">
                      {sub.projectLink && (
                        <a
                          href={formatExternalLink(sub.projectLink) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-[#0099e6] hover:underline"
                        >
                          <Github className="w-3 h-3" /> Repository
                        </a>
                      )}
                      {sub.demoVideoUrl && (
                        <a
                          href={formatExternalLink(sub.demoVideoUrl) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
            Verified Hacker&apos;s Unity Builder
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0099e6] transition-colors cursor-pointer"
          >
            Close (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}
