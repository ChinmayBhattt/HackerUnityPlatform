'use client';

import { useState, useRef, useMemo } from 'react';
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
  Upload,
  X,
  Plus,
  Settings,
  FileText,
  Save,
  Image as ImageIcon,
  Globe,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { EventCategory, EventStatus, EventType, CustomQuestion } from '@hackers-unity/shared-types';
import { ExtendedEvent } from '@/lib/mock-data';
import { saveHostedEvent, saveDraftEvent } from '@/lib/storage';
import { createEventInSupabase } from '@/lib/supabase-service';
import { HackathonCard } from '@/components/hackathon-card';
import { useAuth } from '@/lib/auth-context';

const TOTAL_STEPS = 6;

const TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

const DIFFICULTY_LEVELS = [
  { value: 'OPEN', label: '🌐 Open to All' },
  { value: 'BEGINNER', label: '🌱 Beginner Friendly' },
  { value: 'INTERMEDIATE', label: '⚡ Intermediate' },
  { value: 'ADVANCED', label: '🔥 Advanced' },
];

export default function HostHackathonPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [organizerName, setOrganizerName] = useState(user?.name || 'Innovators Guild');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>(EventCategory.HACKATHON);
  const [eventType, setEventType] = useState<EventType>(EventType.ONLINE);
  const [location, setLocation] = useState('Online / Discord');

  // Step 2: Dates & Schedule
  const [registrationStart, setRegistrationStart] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Step 3: Hackathon Details
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [eligibility, setEligibility] = useState('Open to all students, developers, and builders worldwide.');
  const [difficulty, setDifficulty] = useState('OPEN');
  const [tagsInput, setTagsInput] = useState('GenAI, Next.js, Cloud');
  const [rulesText, setRulesText] = useState('');

  // Step 4: Prizes & Tracks
  const [prizes, setPrizes] = useState([
    { position: '🥇 1st Prize', amount: 100000, description: 'Grand prize + accelerator interview' },
    { position: '🥈 2nd Prize', amount: 50000, description: 'Runner up grant' },
    { position: '🥉 3rd Prize', amount: 25000, description: 'Third place grant' },
  ]);
  const [tracks, setTracks] = useState([
    { title: 'Core Innovation Track', prize: '₹1,75,000 Pool', description: 'Build the most innovative end-to-end working system solving real user workflows.' },
  ]);

  // Step 5: Registration Settings
  const [registrationType, setRegistrationType] = useState<'FREE' | 'PAID'>('FREE');
  const [registrationCapacity, setRegistrationCapacity] = useState<number>(500);
  const [approvalMode, setApprovalMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'text' | 'select' | 'textarea'>('text');

  const slug = useMemo(() => {
    return title
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : 'my-custom-hackathon-2026';
  }, [title]);

  const totalPrize = useMemo(() => {
    return prizes.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [prizes]);

  // ─── Pure Date Validation Calculation ────────────────────
  const dateErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    const regStart = registrationStart ? new Date(registrationStart) : null;
    const regEnd = registrationDeadline ? new Date(registrationDeadline) : null;
    const hackStart = startDate ? new Date(startDate) : null;
    const hackEnd = endDate ? new Date(endDate) : null;

    if (regStart && regEnd && regStart >= regEnd) {
      errors.registrationDeadline = 'Registration deadline must be after registration start';
    }
    if (regEnd && hackStart && regEnd > hackStart) {
      errors.startDate = 'Hackathon start must be after registration deadline';
    }
    if (hackStart && hackEnd && hackStart >= hackEnd) {
      errors.endDate = 'Hackathon end must be after hackathon start';
    }
    return errors;
  }, [registrationStart, registrationDeadline, startDate, endDate]);

  const isDatesValid = Object.keys(dateErrors).length === 0;

  // ─── File Handlers ──────────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ─── Prize & Track Management ───────────────────────────
  const addPrize = () => {
    setPrizes((prev) => [...prev, { position: `${prev.length + 1}th Prize`, amount: 0, description: '' }]);
  };
  const removePrize = (idx: number) => {
    if (prizes.length > 1) setPrizes((prev) => prev.filter((_, i) => i !== idx));
  };
  const updatePrize = (idx: number, field: string, value: string | number) => {
    setPrizes((prev) => {
      const updated = [...prev];
      (updated[idx] as any)[field] = value;
      return updated;
    });
  };

  const addTrack = () => {
    setTracks((prev) => [...prev, { title: '', prize: '', description: '' }]);
  };
  const removeTrack = (idx: number) => {
    if (tracks.length > 1) setTracks((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateTrack = (idx: number, field: string, value: string) => {
    setTracks((prev) => {
      const updated = [...prev];
      (updated[idx] as any)[field] = value;
      return updated;
    });
  };

  // ─── Custom Questions ───────────────────────────────────
  const addCustomQuestion = () => {
    if (!newQuestionLabel.trim()) return;
    setCustomQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        label: newQuestionLabel.trim(),
        type: newQuestionType,
        required: false,
      },
    ]);
    setNewQuestionLabel('');
  };
  const removeCustomQuestion = (id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // ─── Build Preview Event ────────────────────────────────
  const previewEvent = useMemo<ExtendedEvent>(() => {
    return {
      id: `evt_custom_${Date.now()}`,
      organizerId: user?.id || 'usr_me',
      organizerName: organizerName || 'Innovators Guild',
      organizerAvatar: '⚡',
      title: title || 'Untitled Hackathon',
      slug,
      tagline: tagline || '',
      description: description || 'Join this hackathon to innovate, build real-world solutions, and compete for prizes.',
      category,
      eventType,
      startDate: startDate ? `${startDate}T00:00:00Z` : new Date(Date.now() + 30 * 86400000).toISOString(),
      endDate: endDate ? `${endDate}T23:59:59Z` : new Date(Date.now() + 45 * 86400000).toISOString(),
      registrationDeadline: registrationDeadline ? `${registrationDeadline}T23:59:59Z` : new Date(Date.now() + 28 * 86400000).toISOString(),
      registrationStart: registrationStart ? `${registrationStart}T00:00:00Z` : undefined,
      timezone,
      eligibilityRules: { openGlobally: true, eligibility },
      eligibility,
      difficulty,
      rulesText,
      prizes: prizes.map((p) => ({ ...p, amount: Number(p.amount) })),
      totalPrizeValue: totalPrize,
      bannerUrl: bannerPreview,
      logoUrl: logoPreview,
      image: bannerPreview || undefined,
      rulesDocUrl: null,
      status: EventStatus.PUBLISHED,
      maxParticipants: registrationCapacity || 2000,
      minTeamSize: Number(minTeamSize),
      maxTeamSize: Number(maxTeamSize),
      isTeamEvent: true,
      location,
      createdAt: new Date().toISOString(),
      participantsCount: 1,
      featured: true,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      bannerGradient: 'from-sky-50 via-white to-orange-50/60',
      tracks,
      registrationType,
      registrationCapacity,
      approvalMode,
      customQuestions,
      stages: [
        {
          id: 'stg_c1',
          eventId: 'preview',
          stageName: 'Registration',
          stageOrder: 1,
          startDate: registrationStart ? `${registrationStart}T00:00:00Z` : null,
          endDate: registrationDeadline ? `${registrationDeadline}T23:59:59Z` : null,
          description: 'Squad formation and track selection',
        },
        {
          id: 'stg_c2',
          eventId: 'preview',
          stageName: 'Hacking Sprint & Submissions',
          stageOrder: 2,
          startDate: startDate ? `${startDate}T00:00:00Z` : null,
          endDate: endDate ? `${endDate}T23:59:59Z` : null,
          description: 'Ship working code, repos, and demo videos',
        },
      ],
      faqs: [
        {
          id: 'faq_c1',
          eventId: 'preview',
          question: 'Who can participate?',
          answer: eligibility || 'Anyone! All builders, students, and engineers globally are eligible.',
          createdAt: new Date().toISOString(),
        },
      ],
      sponsors: [{ name: organizerName || 'Host Guild', tier: 'Organizer', logoText: 'HOST' }],
    };
  }, [
    user?.id,
    organizerName,
    title,
    slug,
    tagline,
    description,
    category,
    eventType,
    startDate,
    endDate,
    registrationDeadline,
    registrationStart,
    timezone,
    eligibility,
    difficulty,
    rulesText,
    prizes,
    totalPrize,
    bannerPreview,
    logoPreview,
    registrationCapacity,
    minTeamSize,
    maxTeamSize,
    location,
    tagsInput,
    tracks,
    registrationType,
    approvalMode,
    customQuestions,
  ]);

  // ─── Publish & Draft Handlers ───────────────────────────
  const handlePublish = async () => {
    setIsSaving(true);
    const event = { ...previewEvent, status: EventStatus.PUBLISHED };
    saveHostedEvent(event);
    await createEventInSupabase(event);
    setIsSaving(false);
    setIsSuccess(true);
    setTimeout(() => {
      router.push(`/hackathons/${event.slug}`);
    }, 1500);
  };

  const handleSaveDraft = () => {
    const event = { ...previewEvent, status: EventStatus.DRAFT };
    saveDraftEvent(event);
    alert('Draft saved successfully!');
  };

  const handlePreview = () => {
    const event = { ...previewEvent, status: EventStatus.PUBLISHED };
    saveHostedEvent(event);
    window.open(`/hackathons/${event.slug}`, '_blank');
  };

  // ─── Step Navigation ────────────────────────────────────
  const canGoNext = (): boolean => {
    switch (step) {
      case 1:
        return !!title.trim() && !!organizerName.trim() && !!description.trim();
      case 2:
        return !!startDate && !!endDate && !!registrationDeadline && isDatesValid;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (step === 2 && !isDatesValid) return;
    if (step < TOTAL_STEPS) setStep((prev) => prev + 1);
  };
  const goBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const stepLabels = [
    { num: 1, label: 'Basic Info', icon: Sparkles },
    { num: 2, label: 'Dates', icon: Calendar },
    { num: 3, label: 'Details', icon: FileText },
    { num: 4, label: 'Prizes', icon: Trophy },
    { num: 5, label: 'Registration', icon: Settings },
    { num: 6, label: 'Review', icon: Eye },
  ];

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
          Launch your hackathon in minutes. Tap into our 50,000+ developer ecosystem, automated submission portals, and instant registration workflows.
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
            <div className="flex items-center gap-1 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs font-bold overflow-x-auto scrollbar-none">
              {stepLabels.map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setStep(s.num)}
                  className={`flex-1 py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    step === s.num
                      ? 'bg-[#0099e6] text-white shadow-2xs'
                      : s.num < step
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {s.num < step ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <s.icon className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.num}</span>
                </button>
              ))}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              {/* ═══ STEP 1: Basic Info ═══════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0099e6]" />
                    <span>General Information</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hackathon Name *</label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Short Tagline</label>
                    <input
                      type="text"
                      placeholder="e.g. Build the future of AI in 48 hours"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      maxLength={100}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5 text-right">{tagline.length}/100</p>
                  </div>

                  {/* Logo & Banner Upload */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hackathon Logo</label>
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#0099e6] bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#0099e6] transition-all cursor-pointer overflow-hidden"
                      >
                        {logoPreview ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            <span className="text-[10px] font-bold">Upload Logo</span>
                          </>
                        )}
                      </button>
                      {logoPreview && (
                        <button onClick={() => setLogoPreview(null)} className="text-[10px] text-red-500 mt-1 cursor-pointer hover:underline">Remove</button>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Banner / Cover Image</label>
                      <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#0099e6] bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#0099e6] transition-all cursor-pointer overflow-hidden"
                      >
                        {bannerPreview ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-[10px] font-bold">Upload Banner</span>
                          </>
                        )}
                      </button>
                      {bannerPreview && (
                        <button onClick={() => setBannerPreview(null)} className="text-[10px] text-red-500 mt-1 cursor-pointer hover:underline">Remove</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Organizer / Community Name *</label>
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
                        onChange={(e) => {
                          const val = e.target.value as EventType;
                          setEventType(val);
                          if (val === EventType.ONLINE) setLocation('Online / Discord');
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      >
                        <option value={EventType.ONLINE}>🌐 Virtual / Online</option>
                        <option value={EventType.OFFLINE}>📍 In-Person</option>
                        <option value={EventType.HYBRID}>⚡ Hybrid</option>
                      </select>
                    </div>
                  </div>

                  {(eventType === EventType.OFFLINE || eventType === EventType.HYBRID) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Location / Venue *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. IIT Delhi, New Delhi, India"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canGoNext()}
                      className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Continue to Dates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 2: Dates & Schedule ═══════════════════════ */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0099e6]" />
                    <span>Dates & Schedule</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Registration Opens</label>
                      <input
                        type="date"
                        value={registrationStart}
                        onChange={(e) => setRegistrationStart(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Registration Deadline *</label>
                      <input
                        type="date"
                        required
                        value={registrationDeadline}
                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6] ${dateErrors.registrationDeadline ? 'border-red-400' : 'border-slate-200'}`}
                      />
                      {dateErrors.registrationDeadline && (
                        <p className="text-[10px] text-red-500 mt-0.5">{dateErrors.registrationDeadline}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hackathon Start *</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6] ${dateErrors.startDate ? 'border-red-400' : 'border-slate-200'}`}
                      />
                      {dateErrors.startDate && (
                        <p className="text-[10px] text-red-500 mt-0.5">{dateErrors.startDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hackathon End *</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6] ${dateErrors.endDate ? 'border-red-400' : 'border-slate-200'}`}
                      />
                      {dateErrors.endDate && (
                        <p className="text-[10px] text-red-500 mt-0.5">{dateErrors.endDate}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button type="button" onClick={goBack} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button type="button" onClick={goNext} disabled={!canGoNext()} className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed">
                      <span>Continue to Details</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 3: Hackathon Details ═══════════════════════ */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0099e6]" />
                    <span>Hackathon Details</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Min Team Size</label>
                      <input type="number" min={1} max={10} value={minTeamSize} onChange={(e) => setMinTeamSize(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Max Team Size</label>
                      <input type="number" min={1} max={10} value={maxTeamSize} onChange={(e) => setMaxTeamSize(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Eligibility</label>
                    <textarea rows={2} placeholder="e.g. Open to all college students and independent builders across India" value={eligibility} onChange={(e) => setEligibility(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none resize-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty Level</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]">
                      {DIFFICULTY_LEVELS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Domains / Tech Tags (comma separated)</label>
                    <input type="text" placeholder="GenAI, Python, Agents, Next.js" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none" />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tagsInput.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-100 text-[10px] font-mono font-semibold text-[#0099e6]">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Rules & Guidelines</label>
                    <textarea rows={4} placeholder="Enter the rules, submission criteria, judging parameters, and code of conduct..." value={rulesText} onChange={(e) => setRulesText(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none resize-none leading-relaxed" />
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button type="button" onClick={goBack} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button type="button" onClick={goNext} className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                      <span>Continue to Prizes</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 4: Prizes & Tracks ═══════════════════════ */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#ea580c]" />
                    <span>Prizes & Tracks</span>
                  </h3>

                  {/* Prizes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Prize Distribution</label>
                      <button type="button" onClick={addPrize} className="text-xs text-[#0099e6] font-bold flex items-center gap-1 cursor-pointer hover:underline">
                        <Plus className="w-3 h-3" /> Add Prize
                      </button>
                    </div>
                    {prizes.map((prize, idx) => (
                      <div key={idx} className="flex gap-2 items-start p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex-1 space-y-2">
                          <input type="text" placeholder="e.g. 🥇 1st Prize" value={prize.position} onChange={(e) => updatePrize(idx, 'position', e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" placeholder="Amount (₹)" value={prize.amount} onChange={(e) => updatePrize(idx, 'amount', Number(e.target.value))} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6] font-mono" />
                            <input type="text" placeholder="Description" value={prize.description} onChange={(e) => updatePrize(idx, 'description', e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                          </div>
                        </div>
                        {prizes.length > 1 && (
                          <button type="button" onClick={() => removePrize(idx)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer mt-1">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-[#ea580c] flex items-center justify-between font-mono font-black">
                    <span>Total Prize Pool:</span>
                    <span className="text-base font-extrabold">₹{totalPrize.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Tracks */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#0099e6]" /> Hackathon Tracks
                      </label>
                      <button type="button" onClick={addTrack} className="text-xs text-[#0099e6] font-bold flex items-center gap-1 cursor-pointer hover:underline">
                        <Plus className="w-3 h-3" /> Add Track
                      </button>
                    </div>
                    {tracks.map((track, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex gap-2">
                          <input type="text" placeholder="Track Name" value={track.title} onChange={(e) => updateTrack(idx, 'title', e.target.value)} className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                          <input type="text" placeholder="Prize (e.g. ₹50,000)" value={track.prize} onChange={(e) => updateTrack(idx, 'prize', e.target.value)} className="w-32 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                          {tracks.length > 1 && (
                            <button type="button" onClick={() => removeTrack(idx)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <input type="text" placeholder="Track description" value={track.description} onChange={(e) => updateTrack(idx, 'description', e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button type="button" onClick={goBack} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button type="button" onClick={goNext} className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                      <span>Continue to Registration</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 5: Registration Settings ═══════════════════ */}
              {step === 5 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#0099e6]" />
                    <span>Registration Settings</span>
                  </h3>

                  {/* Free/Paid toggle */}
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRegistrationType('FREE')} className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${registrationType === 'FREE' ? 'bg-emerald-50/80 border-emerald-400 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                      <Globe className="w-5 h-5 mb-1.5 text-emerald-600" />
                      <div className="text-sm font-bold text-slate-900">Free Entry</div>
                      <div className="text-[11px] text-slate-500">No registration fee</div>
                    </button>
                    <button type="button" onClick={() => setRegistrationType('PAID')} className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${registrationType === 'PAID' ? 'bg-orange-50/80 border-[#f97316] shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                      <Trophy className="w-5 h-5 mb-1.5 text-[#f97316]" />
                      <div className="text-sm font-bold text-slate-900">Paid Entry</div>
                      <div className="text-[11px] text-slate-500">Charge a registration fee</div>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Registration Capacity</label>
                      <input type="number" min={10} value={registrationCapacity} onChange={(e) => setRegistrationCapacity(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Approval Mode</label>
                      <select value={approvalMode} onChange={(e) => setApprovalMode(e.target.value as 'AUTO' | 'MANUAL')} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]">
                        <option value="AUTO">✅ Auto Approve</option>
                        <option value="MANUAL">🔒 Manual Approval</option>
                      </select>
                    </div>
                  </div>

                  {/* Default Fields */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 mb-2 block">Default Registration Fields</label>
                    <div className="flex flex-wrap gap-2">
                      {['Name', 'Email', 'Phone', 'College', 'City', 'GitHub', 'LinkedIn', 'Skills'].map((field) => (
                        <span key={field} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Custom Questions */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#0099e6]" /> Custom Questions (Optional)
                    </label>

                    {customQuestions.map((q) => (
                      <div key={q.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="flex-1 text-xs text-slate-700 font-medium">{q.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{q.type}</span>
                        <button type="button" onClick={() => removeCustomQuestion(q.id)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <input type="text" placeholder="Question label" value={newQuestionLabel} onChange={(e) => setNewQuestionLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQuestion())} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]" />
                      <select value={newQuestionType} onChange={(e) => setNewQuestionType(e.target.value as any)} className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none">
                        <option value="text">Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="select">Select</option>
                      </select>
                      <button type="button" onClick={addCustomQuestion} className="px-3 py-2 rounded-xl bg-[#0099e6] text-white text-xs font-bold cursor-pointer hover:bg-[#0284c7]">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button type="button" onClick={goBack} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button type="button" onClick={goNext} className="px-5 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                      <span>Continue to Review</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 6: Review & Publish ═══════════════════════ */}
              {step === 6 && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#0099e6]" />
                    <span>Review & Publish</span>
                  </h3>

                  {/* Summary Sections */}
                  <div className="space-y-3">
                    {/* Basic Info Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Basic Info</span>
                        <button type="button" onClick={() => setStep(1)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-slate-500">Name:</span> <span className="font-semibold text-slate-900">{title || '—'}</span></div>
                        <div><span className="text-slate-500">Organizer:</span> <span className="font-semibold text-slate-900">{organizerName || '—'}</span></div>
                        <div><span className="text-slate-500">Format:</span> <span className="font-semibold text-slate-900">{eventType}</span></div>
                        <div><span className="text-slate-500">Category:</span> <span className="font-semibold text-slate-900">{category}</span></div>
                        {tagline && <div className="col-span-2"><span className="text-slate-500">Tagline:</span> <span className="font-semibold text-slate-900">{tagline}</span></div>}
                      </div>
                    </div>

                    {/* Dates Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Dates & Schedule</span>
                        <button type="button" onClick={() => setStep(2)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-slate-500">Reg. Opens:</span> <span className="font-semibold text-slate-900">{registrationStart || '—'}</span></div>
                        <div><span className="text-slate-500">Reg. Deadline:</span> <span className="font-semibold text-slate-900">{registrationDeadline || '—'}</span></div>
                        <div><span className="text-slate-500">Hack Start:</span> <span className="font-semibold text-slate-900">{startDate || '—'}</span></div>
                        <div><span className="text-slate-500">Hack End:</span> <span className="font-semibold text-slate-900">{endDate || '—'}</span></div>
                        <div><span className="text-slate-500">Timezone:</span> <span className="font-semibold text-slate-900">{timezone}</span></div>
                      </div>
                    </div>

                    {/* Details Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Details</span>
                        <button type="button" onClick={() => setStep(3)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-slate-500">Team Size:</span> <span className="font-semibold text-slate-900">{minTeamSize}–{maxTeamSize}</span></div>
                        <div><span className="text-slate-500">Difficulty:</span> <span className="font-semibold text-slate-900">{DIFFICULTY_LEVELS.find((d) => d.value === difficulty)?.label || difficulty}</span></div>
                        <div className="col-span-2"><span className="text-slate-500">Tags:</span> <span className="font-semibold text-slate-900">{tagsInput || '—'}</span></div>
                      </div>
                    </div>

                    {/* Prizes Summary */}
                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#ea580c]">Prizes — ₹{totalPrize.toLocaleString('en-IN')} Total</span>
                        <button type="button" onClick={() => setStep(4)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="space-y-1">
                        {prizes.map((p, i) => (
                          <div key={i} className="text-xs flex justify-between">
                            <span className="text-slate-700 font-medium">{p.position}</span>
                            <span className="font-mono font-bold text-[#ea580c]">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Registration Settings Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Registration Settings</span>
                        <button type="button" onClick={() => setStep(5)} className="text-[10px] text-[#0099e6] font-bold cursor-pointer hover:underline">Edit</button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-slate-500">Type:</span> <span className="font-semibold text-slate-900">{registrationType}</span></div>
                        <div><span className="text-slate-500">Capacity:</span> <span className="font-semibold text-slate-900">{registrationCapacity}</span></div>
                        <div><span className="text-slate-500">Approval:</span> <span className="font-semibold text-slate-900">{approvalMode === 'AUTO' ? '✅ Auto' : '🔒 Manual'}</span></div>
                        <div><span className="text-slate-500">Custom Q&apos;s:</span> <span className="font-semibold text-slate-900">{customQuestions.length}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={goBack} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
                    </button>
                    <button type="button" onClick={handleSaveDraft} className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
                      <Save className="w-3.5 h-3.5" /> <span>Save Draft</span>
                    </button>
                    <button type="button" onClick={handlePreview} className="px-4 py-2.5 rounded-xl bg-white border border-[#0099e6] hover:bg-sky-50 text-[#0099e6] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
                      <Eye className="w-3.5 h-3.5" /> <span>Preview</span>
                    </button>
                    <button type="button" onClick={handlePublish} disabled={isSaving || !title.trim()} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      <Rocket className="w-4 h-4" />
                      <span>{isSaving ? 'Publishing...' : 'Publish Hackathon Live'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Live Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-[#0099e6]" />
              <span>Live Card Preview</span>
            </div>

            <HackathonCard event={previewEvent} />
            <p className="text-[11px] text-slate-400 text-center font-medium">
              This is how your hackathon will appear to 50,000+ builders worldwide.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
