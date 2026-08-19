'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Trophy,
  Users,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { HackathonCard } from '@/components/hackathon-card';
import { usePublishedEvents } from '@/lib/hooks/use-events';
import { MOCK_HACKERS } from '@/lib/mock-data';
import { AuthModal } from '@/components/auth-modal';

export default function HomePage() {
  const { events, loading } = usePublishedEvents();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authOpen, setAuthOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const filteredEvents = events.filter((evt) => {
    const matchesQuery =
      !searchQuery ||
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesQuery;
  });

  const displayedEvents = showAll ? filteredEvents : filteredEvents.slice(0, 6);

  return (
    <div className="flex flex-col flex-1">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 bg-grid-pattern">
        {/* Soft Ambient Brand Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold mb-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0099e6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0099e6]" />
            </span>
            <span className="font-mono uppercase tracking-wider text-xs">
              <strong className="text-[#0099e6]">85+ LIVE HACKATHONS</strong> • <strong className="text-[#ea580c]">$1.85M PRIZE POOLS</strong>
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight max-w-5xl leading-[1.1] mb-6">
            Where Builders Assemble &{' '}
            <span className="text-gradient-brand">Groundbreaking Software</span> Gets Shipped.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mb-8 font-medium">
            Discover premier hackathons across AI Agents, Web3, and DeepTech. Match with world-class teammates, build high-impact prototypes, and win verified payouts on Hacker&apos;s Unity.
          </p>

          {/* Quick Search Bar */}
          <div className="w-full max-w-2xl bg-white p-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-[#0099e6] ml-3" />
            <input
              type="text"
              placeholder="Search by tech stack (Python, ZK, PyTorch), track or event name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none px-2 py-1.5 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-700 px-2 cursor-pointer font-semibold"
              >
                Clear
              </button>
            )}
            <Link
              href="/hackathons"
              className="px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-sm shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>



          {/* Metrics Ticker */}
          <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center min-h-[104px] hover:shadow-md hover:border-slate-300 transition-all">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono whitespace-nowrap">10+</div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold whitespace-nowrap">Hackathons Hosted</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center min-h-[104px] hover:shadow-md hover:border-slate-300 transition-all">
              <div className="text-2xl sm:text-3xl font-black text-[#ea580c] font-mono whitespace-nowrap">30+</div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold whitespace-nowrap">Events Conducted</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center min-h-[104px] hover:shadow-md hover:border-slate-300 transition-all">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0099e6] font-mono whitespace-nowrap">5M+</div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold whitespace-nowrap">Impressions</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center min-h-[104px] hover:shadow-md hover:border-slate-300 transition-all">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 font-mono whitespace-nowrap">50,000+</div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold whitespace-nowrap">Community Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Partners Marquee ─────────────────────────────────────── */}
      <section className="py-10 border-b border-slate-200/80 bg-white overflow-hidden">
        <div className="text-center mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Trusted by builders from leading organizations worldwide
          </p>
        </div>

        {/* Marquee wrapper — CSS animation scrolls right-to-left */}
        <div className="relative w-full overflow-hidden">
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee whitespace-nowrap gap-16 items-center">
            {/* First set */}
            {[
              { name: 'OpenAI', style: 'font-extrabold text-2xl tracking-tighter' },
              { name: 'Trainzex AI', href: 'https://trainzexai.in', style: 'font-extrabold text-2xl tracking-tight text-slate-700 hover:text-[#0099e6]' },
              { name: 'Google', style: 'font-bold text-2xl tracking-tight' },
              { name: 'NextEase Solution', href: 'https://www.linkedin.com/company/nextease-solution/?originalSubdomain=in', style: 'font-bold text-2xl tracking-tight text-slate-700 hover:text-[#0099e6]' },
              { name: 'Microsoft', style: 'font-semibold text-2xl tracking-tight' },
              { name: 'amazon', style: 'font-extrabold text-2xl lowercase tracking-tight' },
              { name: 'n8n', style: 'font-black text-3xl lowercase tracking-tighter' },
              { name: 'ElevenLabs', style: 'font-bold text-2xl tracking-tight' },
              { name: 'ORACLE', style: 'font-black text-2xl tracking-widest font-mono' },
              { name: 'Meta', style: 'font-extrabold text-2xl tracking-tight' },
              { name: 'GitHub', style: 'font-bold text-2xl tracking-tight' },
              { name: '▲ Vercel', style: 'font-extrabold text-2xl tracking-tight' },
            ].map((partner) => (
              partner.href ? (
                <a
                  key={partner.name}
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.name}</span>
                </a>
              ) : (
                <div
                  key={partner.name}
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.name}</span>
                </div>
              )
            ))}

            {/* Duplicate set for seamless continuous loop */}
            {[
              { name: 'OpenAI-2', label: 'OpenAI', style: 'font-extrabold text-2xl tracking-tighter' },
              { name: 'Trainzex-2', label: 'Trainzex AI', href: 'https://trainzexai.in', style: 'font-extrabold text-2xl tracking-tight text-slate-700 hover:text-[#0099e6]' },
              { name: 'Google-2', label: 'Google', style: 'font-bold text-2xl tracking-tight' },
              { name: 'NextEase-2', label: 'NextEase Solution', href: 'https://www.linkedin.com/company/nextease-solution/?originalSubdomain=in', style: 'font-bold text-2xl tracking-tight text-slate-700 hover:text-[#0099e6]' },
              { name: 'Microsoft-2', label: 'Microsoft', style: 'font-semibold text-2xl tracking-tight' },
              { name: 'amazon-2', label: 'amazon', style: 'font-extrabold text-2xl lowercase tracking-tight' },
              { name: 'n8n-2', label: 'n8n', style: 'font-black text-3xl lowercase tracking-tighter' },
              { name: 'ElevenLabs-2', label: 'ElevenLabs', style: 'font-bold text-2xl tracking-tight' },
              { name: 'ORACLE-2', label: 'ORACLE', style: 'font-black text-2xl tracking-widest font-mono' },
              { name: 'Meta-2', label: 'Meta', style: 'font-extrabold text-2xl tracking-tight' },
              { name: 'GitHub-2', label: 'GitHub', style: 'font-bold text-2xl tracking-tight' },
              { name: '▲ Vercel-2', label: '▲ Vercel', style: 'font-extrabold text-2xl tracking-tight' },
            ].map((partner) => (
              partner.href ? (
                <a
                  key={partner.name}
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.label}</span>
                </a>
              ) : (
                <div
                  key={partner.name}
                  className="shrink-0 flex items-center text-slate-400 hover:text-slate-900 transition-colors px-3 cursor-pointer"
                >
                  <span className={partner.style}>{partner.label}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured & Trending Hackathons ──────────────────────── */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-[#f97316]" />
              <span>Flagship Arenas</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Featured & Trending Hackathons
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Top prize pools, venture-backed sponsors, and global recognition.
            </p>
          </div>

          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0099e6] hover:text-[#0284c7] hover:underline"
          >
            <span>View All Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Hackathon Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((event) => (
            <HackathonCard
              key={event.id}
              event={event}
            />
          ))}
        </div>

        {/* Show More / Show Less Toggle Button */}
        {filteredEvents.length > 6 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs border border-slate-200 shadow-xs hover:border-[#0099e6]/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{showAll ? 'Show Less' : `Show More (${filteredEvents.length - 6} more)`}</span>
              <ChevronDown className={`w-4 h-4 text-[#0099e6] transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </button>

            <Link
              href="/hackathons"
              className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center gap-2"
            >
              <span>Explore All {filteredEvents.length}+ Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {filteredEvents.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Trophy className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No hackathons found matching your criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try searching for other keywords or reset your filters.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* ─── Teammate Matchmaker Spotlight ────────────────────────── */}
      <section className="py-16 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0099e6] text-xs font-bold uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Squad Formation</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Find Your Hackathon Dream Team
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Connect with verified engineers, AI researchers, and UI/UX designers ready to team up.
              </p>
            </div>

            <Link
              href="/teammates"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#0099e6] text-xs font-bold shadow-2xs hover:border-[#0099e6]/30 transition-all"
            >
              <span>Explore Hacker Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_HACKERS.slice(0, 3).map((hacker) => (
              <div
                key={hacker.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#0099e6]/30 flex flex-col justify-between space-y-4 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 overflow-hidden flex items-center justify-center font-black text-lg text-[#0099e6]">
                        {hacker.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{hacker.name}</h4>
                        <p className="text-xs text-[#0099e6] font-semibold">{hacker.title}</p>
                        <p className="text-[11px] text-slate-500">{hacker.college || hacker.organization}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Available
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed font-medium">
                    {hacker.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {hacker.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-medium text-slate-700 border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-900">{hacker.hackathonsWon}</span> Wins •{' '}
                    <span className="font-mono text-[#0099e6] font-bold">{hacker.rating} Elo</span>
                  </div>
                  <Link
                    href="/teammates"
                    className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ea580c] border border-orange-200 text-xs font-bold transition-colors"
                  >
                    Invite to Squad
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Hacker's Unity Matrix ─────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>The Builder Standard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Why Hackers & Organizers Choose Hacker&apos;s Unity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
            Engineered from the ground up for maximum fairness, transparency, and developer speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0099e6]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">100% Escrow Protected Payouts</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Never worry about ghosting sponsors or delayed rewards. All listed hackathon prize pools are verified and deposited in escrow prior to launch.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Smart Matchmaking & Squads</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Our intelligent teammate engine pairs complementary skills (e.g. AI Engineer + Rust Core + UI/UX Pro) to create winning hackathon squads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Venture Fast-Track & Incubation</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Top finalists receive direct introductions to leading global accelerators, VC angel rounds, and free GPU cluster infrastructure credits.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Host Hackathon CTA ───────────────────────────────────── */}
      <section className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0099e6] via-[#0284c7] to-[#f97316] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-md">
              ORGANIZER SUITE
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Hosting a Hackathon or Developer Sprint?
            </h3>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed font-medium">
              Launch registration in under 5 minutes. Get access to our 50,000+ builder network, automated submission review sandboxes, and verified judge scorecards.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/host"
              className="px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs text-center shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              Host Hackathon Free
            </Link>
            <Link
              href="/hackathons"
              className="px-6 py-3 rounded-xl bg-black/20 text-white text-xs font-bold text-center hover:bg-black/30 border border-white/20 transition-colors whitespace-nowrap"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </section>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
