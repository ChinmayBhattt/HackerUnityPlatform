'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  Trophy,
  Sparkles,
  Calendar,
  Rocket,
  Eye,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { EventCategory, EventStatus, EventType } from '@hackers-unity/shared-types';
import { ExtendedEvent } from '@/lib/mock-data';
import { saveHostedEvent } from '@/lib/storage';
import { HackathonCard } from '@/components/hackathon-card';

export default function HostHackathonPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>(EventCategory.HACKATHON);
  const [eventType, setEventType] = useState<EventType>(EventType.ONLINE);
  const [location, setLocation] = useState('Online / Discord');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-09-30');
  const [prize1, setPrize1] = useState(25000);
  const [prize2, setPrize2] = useState(10000);
  const [prize3, setPrize3] = useState(5000);
  const [tagsInput, setTagsInput] = useState('GenAI, Next.js, Cloud');
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [organizerName, setOrganizerName] = useState("Innovators Guild");

  const slug = title
    ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : 'my-custom-hackathon-2026';

  const totalPrize = Number(prize1) + Number(prize2) + Number(prize3);

  const previewEvent: ExtendedEvent = {
    id: `evt_custom_${Date.now()}`,
    organizerId: 'usr_me',
    organizerName: organizerName || 'Innovators Guild',
    organizerAvatar: '⚡',
    title: title || 'Untitled Hackathon',
    slug: slug,
    description:
      description ||
      'Join this hackathon to innovate, build real-world solutions, and compete for prizes.',
    category: category,
    eventType: eventType,
    startDate: `${startDate}T00:00:00Z`,
    endDate: `${endDate}T23:59:59Z`,
    registrationDeadline: `${registrationDeadline}T23:59:59Z`,
    eligibilityRules: { openGlobally: true },
    prizes: [
      { position: '🥇 1st Place', amount: Number(prize1), description: 'Grand prize + accelerator interview' },
      { position: '🥈 2nd Place', amount: Number(prize2), description: 'Runner up grant' },
      { position: '🥉 3rd Place', amount: Number(prize3), description: 'Third place grant' },
    ],
    totalPrizeValue: totalPrize,
    bannerUrl: null,
    rulesDocUrl: null,
    status: EventStatus.PUBLISHED,
    maxParticipants: 2000,
    minTeamSize: Number(minTeamSize),
    maxTeamSize: Number(maxTeamSize),
    isTeamEvent: true,
    location: location,
    createdAt: new Date().toISOString(),
    participantsCount: 1,
    featured: true,
    tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    bannerGradient: 'from-sky-50 via-white to-orange-50/60',
    tracks: [
      {
        title: 'Core Innovation Track',
        prize: `$${totalPrize.toLocaleString()} Pool`,
        description: 'Build the most innovative end-to-end working system solving real user workflows.',
      },
    ],
    stages: [
      {
        id: 'stg_c1',
        eventId: 'preview',
        stageName: 'Registration',
        stageOrder: 1,
        startDate: `${startDate}T00:00:00Z`,
        endDate: `${registrationDeadline}T23:59:59Z`,
        description: 'Squad formation and track selection',
      },
      {
        id: 'stg_c2',
        eventId: 'preview',
        stageName: 'Hacking Sprint & Submissions',
        stageOrder: 2,
        startDate: `${startDate}T00:00:00Z`,
        endDate: `${endDate}T23:59:59Z`,
        description: 'Ship working code, repos, and demo videos',
      },
    ],
    faqs: [
      {
        id: 'faq_c1',
        eventId: 'preview',
        question: 'Who can participate?',
        answer: 'Anyone! All builders, students, and engineers globally are eligible.',
        createdAt: new Date().toISOString(),
      },
    ],
    sponsors: [{ name: organizerName || 'Host Guild', tier: 'Organizer', logoText: 'HOST' }],
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    saveHostedEvent(previewEvent);
    setIsSuccess(true);
    setTimeout(() => {
      router.push(`/hackathons/${previewEvent.slug}`);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] text-xs font-bold uppercase tracking-wider mb-2">
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Organizer Studio</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Host a Hackathon on Hacker&apos;s Unity
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl font-medium">
          Launch your hackathon in minutes. Tap into our 45,000+ developer ecosystem, automated submission portals, and instant registration workflows.
        </p>
      </div>

      {isSuccess ? (
        <div className="py-20 bg-white rounded-3xl border border-emerald-200 shadow-xl text-center flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Hackathon Published Successfully!</h2>
          <p className="text-sm text-slate-600 max-w-md">
            Your event <span className="text-[#0099e6] font-bold">{previewEvent.title}</span> is now live in the global directory. Redirecting you to the live event page...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step Wizard indicator */}
            <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  step === 1 ? 'bg-[#0099e6] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                1. Basic Info
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  step === 2 ? 'bg-[#0099e6] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                2. Dates & Schedule
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  step === 3 ? 'bg-[#0099e6] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                3. Prizes & Tracks
              </button>
            </div>

            <form onSubmit={handlePublish} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              {/* STEP 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0099e6]" />
                    <span>General Information</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hackathon Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NextGen Autonomous Agents Hackathon 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Organizer / Guild Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nexus AI Labs"
                      value={organizerName}
                      onChange={(e) => setOrganizerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description & Mission *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="What are hackers building? What tools and problem statements are in scope?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Event Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as EventCategory)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      >
                        <option value={EventCategory.HACKATHON}>Hackathon</option>
                        <option value={EventCategory.COMPETITION}>Competition</option>
                        <option value={EventCategory.WORKSHOP}>Workshop / Sprint</option>
                        <option value={EventCategory.QUIZ}>Speed Contest</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Format</label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      >
                        <option value={EventType.ONLINE}>🌐 Virtual / Online</option>
                        <option value={EventType.OFFLINE}>📍 In-Person</option>
                        <option value={EventType.HYBRID}>⚡ Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Continue to Dates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Dates & Schedule */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0099e6]" />
                    <span>Timeline & Deadlines</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Registration Closes</label>
                      <input
                        type="date"
                        value={registrationDeadline}
                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Min Team Size</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={minTeamSize}
                        onChange={(e) => setMinTeamSize(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Max Team Size</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={maxTeamSize}
                        onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Continue to Prizes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Prizes & Tags */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#ea580c]" />
                    <span>Prizes & Tags</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">1st Place ($)</label>
                      <input
                        type="number"
                        value={prize1}
                        onChange={(e) => setPrize1(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6] font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">2nd Place ($)</label>
                      <input
                        type="number"
                        value={prize2}
                        onChange={(e) => setPrize2(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6] font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">3rd Place ($)</label>
                      <input
                        type="number"
                        value={prize3}
                        onChange={(e) => setPrize3(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6] font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tech Stack Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="GenAI, Python, Agents, Next.js"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-[#ea580c] flex items-center justify-between font-mono font-black">
                    <span>Total Prize Pool:</span>
                    <span className="text-base font-extrabold">${totalPrize.toLocaleString()} USD</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>Publish Hackathon Live</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Live Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-[#0099e6]" />
              <span>Live Card Preview</span>
            </div>

            <HackathonCard event={previewEvent} />
            <p className="text-[11px] text-slate-400 text-center font-medium">
              This is how your hackathon will appear to 45,000+ builders worldwide.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
