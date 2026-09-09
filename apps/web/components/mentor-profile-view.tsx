'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Briefcase,
  Calendar,
  Building2,
  Sparkles,
  Cpu,
  Code2,
  Database,
  Users,
  Target,
  Share2,
  Copy,
  Check,
  FileCheck,
  Rocket,
  Layers,
  Quote,
  Flame,
} from 'lucide-react';
import { VerifiedMentor } from '@/lib/mentors-data';

interface MentorProfileViewProps {
  mentor: VerifiedMentor;
}

export function MentorProfileView({ mentor }: MentorProfileViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'expertise' | 'jury' | 'tech'>('overview');

  const shareUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `https://www.hackersunity.com/mentor/${mentor.slug}`;

  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${mentor.name} – Verified Mentor | Hacker's Unity`,
          text: `Check out ${mentor.name}'s verified mentor profile on Hacker's Unity!`,
          url: shareUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-[#0099e6]" />;
      case 'Code2':
        return <Code2 className="w-5 h-5 text-[#0099e6]" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-[#f97316]" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-[#0099e6]" />;
      case 'Database':
        return <Database className="w-5 h-5 text-[#0099e6]" />;
      case 'Users':
        return <Users className="w-5 h-5 text-[#0099e6]" />;
      case 'Target':
        return <Target className="w-5 h-5 text-[#f97316]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#0099e6]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-[#0099e6]/20 selection:text-[#0099e6] relative overflow-hidden pb-20">
      {/* Background Decorative Gradients & Subtle Mesh */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-sky-100/60 via-slate-100/40 to-transparent pointer-events-none -z-10" />
      <div className="absolute -top-40 right-1/4 w-96 h-96 bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-60 left-10 w-80 h-80 bg-[#f97316]/8 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Official Verification Notice Bar */}
      <div className="border-b border-sky-100 bg-white/70 backdrop-blur-md sticky top-16 z-30 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Officially Verified Mentor
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-slate-500 font-mono text-xs">
              ID: {mentor.verificationId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-sky-50 hover:text-[#0099e6] text-slate-700 transition-colors border border-slate-200 cursor-pointer"
              title="Copy verified page link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#0099e6] to-[#0284c7] text-white shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        {/* Main Hero Verification Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-10 relative overflow-hidden">
          {/* Subtle Corner Badge watermark */}
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-gradient-to-br from-sky-100/50 to-orange-100/30 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12 relative z-10">
            {/* Mentor Photo Container */}
            <div className="relative shrink-0">
              <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden p-1.5 bg-gradient-to-tr from-[#0099e6] via-sky-300 to-[#f97316] shadow-xl shadow-[#0099e6]/10">
                <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-slate-100">
                  <Image
                    src={mentor.avatarUrl}
                    alt={mentor.name}
                    fill
                    priority
                    sizes="(max-width: 640px) 160px, 208px"
                    className="object-cover object-top"
                  />
                </div>
              </div>

              {/* Verified Ribbon / Seal */}
              <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white text-xs font-semibold px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-white">
                  <ShieldCheck className="w-4 h-4 fill-white text-emerald-600" />
                  <span>Verified Mentor</span>
                </div>
              </div>
            </div>

            {/* Mentor Primary Info */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#0099e6] border border-sky-200">
                  <Award className="w-3.5 h-3.5" />
                  Hacker&apos;s Unity Official Partner
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Verified: {mentor.verificationYear}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  {mentor.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-2 text-slate-600 font-medium text-sm sm:text-base">
                  <span className="flex items-center gap-1.5 text-slate-900 font-semibold">
                    <Briefcase className="w-4 h-4 text-[#0099e6]" />
                    {mentor.currentRole}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {mentor.company}
                  </span>
                </div>
              </div>

              {/* Sub-headline / Tags */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
                {mentor.headline}
              </p>

              {/* Domains Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                {mentor.domains.map((domain, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0099e6]">
                {mentor.experienceYears}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
                Years Experience
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Software Engineering</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#f97316]">
                {mentor.juryEventsCount}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
                Hackathon Jury Roles
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">National & University</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                .NET & AI
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
                Core Specialization
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Enterprise Architecture</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 flex items-center justify-center gap-1">
                100%
              </div>
              <div className="text-xs sm:text-sm font-medium text-emerald-800 mt-1">
                Verified Profile
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Hacker&apos;s Unity Endorsed</div>
            </div>
          </div>
        </div>

        {/* Motivational Philosophy Quote Card */}
        <div className="mt-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0099e6]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white/10 text-sky-400 shrink-0">
                <Quote className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base sm:text-lg italic font-normal text-slate-200 leading-relaxed">
                  &ldquo;{mentor.quote}&rdquo;
                </p>
                <div className="mt-2 text-xs sm:text-sm font-semibold text-sky-400 flex items-center gap-1.5">
                  <span>— {mentor.name}</span>
                  <span className="text-slate-400">({mentor.currentRole}, {mentor.company})</span>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <a
                href="#verification-certificate"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium transition-colors border border-white/15"
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>View Certificate Seal</span>
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-10 flex items-center justify-start sm:justify-center border-b border-slate-200 overflow-x-auto no-scrollbar gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 sm:px-6 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#0099e6] text-[#0099e6]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview & Leadership
          </button>
          <button
            onClick={() => setActiveTab('expertise')}
            className={`px-4 sm:px-6 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'expertise'
                ? 'border-[#0099e6] text-[#0099e6]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Areas of Expertise ({mentor.expertiseList.length})
          </button>
          <button
            onClick={() => setActiveTab('jury')}
            className={`px-4 sm:px-6 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'jury'
                ? 'border-[#0099e6] text-[#0099e6]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Hackathon Jury & Mentorship
          </button>
          <button
            onClick={() => setActiveTab('tech')}
            className={`px-4 sm:px-6 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'tech'
                ? 'border-[#0099e6] text-[#0099e6]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Tech Stack & Capabilities
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="mt-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* About paragraphs */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#0099e6]" />
                    Professional Background & Impact
                  </h3>
                  {mentor.aboutParagraphs.map((para, i) => (
                    <p key={i} className="text-slate-600 text-sm sm:text-base leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Current Role Responsibilities */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#f97316]" />
                    Current Responsibilities at Metacube Software
                  </h3>
                  <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 text-slate-700 text-sm sm:text-base leading-relaxed">
                    {mentor.currentResponsibilities}
                  </div>
                </div>

                {/* Core Strengths */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Key Competencies & Leadership Highlights
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {mentor.coreStrengths.map((strength, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                          ✓
                        </span>
                        <span className="text-slate-700 text-sm sm:text-base font-medium">
                          {strength}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Innovation Horizon */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-[#0099e6]" />
                    Currently Exploring & Building
                  </h3>
                  <div className="space-y-2.5">
                    {mentor.exploringAndBuilding.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-sky-50/70 to-transparent border border-sky-100/80 text-xs sm:text-sm font-medium text-slate-800"
                      >
                        <Sparkles className="w-4 h-4 text-[#0099e6] shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Card in Sidebar */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 border border-slate-700 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-sky-400">
                      Official Validation
                    </span>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">Hacker&apos;s Unity Network</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      This profile has been independently verified by Hacker&apos;s Unity management as an official mentor &amp; technical jury partner.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-700/80 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Status:</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Active & Verified
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Verification ID:</span>
                      <span className="font-mono text-slate-100">{mentor.verificationId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPERTISE */}
          {activeTab === 'expertise' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentor.expertiseList.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
                      {renderIcon(item.iconName)}
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Domain Mastery</span>
                    <span className="text-[#0099e6] font-semibold">Verified Skill</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: HACKATHON JURY & MENTORSHIP */}
          {activeTab === 'jury' && (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                <div className="max-w-3xl space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#f97316] border border-orange-200">
                    <Flame className="w-3.5 h-3.5" />
                    Community Leadership & Judging
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Hackathon Jury & Innovation Evaluation
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    Tapendra Singh Ranawat actively supports the national technology and startup ecosystem by mentoring engineering students, evaluating innovative MVPs, and serving as a distinguished jury member.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                  {mentor.juryEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                            Hackathon
                          </span>
                          <Award className="w-4 h-4 text-[#0099e6]" />
                        </div>
                        <h4 className="font-bold text-base text-slate-900 pt-1">
                          {event.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {event.role}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Official Reviewer</span>
                        <span className="text-emerald-600 font-semibold">Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECH STACK & CAPABILITIES */}
          {activeTab === 'tech' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mentor.techStack.map((group, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4"
                  >
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-[#0099e6]" />
                      {group.category}
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {group.items.map((tech, i) => (
                        <span
                          key={i}
                          className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-50 hover:bg-sky-50 hover:text-[#0099e6] hover:border-sky-300 transition-colors text-slate-700 border border-slate-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Technologies summary note from profile */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-3">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#f97316]" />
                  Engineering Arsenal & Delivery Focus
                </h4>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Extensive expertise in designing and delivering enterprise solutions using ASP.NET Core, ASP.NET MVC, C#, CSLA, DevExpress, JavaScript, jQuery, REST APIs, SQL Server, coupled with robust agile project delivery and proactive production performance tuning.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Official Digital Certificate Seal Section */}
        <div id="verification-certificate" className="mt-16 scroll-mt-24">
          <div className="bg-white rounded-3xl border-2 border-dashed border-sky-300 p-8 sm:p-12 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-sky-100/50 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                  Hacker&apos;s Unity Official Certificate of Verification
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Official Verification Record
                </h3>
                <p className="text-sm text-slate-600 max-w-xl">
                  This document confirms that <strong>{mentor.name}</strong> ({mentor.currentRole}, {mentor.company}) is an officially verified mentor and innovation jury partner associated with the Hacker&apos;s Unity ecosystem.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-slate-500 pt-2">
                  <div>
                    <span className="text-slate-400">Credential ID:</span> {mentor.verificationId}
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div>
                    <span className="text-slate-400">Issuer:</span> Hacker&apos;s Unity Council
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div>
                    <span className="text-slate-400">Verification URL:</span> /mentor/{mentor.slug}
                  </div>
                </div>
              </div>

              {/* Digital Hologram / Badge Display */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full border-4 border-[#0099e6] bg-gradient-to-tr from-sky-50 via-white to-orange-50 flex flex-col items-center justify-center p-3 text-center shadow-lg relative">
                  <div className="absolute inset-0 rounded-full border border-dashed border-sky-400 animate-spin-slow pointer-events-none" />
                  <ShieldCheck className="w-8 h-8 text-[#0099e6]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 mt-1">
                    Hacker&apos;s Unity
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600">
                    VERIFIED 2025
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 font-medium">Digital Verification Stamp</span>
              </div>
            </div>

            {/* Action Buttons in Certificate */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Direct verification url: <code className="bg-slate-100 px-2 py-1 rounded text-slate-700">https://www.hackersunity.com/mentor/{mentor.slug}</code>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Verification Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
