'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Wand2,
  Paperclip,
  X,
  ArrowRight,
  Trophy,
  Calendar,
  MapPin,
  Flame,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { usePublishedEvents } from '@/lib/hooks/use-events';
import { formatCurrency } from '@/lib/utils';
import { ExtendedEvent } from '@/lib/mock-data';
import { saveDraftEvent } from '@/lib/storage';
import { EventCategory, EventType } from '@hackers-unity/shared-types';

export function AiHeroPanel() {
  const router = useRouter();
  const { events } = usePublishedEvents();

  // Mode: 'find' (Find Hackathons) or 'build' (Auto-generate & Host)
  const [activeTab, setActiveTab] = useState<'find' | 'build'>('find');

  // --- FIND MODE STATE ---
  const [findQuery, setFindQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedEvents, setMatchedEvents] = useState<ExtendedEvent[]>([]);
  const [aiRationale, setAiRationale] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [findError, setFindError] = useState<string | null>(null);

  // --- BUILD MODE STATE ---
  const [buildPrompt, setBuildPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    content: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [buildStepMessage, setBuildStepMessage] = useState('');
  const [buildError, setBuildError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Find Tags
  const quickTags = [
    { label: '#Web3 & Crypto', query: 'Web3 and blockchain hackathons with crypto prizes' },
    { label: '#AI Agents', query: 'AI agents, LLMs, and machine learning hackathons' },
    { label: '#Bangalore / Offline', query: 'Offline in-person hackathons in Bangalore' },
    { label: '#Beginner Friendly', query: 'Beginner friendly hackathons open for college students' },
    { label: '#High Cash Prize', query: 'Hackathons with the biggest cash prize pools' },
  ];

  // Quick Build Presets
  const buildPresets = [
    {
      label: '🚀 36h Offline AI Hackathon',
      prompt:
        'Host "HackAI Bangalore 2026", a 36-hour offline hackathon in Koramangala, Bangalore. Focus on Autonomous AI Agents, Multimodal Apps, and Local LLMs. Total prize pool ₹2,50,000 with 1st prize ₹1,20,000. Team size 2-4 students. Free food, 24/7 internet, swags, and developer mentoring provided.',
    },
    {
      label: '🌐 Global Web3 Virtual Sprint',
      prompt:
        'Host "ZeroKnowledge Sprint", a 48-hour global virtual hackathon on DeFi, ZK-Proofs, and Decentralized Identity. $15,000 USD prize pool, completely online. Tracks include Account Abstraction, Privacy-first DeFi, and Cross-chain Bridges. Open for builders globally.',
    },
    {
      label: '🎓 University Innovation Cup',
      prompt:
        'Host "Apex Innovate 2026", a 24-hour inter-college hackathon organized at Tech Campus, Delhi NCR. Tracks: Smart Health, Green Energy & Sustainability, Cyber Defense. ₹1,00,000 prize pool, beginner friendly, teams of 2-4.',
    },
  ];

  // ==========================================
  // 1. FIND MODE: Submit Query to Groq
  // ==========================================
  const handleFindSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = (customQuery ?? findQuery).trim();
    if (!queryToUse) return;

    setIsSearching(true);
    setFindError(null);
    setHasSearched(true);

    try {
      // Call Groq AI API
      const res = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find',
          query: queryToUse,
          events: events.map((ev) => ({
            id: ev.id,
            slug: ev.slug,
            title: ev.title,
            description: ev.description,
            tags: ev.tags,
            mode: ev.mode || ev.eventType,
            location: ev.location,
            prize: ev.prize || (ev.totalPrizeValue ? formatCurrency(ev.totalPrizeValue) : ''),
          })),
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.matchedEventIds) && data.matchedEventIds.length > 0) {
        // Filter events by matched IDs
        const matched = events.filter((ev) =>
          data.matchedEventIds.includes(ev.id) || data.matchedEventIds.includes(ev.slug)
        );
        setMatchedEvents(matched.length > 0 ? matched : events.slice(0, 3));
        setAiRationale(data.rationale || 'Top recommended hackathons tailored to your query.');
      } else {
        // Fallback to local keyword search
        const lower = queryToUse.toLowerCase();
        const fallbackMatched = events.filter(
          (ev) =>
            ev.title.toLowerCase().includes(lower) ||
            ev.description.toLowerCase().includes(lower) ||
            ev.tags.some((t) => t.toLowerCase().includes(lower)) ||
            (ev.location && ev.location.toLowerCase().includes(lower))
        );
        setMatchedEvents(fallbackMatched.length > 0 ? fallbackMatched : events.slice(0, 3));
        setAiRationale(
          fallbackMatched.length > 0
            ? `Found ${fallbackMatched.length} matching events for "${queryToUse}".`
            : `Showing top featured hackathons matching your interests.`
        );
      }
    } catch (err: any) {
      console.error('Find with AI error:', err);
      // Fallback
      const lower = queryToUse.toLowerCase();
      const fallbackMatched = events.filter(
        (ev) =>
          ev.title.toLowerCase().includes(lower) ||
          ev.tags.some((t) => t.toLowerCase().includes(lower))
      );
      setMatchedEvents(fallbackMatched.length > 0 ? fallbackMatched : events.slice(0, 3));
      setAiRationale(`Showing hackathons matching "${queryToUse}".`);
    } finally {
      setIsSearching(false);
    }
  };

  // ==========================================
  // 2. BUILD MODE: File Upload & Reader
  // ==========================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = (file.size / 1024).toFixed(1) + ' KB';

    // If text / markdown / json / html, read text directly
    if (
      file.type.includes('text') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.csv')
    ) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setAttachedFile({
          name: file.name,
          size: sizeKb,
          content: text.slice(0, 15000), // safe boundary
        });
      };
      reader.readAsText(file);
    } else {
      // For PDF / doc / images, extract file metadata and read as text snippet if possible
      const reader = new FileReader();
      reader.onload = (event) => {
        const raw = (event.target?.result as string) || '';
        // Extract printable ASCII text chunks from binary/pdf stream if any
        const printableText = raw.replace(/[^\x20-\x7E\t\n\r]/g, ' ').slice(0, 10000);
        setAttachedFile({
          name: file.name,
          size: sizeKb,
          content: printableText.trim()
            ? `[Document: ${file.name} (${sizeKb})]\n\n${printableText}`
            : `[Attached Event Brochure: ${file.name}, File Size: ${sizeKb}]`,
        });
      };
      reader.readAsBinaryString(file);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ==========================================
  // 3. BUILD MODE: Generate & Host via Groq
  // ==========================================
  const handleBuildGenerate = async () => {
    if (!buildPrompt.trim() && !attachedFile) {
      setBuildError('Please enter hackathon details or upload a brochure/doc.');
      return;
    }

    setIsGenerating(true);
    setBuildError(null);
    setBuildStepMessage('Analyzing hackathon details & brochure...');

    try {
      setTimeout(() => {
        setBuildStepMessage('Architecting tracks, prize pools & judging criteria via Groq...');
      }, 900);

      const res = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'build',
          prompt: buildPrompt.trim(),
          sourceText: attachedFile?.content || '',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.event) {
        throw new Error(data.error || 'Failed to generate hackathon data');
      }

      setBuildStepMessage('Preparing Step 7: Review & Publish screen...');

      const aiEvent = data.event;
      const draftId = `evt_ai_${Date.now()}`;
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Create a fully qualified ExtendedEvent object
      const fullDraftEvent: ExtendedEvent = {
        id: draftId,
        slug: draftId,
        title: aiEvent.title || 'AI Generated Hackathon',
        name: aiEvent.title || 'AI Generated Hackathon',
        tagline: aiEvent.tagline || 'Built with Hacker\'s Unity AI Architect',
        organizerId: 'org_ai_host',
        organizerName: aiEvent.institutionName
          ? `${aiEvent.institutionName} • ${aiEvent.organizerLeadName || "Hacker's Unity"}`
          : aiEvent.organizerName || "Hacker's Unity Community",
        organizerAvatar: '⚡',
        organizerLogo: '',
        description: aiEvent.description || 'Complete hackathon guidelines and problem statements.',
        category: (aiEvent.category as EventCategory) || EventCategory.HACKATHON,
        eventType:
          aiEvent.eventType === 'OFFLINE'
            ? EventType.OFFLINE
            : aiEvent.eventType === 'HYBRID'
            ? EventType.HYBRID
            : EventType.ONLINE,
        mode: aiEvent.mode || (aiEvent.eventType === 'OFFLINE' ? 'In-Person' : 'Online'),
        location: aiEvent.location || 'Online / Discord',
        domain: (aiEvent.tags && aiEvent.tags.join(', ')) || 'AI, Web3, Fullstack',
        tags: Array.isArray(aiEvent.tags) && aiEvent.tags.length > 0 ? aiEvent.tags : ['AI', 'Innovation'],
        startDate: aiEvent.startDate ? `${aiEvent.startDate}T09:00:00Z` : nextMonth.toISOString(),
        endDate: aiEvent.endDate
          ? `${aiEvent.endDate}T18:00:00Z`
          : new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        registrationStart: aiEvent.registrationStart
          ? `${aiEvent.registrationStart}T00:00:00Z`
          : now.toISOString(),
        registrationDeadline: aiEvent.registrationDeadline
          ? `${aiEvent.registrationDeadline}T23:59:59Z`
          : new Date(nextMonth.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        prize: aiEvent.prize || '₹1,00,000',
        totalPrizeValue: Number(aiEvent.totalPrizeValue) || 100000,
        currency: aiEvent.currency || 'INR',
        participantsCount: 0,
        participantsDisplay: '0 Builders Registered',
        maxParticipants: 500,
        isTeamEvent: true,
        bannerUrl: '',
        rulesDocUrl: '',
        registrationLink: '',
        createdAt: now.toISOString(),
        bannerGradient: 'from-blue-600 via-indigo-600 to-sky-500',
        minTeamSize: Number(aiEvent.minTeamSize) || 1,
        maxTeamSize: Number(aiEvent.maxTeamSize) || 4,
        teamSize: `${Number(aiEvent.minTeamSize) || 1}-${Number(aiEvent.maxTeamSize) || 4} Members`,
        eligibilityRules: {
          teamSize: `${Number(aiEvent.minTeamSize) || 1}-${Number(aiEvent.maxTeamSize) || 4} Members`,
          eligibility: aiEvent.eligibility || 'Open to all developers and students worldwide',
        },
        eligibility: aiEvent.eligibility || 'Open to all developers and students worldwide',
        difficulty: aiEvent.difficulty || 'All Levels Welcome',
        rulesText: aiEvent.rulesText || aiEvent.rules || 'Standard hackathon code of conduct applies.',
        prizes: Array.isArray(aiEvent.prizes)
          ? aiEvent.prizes.map((p: any) => ({
              position: p.position || p.title || 'Winner',
              amount: typeof p.amount === 'number' ? p.amount : parseInt(String(p.amount).replace(/\D/g, '')) || 50000,
              description: p.description || '',
            }))
          : [
              { position: '1st Place', amount: 50000, description: 'Grand Prize' },
              { position: '2nd Place', amount: 30000, description: 'Runner Up' },
            ],
        tracks: Array.isArray(aiEvent.tracks)
          ? aiEvent.tracks.map((t: any) => ({
              title: t.title || 'Open Track',
              prize: t.prize || t.prizePool || '₹25,000',
              description: t.description || 'Build innovative solutions',
            }))
          : [{ title: 'Open Innovation', prize: '₹50,000', description: 'Any innovative software prototype' }],
        stages: [
          {
            id: 'stage_1',
            eventId: draftId,
            stageName: 'Registration Phase',
            stageOrder: 1,
            startDate: aiEvent.registrationStart || now.toISOString().split('T')[0],
            endDate: aiEvent.registrationDeadline || nextMonth.toISOString().split('T')[0],
            description: 'Team formation and registration confirmation.',
          },
          {
            id: 'stage_2',
            eventId: draftId,
            stageName: 'Hacking Sprint',
            stageOrder: 2,
            startDate: aiEvent.startDate || nextMonth.toISOString().split('T')[0],
            endDate: aiEvent.endDate || nextMonth.toISOString().split('T')[0],
            description: 'Intense sprint to build and ship the prototype.',
          },
        ],
        faqs: [
          {
            id: 'faq_1',
            eventId: draftId,
            question: 'Who can participate?',
            answer: 'Anyone with a passion for building! College students, self-taught devs, and professionals are welcome.',
            createdAt: now.toISOString(),
          },
          {
            id: 'faq_2',
            eventId: draftId,
            question: 'Is there any registration fee?',
            answer: 'No, participation is completely free.',
            createdAt: now.toISOString(),
          },
          {
            id: 'faq_3',
            eventId: draftId,
            question: 'What is the team size?',
            answer: `Teams can have between ${aiEvent.minTeamSize || 1} to ${aiEvent.maxTeamSize || 4} members.`,
            createdAt: now.toISOString(),
          },
        ],
        sponsors: [],
        status: 'DRAFT' as any,
      };

      // 1. Cache to sessionStorage for instant synchronous hydration on /host
      sessionStorage.setItem('hackers_unity_edit_event', JSON.stringify(fullDraftEvent));

      // 2. Persist to localStorage draft pool
      saveDraftEvent(fullDraftEvent);

      // 3. Smooth redirect directly to Step 7 (Review & Publish)
      router.push(`/host?edit=${draftId}&step=7`);
    } catch (err: any) {
      console.error('Error generating event with AI:', err);
      setBuildError(err.message || 'AI generation failed. Please try again or check your prompt.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full max-w-3xl mb-8 z-30">
      {/* Outer Card Container */}
      <div className="relative bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-2xl shadow-sky-500/10 p-4 sm:p-5 transition-all">
        {/* Top Header: Mode Switcher Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
            {/* Tab 1: Find Mode */}
            <button
              type="button"
              onClick={() => setActiveTab('find')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'find'
                  ? 'bg-white text-[#0099e6] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#0099e6]" />
              <span>1. Find Hackathons</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-sky-50 text-[#0099e6] text-[10px] font-bold border border-sky-200/60">
                AI Search
              </span>
            </button>

            {/* Tab 2: Build Mode */}
            <button
              type="button"
              onClick={() => setActiveTab('build')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'build'
                  ? 'bg-white text-[#ea580c] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>2. Build & Host</span>
              <span className="px-1.5 py-0.5 rounded-full bg-orange-50 text-[#ea580c] text-[10px] font-bold border border-orange-200/60 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Auto-Host</span>
              </span>
            </button>
          </div>

          {/* AI Badge Powered by Groq */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Groq AI Ultra-Fast</span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* TAB 1: FIND MODE (NATURAL LANGUAGE SEARCH)           */}
        {/* ==================================================== */}
        {activeTab === 'find' && (
          <div className="space-y-4">
            <form onSubmit={handleFindSubmit} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0099e6]" />
                <input
                  type="text"
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  placeholder='Ask AI: "Best AI agent hackathons in Bangalore", "#web3 bounties", "Beginner friendly"...'
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-[#0099e6] text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none font-medium transition-all shadow-inner focus:ring-4 focus:ring-[#0099e6]/10"
                />
                {findQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setFindQuery('');
                      setHasSearched(false);
                      setMatchedEvents([]);
                      setAiRationale('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching || !findQuery.trim()}
                className="px-5 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Matching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Find with AI</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Inspiration Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#ea580c]" /> Try:
              </span>
              {quickTags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => {
                    setFindQuery(tag.query);
                    handleFindSubmit(undefined, tag.query);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-100/80 hover:bg-sky-50 text-slate-600 hover:text-[#0099e6] border border-slate-200/80 hover:border-sky-300 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* AI Results Section */}
            {hasSearched && (
              <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                {aiRationale && (
                  <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200/70 text-xs font-semibold text-slate-800 flex items-start gap-2.5 mb-3">
                    <Sparkles className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold text-[#0099e6] mr-1">AI Recommendation:</span>
                      <span>{aiRationale}</span>
                    </div>
                  </div>
                )}

                {matchedEvents.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <p className="text-xs font-bold text-slate-700">No direct hackathons match this query.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try keywords like Web3, AI, Bangalore, or Online.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {matchedEvents.map((evt) => {
                      const prizeText =
                        evt.prize || (evt.totalPrizeValue ? formatCurrency(evt.totalPrizeValue) : 'Prizes');

                      return (
                        <Link
                          key={evt.id}
                          href={`/hackathons/${evt.slug}`}
                          className="p-3 rounded-2xl bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-[#0099e6]/50 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0099e6] to-[#0284c7] text-white flex items-center justify-center font-black text-sm shadow-2xs shrink-0 overflow-hidden">
                              {evt.image ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                              ) : (
                                <Trophy className="w-5 h-5" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-[#0099e6] transition-colors truncate">
                                  {evt.title}
                                </h4>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                  {evt.mode || 'Online'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                                <span className="text-[#ea580c] font-extrabold">{prizeText}</span>
                                <span>•</span>
                                <span>{evt.organizerName || "Hacker's Unity"}</span>
                                {evt.location && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      {evt.location}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold text-[#0099e6] shrink-0 group-hover:translate-x-0.5 transition-transform">
                            <span>View</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: BUILD MODE (AUTO-ARCHITECT & HOST TO REVIEW)   */}
        {/* ==================================================== */}
        {activeTab === 'build' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Describe Your Hackathon or Paste Brief:</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">AI auto-fills all 7 steps</span>
              </div>
              <textarea
                rows={3}
                value={buildPrompt}
                onChange={(e) => setBuildPrompt(e.target.value)}
                placeholder="e.g. Host a 36-hour offline AI & Web3 Hackathon in Bangalore. ₹2 Lakh prize pool, 3 tracks: DeFi, Agentic AI, and Cloud. Team size 2-4, free food, student friendly..."
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-[#ea580c] text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none font-medium transition-all shadow-inner focus:ring-4 focus:ring-[#ea580c]/10 resize-none"
              />
            </div>

            {/* Add Source / Brochure Upload Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="brochure-upload"
                  accept=".pdf,.doc,.docx,.txt,.md,.json,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-[#ea580c] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Paperclip className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Add Source / Brochure</span>
                </button>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Upload PDF, Doc, or Text guidelines for AI to read
                </span>
              </div>

              {/* Attached file indicator */}
              {attachedFile && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-50 border border-orange-200 text-xs text-[#ea580c] font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="max-w-[140px] sm:max-w-[200px] truncate">{attachedFile.name}</span>
                  <span className="text-[10px] text-orange-400">({attachedFile.size})</span>
                  <button
                    type="button"
                    onClick={removeAttachedFile}
                    className="p-0.5 hover:bg-orange-100 rounded text-orange-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Presets / Templates */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#0099e6]" /> Quick Ideas:
              </span>
              {buildPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setBuildPrompt(preset.prompt)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100/80 hover:bg-orange-50 text-slate-600 hover:text-[#ea580c] border border-slate-200/80 hover:border-orange-300 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {buildError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{buildError}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleBuildGenerate}
                disabled={isGenerating || (!buildPrompt.trim() && !attachedFile)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#0099e6] hover:opacity-95 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{buildStepMessage || 'Generating Hackathon with AI...'}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Hackathon & Open Review (Step 7)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center font-medium mt-2">
                ⚡ AI generates full tracks, prizes, dates & markdown description, then opens Step 7 Review directly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
