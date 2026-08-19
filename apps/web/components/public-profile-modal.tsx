'use client';

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  GraduationCap,
  Briefcase,
  Code2,
  Trophy,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  Copy,
  Share2,
  Eye,
  Building,
  Mail,
  MapPin,
  Calendar,
  Layers,
  Terminal,
  ShieldCheck,
  Check,
  Flame,
} from 'lucide-react';
import { UserPublic } from '@hackers-unity/shared-types';

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserPublic | null;
  livePreviewData?: {
    name?: string;
    bio?: string;
    avatarUrl?: string | null;
    professionType?: 'STUDENT' | 'PROFESSIONAL' | 'FREELANCER';
    college?: string;
    graduationYear?: string | number;
    degree?: string;
    branch?: string;
    company?: string;
    jobTitle?: string;
    experienceYears?: string;
    industry?: string;
    freelanceTitle?: string;
    freelanceLevel?: string;
    freelanceDomain?: string;
    skills?: string[];
    socialLinks?: {
      github?: string;
      linkedin?: string;
      portfolio?: string;
    };
  };
}

export function PublicProfileModal({
  isOpen,
  onClose,
  user,
  livePreviewData,
}: PublicProfileModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Merge live preview data with stored user data
  const name = livePreviewData?.name || user?.name || 'Hacker Builder';
  const bio = livePreviewData?.bio !== undefined ? livePreviewData.bio : user?.bio || '';
  const avatarUrl = livePreviewData?.avatarUrl !== undefined ? livePreviewData.avatarUrl : user?.avatarUrl;
  const professionType = livePreviewData?.professionType || user?.professionType || (user?.college ? 'STUDENT' : 'STUDENT');
  
  const college = livePreviewData?.college || user?.college || 'Developer Guild';
  const graduationYear = livePreviewData?.graduationYear || user?.graduationYear || '2026';
  const degree = livePreviewData?.degree || user?.degree || 'B.Tech / B.E (Engineering)';
  const branch = livePreviewData?.branch || user?.branch || 'Computer Science & Engineering (CSE)';
  
  const company = livePreviewData?.company || user?.company || user?.organization || 'Tech Startup';
  const jobTitle = livePreviewData?.jobTitle || user?.jobTitle || 'Software Engineer';
  const experienceYears = livePreviewData?.experienceYears || user?.experienceYears || '1-3 years';
  const industry = livePreviewData?.industry || user?.industry || 'AI/ML, GenAI & Autonomous Systems';

  const freelanceTitle = livePreviewData?.freelanceTitle || 'Full Stack AI Builder';
  const freelanceLevel = livePreviewData?.freelanceLevel || 'Intermediate Builder';
  const freelanceDomain = livePreviewData?.freelanceDomain || 'Fullstack Web & AI';

  const skills = livePreviewData?.skills || user?.skills || ['Next.js 16', 'TypeScript', 'PostgreSQL', 'Python'];
  const github = livePreviewData?.socialLinks?.github || user?.socialLinks?.github;
  const linkedin = livePreviewData?.socialLinks?.linkedin || user?.socialLinks?.linkedin;
  const portfolio = livePreviewData?.socialLinks?.portfolio || user?.socialLinks?.portfolio;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/leaderboard`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      {/* Scoped CSS to ensure preview bio markdown / HTML renders beautifully */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .public-bio-content ul {
              list-style-type: disc !important;
              padding-left: 1.5rem !important;
              margin: 0.5rem 0 !important;
            }
            .public-bio-content ol {
              list-style-type: decimal !important;
              padding-left: 1.5rem !important;
              margin: 0.5rem 0 !important;
            }
            .public-bio-content li {
              display: list-item !important;
              margin: 0.25rem 0 !important;
            }
            .public-bio-content h1,
            .public-bio-content h2 {
              font-size: 1.15rem !important;
              font-weight: 800 !important;
              color: #0f172a !important;
              margin: 0.5rem 0 0.25rem 0 !important;
            }
            .public-bio-content h3 {
              font-size: 1rem !important;
              font-weight: 700 !important;
              color: #1e293b !important;
              margin: 0.4rem 0 0.2rem 0 !important;
            }
            .public-bio-content blockquote {
              border-left: 4px solid #0099e6 !important;
              padding: 0.4rem 0.85rem !important;
              margin: 0.5rem 0 !important;
              font-style: italic !important;
              background-color: rgba(0, 153, 230, 0.08) !important;
              border-radius: 0 0.5rem 0.5rem 0 !important;
              color: #334155 !important;
            }
            .public-bio-content a {
              color: #0099e6 !important;
              text-decoration: underline !important;
              font-weight: 600 !important;
            }
            .public-bio-content b,
            .public-bio-content strong {
              font-weight: 800 !important;
            }
            .public-bio-content i,
            .public-bio-content em {
              font-style: italic !important;
            }
            .public-bio-content u {
              text-decoration: underline !important;
            }
          `,
        }}
      />

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Top "How Others See You" Alert Bar */}
        <div className="bg-slate-900 px-5 py-2.5 text-white flex items-center justify-between text-xs font-semibold border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-200">Public Builder Profile</span>
            <span className="hidden sm:inline text-slate-400">• Visible to Organizers, Judges & Squadmates</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Content */}
        <div className="max-h-[82vh] overflow-y-auto">
          {/* Header Cover Banner */}
          <div className="h-36 bg-gradient-to-r from-slate-950 via-sky-950 to-indigo-950 relative flex items-start justify-between p-4 overflow-hidden">
            {/* Cyber Grid Texture */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#0099e6_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#0099e6]/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Verified Builder Matrix</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="relative z-10 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Profile Link Copied!' : 'Share Profile'}</span>
            </button>
          </div>

          <div className="px-6 sm:px-8 pb-8 -mt-14 space-y-6">
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-2xl ring-4 ring-white overflow-hidden">
                    {avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http')) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-[#0099e6] to-sky-400 flex items-center justify-center text-3xl font-black text-white shadow-inner">
                        {avatarUrl || (name ? name.charAt(0).toUpperCase() : '⚡')}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center" title="Active on Hacker's Unity">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{name}</h2>
                    <span className="p-0.5 rounded-full bg-sky-100 text-[#0099e6]" title="Verified Builder Identity">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Dynamic Subtitle Badge based on Occupation */}
                  {professionType === 'STUDENT' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0099e6]">
                      <GraduationCap className="w-4 h-4" />
                      <span>{degree.split('(')[0]} • {branch.split('(')[0]}</span>
                    </div>
                  )}

                  {professionType === 'PROFESSIONAL' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0099e6]">
                      <Briefcase className="w-4 h-4" />
                      <span>{jobTitle} {company ? `@ ${company}` : ''}</span>
                    </div>
                  )}

                  {professionType === 'FREELANCER' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0099e6]">
                      <Code2 className="w-4 h-4" />
                      <span>{freelanceTitle}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5 shadow-2xs">
                  <Flame className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Open for Hackathons</span>
                </span>
              </div>
            </div>

            {/* Bento Grid 1: Academic & Professional Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs">
              {professionType === 'STUDENT' && (
                <>
                  <div className="space-y-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Building className="w-3 h-3 text-[#0099e6]" />
                      <span>University / College</span>
                    </span>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {college}
                    </div>
                  </div>
                  <div className="space-y-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#0099e6]" />
                      <span>Passout Class</span>
                    </span>
                    <div className="text-xs font-extrabold text-slate-900">
                      Class of {graduationYear}
                    </div>
                  </div>
                  <div className="space-y-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#0099e6]" />
                      <span>Branch / Stream</span>
                    </span>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {branch}
                    </div>
                  </div>
                </>
              )}

              {professionType === 'PROFESSIONAL' && (
                <>
                  <div className="space-y-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Building className="w-3 h-3 text-[#0099e6]" />
                      <span>Company / Org</span>
                    </span>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {company}
                    </div>
                  </div>
                  <div className="space-y-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#0099e6]" />
                      <span>Total Experience</span>
                    </span>
                    <div className="text-xs font-extrabold text-slate-900">
                      {experienceYears}
                    </div>
                  </div>
                  <div className="space-y-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#0099e6]" />
                      <span>Industry Sector</span>
                    </span>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {industry}
                    </div>
                  </div>
                </>
              )}

              {professionType === 'FREELANCER' && (
                <>
                  <div className="space-y-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Code2 className="w-3 h-3 text-[#0099e6]" />
                      <span>Builder Track</span>
                    </span>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      Independent Hacker
                    </div>
                  </div>
                  <div className="space-y-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#0099e6]" />
                      <span>Experience Tier</span>
                    </span>
                    <div className="text-xs font-extrabold text-slate-900">
                      {freelanceLevel}
                    </div>
                  </div>
                  <div className="space-y-1 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#0099e6]" />
                      <span>Specialty Niche</span>
                    </span>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {freelanceDomain}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bento Grid 2: About & Specialties Section */}
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>About & Specialties</span>
              </h3>
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans shadow-2xs">
                {bio ? (
                  <div
                    className="public-bio-content"
                    dangerouslySetInnerHTML={{
                      __html: bio.startsWith('<') ? bio : bio.replace(/\n/g, '<br>'),
                    }}
                  />
                ) : (
                  <p className="text-slate-400 italic">No bio provided yet.</p>
                )}
              </div>
            </div>

            {/* Bento Grid 3: Skills & Tech Stacks */}
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Skills & Tech Stacks</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-sky-50 to-sky-100/60 text-[#0099e6] border border-sky-200 text-xs font-bold shadow-2xs hover:scale-105 transition-transform"
                  >
                    #{skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bento Grid 4: Verified Social & Portfolio Links */}
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Verified Socials & Profiles</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {github ? (
                  <a
                    href={github.startsWith('http') ? github : `https://${github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-between transition-all group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Github className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      <span>GitHub Profile</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </a>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 text-xs font-medium flex items-center gap-2 border border-slate-200/60">
                    <Github className="w-4 h-4 opacity-40" />
                    <span>GitHub Not linked</span>
                  </div>
                )}

                {linkedin ? (
                  <a
                    href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-bold flex items-center justify-between transition-all group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Linkedin className="w-4 h-4 text-sky-200 group-hover:text-white" />
                      <span>LinkedIn Profile</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-200 group-hover:text-white" />
                  </a>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 text-xs font-medium flex items-center gap-2 border border-slate-200/60">
                    <Linkedin className="w-4 h-4 opacity-40" />
                    <span>LinkedIn Not linked</span>
                  </div>
                )}

                {portfolio ? (
                  <a
                    href={portfolio.startsWith('http') ? portfolio : `https://${portfolio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0099e6] to-sky-500 hover:opacity-95 text-white text-xs font-bold flex items-center justify-between transition-all group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-sky-100 group-hover:text-white" />
                      <span>Portfolio Website</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-100 group-hover:text-white" />
                  </a>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 text-xs font-medium flex items-center gap-2 border border-slate-200/60">
                    <Globe className="w-4 h-4 opacity-40" />
                    <span>Portfolio Not linked</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bento Grid 5: Hacker Proof of Work Stats */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 text-center shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hackathons</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">4</div>
                <div className="text-[9px] text-slate-500 font-medium">Participated</div>
              </div>
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 text-center shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Squads</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">3</div>
                <div className="text-[9px] text-slate-500 font-medium">Created / Joined</div>
              </div>
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 text-center shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Podiums</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">2</div>
                <div className="text-[9px] text-slate-500 font-medium">Top 3 Track Wins</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <span>🔒 Confidential account credentials (email, phone, password) are protected.</span>
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-colors cursor-pointer shadow-sm"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
