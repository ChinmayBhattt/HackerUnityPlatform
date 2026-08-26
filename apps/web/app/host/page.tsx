'use client';

import { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  GraduationCap,
  Building2,
  User,
  Mail,
  Send,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Lock,
} from 'lucide-react';
import { EventCategory, EventStatus, EventType, CustomQuestion } from '@hackers-unity/shared-types';
import { ExtendedEvent, MOCK_EVENTS } from '@/lib/mock-data';
import { saveHostedEvent, saveDraftEvent, updateHostedEvent, getCustomEvents } from '@/lib/storage';
import { createEventInSupabase, updateEventInSupabase, fetchEventBySlug, uploadHackathonAsset } from '@/lib/supabase-service';
import { HackathonCard } from '@/components/hackathon-card';
import { RichTextEditor } from '@/components/rich-text-editor';
import { VenuePicker } from '@/components/venue-picker';
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
  { value: 'OPEN', label: 'Open to All' },
  { value: 'BEGINNER', label: 'Beginner Friendly' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

const MANDATORY_REGISTRATION_FIELDS = [
  { id: 'name', label: 'Full Name', icon: '👤', description: 'Participant real name' },
  { id: 'email', label: 'Email Address', icon: '✉️', description: 'Communication & verification email' },
  { id: 'phone', label: 'Phone Number', icon: '📞', description: 'Contact & WhatsApp number' },
  { id: 'college', label: 'College / Institute', icon: '🎓', description: 'University / Institute name' },
  { id: 'city', label: 'City / Location', icon: '📍', description: 'Current city location' },
];

const AVAILABLE_OPTIONAL_FIELDS = [
  { id: 'github', label: 'GitHub Profile', icon: '🐙', hint: 'GitHub profile URL' },
  { id: 'linkedin', label: 'LinkedIn Profile', icon: '💼', hint: 'LinkedIn profile link' },
  { id: 'skills', label: 'Skills & Tech Stack', icon: '⚡', hint: 'Builder tech stack tags' },
  { id: 'portfolio', label: 'Portfolio Website', icon: '🌐', hint: 'Personal portfolio / blog' },
  { id: 'resume', label: 'Resume / CV Link', icon: '📄', hint: 'Drive or PDF resume link' },
  { id: 'discord', label: 'Discord Handle', icon: '💬', hint: 'Discord username (user#1234)' },
  { id: 'twitter', label: 'Twitter / X Profile', icon: '🐦', hint: 'Twitter profile handle' },
  { id: 'tshirt', label: 'T-Shirt Size (Swag)', icon: '👕', hint: 'S, M, L, XL, XXL' },
  { id: 'dietary', label: 'Dietary Preference', icon: '🥗', hint: 'Veg, Non-Veg, Vegan' },
  { id: 'experience', label: 'Experience Level', icon: '🚀', hint: 'Beginner, Intermediate, Pro' },
];

function HostHackathonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams?.get('edit') || searchParams?.get('id') || searchParams?.get('slug');

  const { user, supabaseUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEvent, setSubmittedEvent] = useState<ExtendedEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [originalEventSlug, setOriginalEventSlug] = useState<string | null>(null);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [hostType, setHostType] = useState<'COLLEGE' | 'ORGANIZATION'>('COLLEGE');
  const [institutionName, setInstitutionName] = useState('');
  const [organizerLeadName, setOrganizerLeadName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>(EventCategory.HACKATHON);
  const [eventType, setEventType] = useState<EventType>(EventType.ONLINE);
  const [location, setLocation] = useState('Online / Discord');

  // Combined organizer string
  const organizerName = useMemo(() => {
    const org = institutionName.trim();
    const lead = organizerLeadName.trim();
    if (org && lead) {
      return `${org} • ${lead}`;
    }
    return org || lead || '';
  }, [institutionName, organizerLeadName]);

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
  const [registrationCapacity, setRegistrationCapacity] = useState<number | null>(null);
  const [isUnlimitedCapacity, setIsUnlimitedCapacity] = useState(true);
  const [approvalMode, setApprovalMode] = useState<'AUTO' | 'MANUAL'>('MANUAL');
  const [selectedOptionalFields, setSelectedOptionalFields] = useState<string[]>([
    'github',
    'linkedin',
    'skills',
  ]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'text' | 'select' | 'textarea'>('text');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const slug = useMemo(() => {
    return title
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : 'my-custom-hackathon-2026';
  }, [title]);

  const totalPrize = useMemo(() => {
    return prizes.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [prizes]);

  const paidEmailSubject = useMemo(() => {
    return `Paid Hackathon Listing Request: ${title || 'New Hackathon'} - Hacker's Unity`;
  }, [title]);

  const paidEmailBodyText = useMemo(() => {
    return `Hi Hacker's Unity Team,

I am organizing a hackathon on Hacker's Unity and would like to enable Paid Entry / Ticket Registrations.

--- EVENT DETAILS ---
• Event Title: ${title || 'Untitled Hackathon'}
• Tagline: ${tagline || 'N/A'}
• Organizing Entity: ${institutionName || 'N/A'} (${hostType === 'COLLEGE' ? 'College/University' : 'Organization/Community'})
• Organizer / Lead: ${organizerLeadName || user?.name || 'N/A'}
• Organizer Contact: ${user?.email || 'N/A'}${user?.phone ? ` | ${user.phone}` : ''}
• Event Format: ${eventType} (${location || 'Online'})
• Registration Window: ${registrationStart ? new Date(registrationStart).toLocaleDateString('en-IN') : 'TBD'} to ${registrationDeadline ? new Date(registrationDeadline).toLocaleDateString('en-IN') : 'TBD'}
• Hackathon Schedule: ${startDate ? new Date(startDate).toLocaleDateString('en-IN') : 'TBD'} to ${endDate ? new Date(endDate).toLocaleDateString('en-IN') : 'TBD'}
• Total Prize Pool: ₹${totalPrize.toLocaleString('en-IN')}
• Registration Capacity: ${isUnlimitedCapacity || !registrationCapacity ? 'Unlimited Participants' : `${registrationCapacity} Participants`}
• Team Size: ${minTeamSize} to ${maxTeamSize} Members
• Tech Domains / Tags: ${tagsInput || 'N/A'}

--- PAID ENTRY DETAILS ---
• Proposed Entry Fee per participant/team: 
• Payment Gateway Preference: [Razorpay / Stripe / UPI / Escrow]
• Additional Requirements: 

Please help us enable paid ticketing and payment gateway setup for this event.

Best regards,
${organizerLeadName || user?.name || 'Organizer'}`;
  }, [title, tagline, institutionName, hostType, organizerLeadName, user?.name, user?.email, user?.phone, eventType, location, registrationStart, registrationDeadline, startDate, endDate, totalPrize, registrationCapacity, minTeamSize, maxTeamSize, tagsInput]);

  const paidMailtoUrl = useMemo(() => {
    return `mailto:hackersunity.events@gmail.com?subject=${encodeURIComponent(paidEmailSubject)}&body=${encodeURIComponent(paidEmailBodyText)}`;
  }, [paidEmailSubject, paidEmailBodyText]);

  const paidGmailWebUrl = useMemo(() => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=hackersunity.events@gmail.com&su=${encodeURIComponent(paidEmailSubject)}&body=${encodeURIComponent(paidEmailBodyText)}`;
  }, [paidEmailSubject, paidEmailBodyText]);

  // ─── LOAD EVENT FOR EDIT MODE ────────────────────────────
  useEffect(() => {
    if (!editParam) return;

    let isMounted = true;
    setIsLoadingEditData(true);

    async function loadEventToEdit() {
      try {
        let found: ExtendedEvent | null = null;

        // 0. Try sessionStorage first (set by Dashboard Edit button — most reliable)
        try {
          const cached = sessionStorage.getItem('hackers_unity_edit_event');
          if (cached) {
            const parsed = JSON.parse(cached) as ExtendedEvent;
            if (parsed && (parsed.id === editParam || parsed.slug === editParam)) {
              found = parsed;
              sessionStorage.removeItem('hackers_unity_edit_event');
            }
          }
        } catch {
          // ignore parse errors
        }

        // 1. Try remote fetch from Supabase
        if (!found) {
          found = await fetchEventBySlug(editParam!);
        }

        // 2. Try local storage
        if (!found) {
          const custom = getCustomEvents();
          found = custom.find((e) => e.id === editParam || e.slug === editParam) || null;
        }

        // 3. Try mock data
        if (!found) {
          found = MOCK_EVENTS.find((e) => e.id === editParam || e.slug === editParam) || null;
        }

        if (found && isMounted) {
          setIsEditMode(true);
          setEditingEventId(found.id);
          setOriginalEventSlug(found.slug);

          setTitle(found.title || found.name || '');
          setTagline(found.tagline || '');
          setLogoPreview(found.logoUrl || found.organizerLogo || null);
          setBannerPreview(found.bannerUrl || found.image || null);
          setDescription(found.description || '');
          setCategory(found.category || EventCategory.HACKATHON);
          setEventType(found.eventType || (found.mode === 'Online' ? EventType.ONLINE : EventType.OFFLINE));
          setLocation(found.location || 'Online');

          if (found.organizerName) {
            if (found.organizerName.includes('•')) {
              const parts = found.organizerName.split('•').map((s) => s.trim());
              setInstitutionName(parts[0] || '');
              setOrganizerLeadName(parts[1] || '');
            } else {
              setInstitutionName(found.organizerName);
            }
          }

          if (found.startDate) {
            setStartDate(found.startDate.split('T')[0] || '');
          }
          if (found.endDate) {
            setEndDate(found.endDate.split('T')[0] || '');
          }
          if (found.registrationDeadline) {
            setRegistrationDeadline(found.registrationDeadline.split('T')[0] || '');
          }
          if (found.registrationStart) {
            setRegistrationStart(found.registrationStart.split('T')[0] || '');
          }
          if (found.timezone) {
            setTimezone(found.timezone);
          }
          if (found.minTeamSize) {
            setMinTeamSize(found.minTeamSize);
          }
          if (found.maxTeamSize) {
            setMaxTeamSize(found.maxTeamSize);
          }
          if (found.eligibility) {
            setEligibility(found.eligibility);
          }
          if (found.difficulty) {
            setDifficulty(found.difficulty);
          }
          if (found.tags && found.tags.length > 0) {
            setTagsInput(found.tags.join(', '));
          }
          if (found.rulesText) {
            setRulesText(found.rulesText);
          }
          if (found.prizes && found.prizes.length > 0) {
            setPrizes(
              found.prizes.map((p) => ({
                position: p.position,
                amount: Number(p.amount || 0),
                description: p.description || '',
              }))
            );
          }
          if (found.tracks && found.tracks.length > 0) {
            setTracks(found.tracks);
          }
          if (found.registrationType) {
            setRegistrationType(found.registrationType as 'FREE' | 'PAID');
          }
          if (found.registrationCapacity) {
            setRegistrationCapacity(found.registrationCapacity);
            setIsUnlimitedCapacity(false);
          } else {
            setRegistrationCapacity(null);
            setIsUnlimitedCapacity(true);
          }
          if (found.approvalMode) {
            setApprovalMode(found.approvalMode as 'AUTO' | 'MANUAL');
          } else {
            setApprovalMode('MANUAL');
          }
          if (found.registrationFields && Array.isArray(found.registrationFields)) {
            const optionalInEvent = found.registrationFields.filter(
              (f: string) => !['name', 'email', 'phone', 'college', 'city'].includes(f.toLowerCase())
            );
            setSelectedOptionalFields(optionalInEvent);
          }
          if (found.customQuestions && found.customQuestions.length > 0) {
            setCustomQuestions(found.customQuestions);
          }
        }
      } catch (err) {
        console.warn('Failed to load event to edit:', err);
      } finally {
        if (isMounted) setIsLoadingEditData(false);
      }
    }

    loadEventToEdit();

    return () => {
      isMounted = false;
    };
  }, [editParam]);

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

  // ─── File Handlers with Client Compression ──────────────
  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target?.result as string);
      };
      reader.onerror = () => resolve('');
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 400, 0.85);
      if (compressed) {
        setLogoPreview(compressed);
      }

      // Async upload to Supabase storage
      try {
        const { url } = await uploadHackathonAsset(file, 'logos');
        if (url) {
          setLogoPreview(url);
        }
      } catch (err) {
        console.warn('Storage upload error:', err);
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 1200, 0.78);
      if (compressed) {
        setBannerPreview(compressed);
      }

      // Async upload to Supabase storage
      try {
        const { url } = await uploadHackathonAsset(file, 'banners');
        if (url) {
          setBannerPreview(url);
        }
      } catch (err) {
        console.warn('Storage upload error:', err);
      }
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
      id: isEditMode && editingEventId ? editingEventId : `evt_custom_${Date.now()}`,
      organizerId: user?.id || 'usr_me',
      organizerName,
      organizerAvatar: hostType === 'COLLEGE' ? '🎓' : '⚡',
      title: title || 'Untitled Hackathon',
      slug: isEditMode && originalEventSlug ? originalEventSlug : slug,
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
      maxParticipants: isUnlimitedCapacity || !registrationCapacity ? null : registrationCapacity,
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
      registrationCapacity: isUnlimitedCapacity ? null : registrationCapacity,
      approvalMode,
      registrationFields: [
        'name',
        'email',
        'phone',
        'college',
        'city',
        ...selectedOptionalFields,
      ],
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
      sponsors: [{ name: institutionName || organizerName || 'Host Guild', tier: 'Organizer', logoText: hostType === 'COLLEGE' ? 'CAMPUS' : 'HOST' }],
    };
  }, [
    isEditMode,
    editingEventId,
    originalEventSlug,
    user?.id,
    organizerName,
    hostType,
    institutionName,
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
    isUnlimitedCapacity,
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
    const event: ExtendedEvent = { ...previewEvent, status: EventStatus.PUBLISHED };
    const organizerId = supabaseUser?.id || user?.id;

    if (isEditMode && editingEventId) {
      // 1. Update in local storage
      updateHostedEvent(event);

      // 2. Update in Supabase / Server API
      await updateEventInSupabase(editingEventId, event);
      setIsSaving(false);
      setSubmittedEvent(event);
      setIsSuccess(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      return;
    }

    // 1. Persist to local storage immediately
    saveHostedEvent(event);

    // 2. Persist to Supabase / Server API
    const res = await createEventInSupabase(event, organizerId);
    setIsSaving(false);
    
    const finalEvent = (res.success && res.data) ? res.data : event;
    setSubmittedEvent(finalEvent);
    setIsSuccess(true);

    // Redirect to live event page
    setTimeout(() => {
      router.push(`/hackathons/${finalEvent.slug}`);
    }, 1500);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    const event = { ...previewEvent, status: EventStatus.DRAFT };
    const organizerId = supabaseUser?.id || user?.id;
    if (isEditMode && editingEventId) {
      updateHostedEvent(event);
      await updateEventInSupabase(editingEventId, event);
    } else {
      saveDraftEvent(event);
      await createEventInSupabase(event, organizerId);
    }
    setIsSaving(false);
    alert('Draft saved successfully! You can find it anytime in your Organizer Dashboard.');
  };

  const handlePreview = () => {
    window.open(`/hackathons/${previewEvent.slug}`, '_blank');
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
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              isEditMode
                ? 'bg-amber-50 border border-amber-200 text-amber-700'
                : 'bg-orange-50 border border-orange-200 text-[#ea580c]'
            }`}
          >
            {isEditMode ? <Sparkles className="w-3.5 h-3.5 text-amber-600" /> : <PlusCircle className="w-3.5 h-3.5" />}
            <span>{isEditMode ? 'Editing Hackathon Studio' : 'Organizer Studio'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {isEditMode ? `Edit Hackathon: ${title || 'Hackathon'}` : "Host a Hackathon on Hacker's Unity"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl font-medium">
            {isEditMode
              ? 'Update dates, prize pools, parameters, registration rules, and custom questions for your hackathon.'
              : 'Launch your hackathon in minutes. Tap into our 50,000+ developer ecosystem, automated submission portals, and instant registration workflows.'}
          </p>
        </div>

        {isEditMode && (
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-2 shadow-2xs self-start md:self-auto cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>

      {isLoadingEditData ? (
        <div className="py-24 bg-white rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#0099e6] animate-spin" />
          <p className="text-xs font-bold text-slate-600">Loading hackathon parameters for editing...</p>
        </div>
      ) : isSuccess && registrationType === 'FREE' ? (
        <div className="py-20 bg-white rounded-3xl border border-emerald-200 shadow-xl text-center flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {isEditMode ? 'Hackathon Updated Successfully!' : 'Hackathon Published Successfully!'}
          </h2>
          <p className="text-sm text-slate-600 max-w-md">
            {isEditMode
              ? <>Changes for <span className="text-[#0099e6] font-bold">{submittedEvent?.title || previewEvent.title}</span> have been saved. Returning to dashboard...</>
              : <>Your event <span className="text-[#0099e6] font-bold">{submittedEvent?.title || previewEvent.title}</span> is now live in the global directory. Redirecting you to the live event page...</>}
          </p>
        </div>
      ) : isSuccess && registrationType === 'PAID' ? (
        <div className="bg-white rounded-3xl border border-orange-200 shadow-xl p-6 sm:p-10 space-y-8 animate-in zoom-in-95">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-orange-50 border-2 border-orange-200 text-[#ea580c] flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Verification Request Recorded</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Paid Hackathon Verification Request Submitted!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Your hackathon <strong className="text-slate-900">&quot;{submittedEvent?.title || previewEvent.title}&quot;</strong> has been submitted with status <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 text-xs">Verification Pending</span>. Our operations team will review your organizing entity and configure ticketing &amp; payment gateway routing before publishing live.
            </p>
          </div>

          {/* Event Summary Card */}
          <div className="max-w-3xl mx-auto p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Submission Snapshot</span>
              <span className="text-xs font-mono font-bold text-[#0099e6]">Slug: /{submittedEvent?.slug || previewEvent.slug}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Event Title</span>
                <span className="font-bold text-slate-900">{submittedEvent?.title || previewEvent.title}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Organizer / Guild</span>
                <span className="font-bold text-slate-900">{submittedEvent?.organizerName || organizerName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Format &amp; Venue</span>
                <span className="font-bold text-slate-900">{submittedEvent?.eventType || eventType} ({submittedEvent?.location || location})</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Schedule</span>
                <span className="font-bold text-slate-900">{startDate ? new Date(startDate).toLocaleDateString('en-IN') : 'TBD'} to {endDate ? new Date(endDate).toLocaleDateString('en-IN') : 'TBD'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Prize Pool</span>
                <span className="font-mono font-black text-[#ea580c]">₹{totalPrize.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Capacity</span>
                <span className="font-bold text-slate-900">{isUnlimitedCapacity || !registrationCapacity ? '♾️ Unlimited' : `${registrationCapacity} Hackers`}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Registration Fee Model</span>
                <span className="font-bold text-orange-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Paid Entry (Escrow Pending)
                </span>
              </div>
            </div>
          </div>

          {/* Email Fast-Track Box */}
          <div className="max-w-3xl mx-auto p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-orange-50/90 via-white to-amber-50/70 border-2 border-orange-200 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#ea580c] text-white shadow-xs shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Fast-Track Verification with Hacker&apos;s Unity Team</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Send your pre-filled event details to our verification desk to expedite payment gateway setup and approval within 24 hours.
                </p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hacker&apos;s Unity Verification Email</div>
                  <a
                    href={paidMailtoUrl}
                    className="text-xs font-black text-[#0099e6] hover:underline flex items-center gap-1 font-mono"
                  >
                    hackersunity.events@gmail.com
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('hackersunity.events@gmail.com');
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
                </button>

                <a
                  href={paidGmailWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 text-center cursor-pointer whitespace-nowrap"
                  title="Open pre-filled draft directly in Gmail on the web"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open in Gmail (Web)</span>
                </a>

                <a
                  href={paidMailtoUrl}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 text-center cursor-pointer whitespace-nowrap"
                  title="Open in Apple Mail, Outlook or default desktop mail app"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mail App</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-orange-100">
              <span>Includes complete event specifications, timeline, contact info &amp; prize pool.</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(paidEmailBodyText);
                  setCopiedTemplate(true);
                  setTimeout(() => setCopiedTemplate(false), 2000);
                }}
                className="text-[#0099e6] hover:underline font-semibold cursor-pointer"
              >
                {copiedTemplate ? '✓ Template Copied to Clipboard' : 'Copy Formatted Details'}
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="max-w-3xl mx-auto pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Go to Organizer Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => window.open(`/hackathons/${submittedEvent?.slug || previewEvent.slug}`, '_blank')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Eye className="w-4 h-4 text-[#0099e6]" />
              <span>Preview Hackathon Page</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setStep(1);
                setTitle('');
                setDescription('');
              }}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
            >
              <span>Host Another Hackathon</span>
            </button>
          </div>
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

                  {/* Organizing Entity Type: College vs Organization/Community */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Who is organizing this hackathon? *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setHostType('COLLEGE')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          hostType === 'COLLEGE'
                            ? 'bg-sky-50/90 border-[#0099e6] text-[#0099e6] shadow-xs ring-2 ring-[#0099e6]/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl ${hostType === 'COLLEGE' ? 'bg-[#0099e6] text-white shadow-2xs' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">College / University</div>
                          <div className="text-[10px] text-slate-500">Student club, campus chapter, department</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHostType('ORGANIZATION')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          hostType === 'ORGANIZATION'
                            ? 'bg-orange-50/90 border-[#f97316] text-[#ea580c] shadow-xs ring-2 ring-[#f97316]/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl ${hostType === 'ORGANIZATION' ? 'bg-[#f97316] text-white shadow-2xs' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Organization / Community</div>
                          <div className="text-[10px] text-slate-500">Tech community, startup, enterprise, DAO</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* College / Organization Name & Organizer Lead Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {hostType === 'COLLEGE' ? 'College / University / Club Name *' : 'Organization / Community Name *'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder={hostType === 'COLLEGE' ? 'e.g. University / Campus Club' : 'e.g. Organization / Community Name'}
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                        />
                        <div className="absolute left-3 top-3 pointer-events-none">
                          {hostType === 'COLLEGE' ? (
                            <GraduationCap className="w-4 h-4 text-[#0099e6]" />
                          ) : (
                            <Building2 className="w-4 h-4 text-[#ea580c]" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Organizer / Lead Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Organizer / Lead Name"
                          value={organizerLeadName}
                          onChange={(e) => setOrganizerLeadName(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                        />
                        <div className="absolute left-3 top-3 pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>


                  <div>
                    <RichTextEditor
                      label="Description & Mission *"
                      rows={5}
                      placeholder="What are hackers building? What tools, problem statements, and judging criteria are in scope? (supports bold, lists, headings, links)..."
                      value={description}
                      onChange={(val) => setDescription(val)}
                      helperText="Rich formatting enabled (Bold, Lists, Headings, Code, Links)"
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
                        <option value={EventType.ONLINE}>Virtual / Online</option>
                        <option value={EventType.OFFLINE}>In-Person</option>
                        <option value={EventType.HYBRID}>Hybrid</option>
                      </select>
                    </div>
                  </div>

                  {(eventType === EventType.OFFLINE || eventType === EventType.HYBRID) && (
                    <VenuePicker
                      value={location}
                      onChange={(val) => setLocation(val)}
                      label="Location / In-Person Venue *"
                      placeholder="Search campus, landmark, building, or city..."
                    />
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
                    <RichTextEditor
                      label="Rules & Guidelines"
                      rows={4}
                      placeholder="Enter the rules, submission criteria, judging parameters, and code of conduct..."
                      value={rulesText}
                      onChange={(val) => setRulesText(val)}
                      helperText="Use bullet points, numbered lists, or bold highlights"
                    />
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
                    <button type="button" onClick={() => setRegistrationType('PAID')} className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${registrationType === 'PAID' ? 'bg-orange-50/80 border-[#f97316] shadow-xs ring-2 ring-[#f97316]/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                      <Trophy className="w-5 h-5 mb-1.5 text-[#f97316]" />
                      <div className="text-sm font-bold text-slate-900">Paid Entry</div>
                      <div className="text-[11px] text-slate-500">Charge a registration fee</div>
                    </button>
                  </div>

                  {/* Contact Organization Box when Paid Entry is chosen */}
                  {registrationType === 'PAID' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-orange-50/90 via-white to-amber-50/80 border-2 border-orange-200 shadow-sm space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-[#ea580c] text-white shadow-xs shrink-0 mt-0.5">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900">Contact Organization for Paid Entry Setup</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-[#ea580c] border border-orange-200 uppercase">
                              Verification Required
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            Paid registration hackathons require merchant payment gateway setup and escrow verification by Hacker’s Unity. Click below to directly email our team with your <strong>auto-filled hackathon details</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white rounded-xl border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c]">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hacker&apos;s Unity Events Email</div>
                            <a
                              href={paidMailtoUrl}
                              className="text-xs font-black text-[#0099e6] hover:underline flex items-center gap-1 font-mono"
                            >
                              hackersunity.events@gmail.com
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('hackersunity.events@gmail.com');
                              setCopiedEmail(true);
                              setTimeout(() => setCopiedEmail(false), 2000);
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                            <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
                          </button>

                          <a
                            href={paidGmailWebUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 text-center cursor-pointer whitespace-nowrap"
                            title="Open pre-filled draft directly in Gmail on the web"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Open in Gmail (Web)</span>
                          </a>

                          <a
                            href={paidMailtoUrl}
                            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 text-center cursor-pointer whitespace-nowrap"
                            title="Open in Apple Mail, Outlook or default desktop mail app"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            <span>Mail App</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-orange-100/80">
                        <span>ℹ️ Includes title, dates, prize pool, format &amp; contact info.</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(paidEmailBodyText);
                            setCopiedTemplate(true);
                            setTimeout(() => setCopiedTemplate(false), 2000);
                          }}
                          className="text-[#0099e6] hover:underline font-semibold cursor-pointer"
                        >
                          {copiedTemplate ? '✓ Template Copied to Clipboard' : 'Copy Formatted Details'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Registration Capacity</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUnlimitedCapacity(!isUnlimitedCapacity);
                            if (!isUnlimitedCapacity) {
                              setRegistrationCapacity(null);
                            } else {
                              setRegistrationCapacity(500);
                            }
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                            isUnlimitedCapacity
                              ? 'bg-sky-100 text-[#0099e6]'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isUnlimitedCapacity ? '♾️ Unlimited' : 'Set to Unlimited'}
                        </button>
                      </div>

                      {isUnlimitedCapacity ? (
                        <div className="w-full px-3.5 py-2.5 bg-sky-50/80 border border-sky-200 rounded-xl text-xs font-bold text-[#0099e6] flex items-center justify-between animate-in fade-in">
                          <span className="flex items-center gap-1.5">
                            <span>♾️</span>
                            <span>Unlimited Registrations (Default)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsUnlimitedCapacity(false);
                              setRegistrationCapacity(500);
                            }}
                            className="text-[10px] text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                          >
                            Set capacity limit
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            min={10}
                            placeholder="e.g. 500"
                            value={registrationCapacity ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              setRegistrationCapacity(val);
                            }}
                            className="w-full pr-16 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsUnlimitedCapacity(true);
                              setRegistrationCapacity(null);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#0099e6] hover:underline cursor-pointer"
                          >
                            Unlimited
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registration Fields Selection */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block">
                            Registration Form Fields Setup
                          </label>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Mandatory fields are locked by default. Choose which optional fields hackers must provide.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedOptionalFields(AVAILABLE_OPTIONAL_FIELDS.map((f) => f.id))}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-50 text-[#0099e6] hover:bg-sky-100 border border-sky-200 cursor-pointer transition-colors"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOptionalFields([])}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white text-slate-500 hover:text-slate-800 border border-slate-200 cursor-pointer transition-colors"
                          >
                            Clear Optional
                          </button>
                        </div>
                      </div>

                      {/* 1. Mandatory Fields (Locked) */}
                      <div className="space-y-1.5 mb-4">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          <span>Mandatory Core Fields (Always Required)</span>
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                          {MANDATORY_REGISTRATION_FIELDS.map((field) => (
                            <div
                              key={field.id}
                              className="px-3 py-2 rounded-xl bg-white border-2 border-emerald-200/80 shadow-2xs flex items-center justify-between gap-1.5 select-none"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-sm">{field.icon}</span>
                                <span className="text-xs font-bold text-slate-800 truncate">{field.label}</span>
                              </div>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase shrink-0">
                                Req *
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. Optional Fields (Toggleable) */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#0099e6]" />
                          <span>Optional Additional Fields (Click to Enable / Disable)</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {AVAILABLE_OPTIONAL_FIELDS.map((field) => {
                            const isSelected = selectedOptionalFields.includes(field.id);
                            return (
                              <button
                                key={field.id}
                                type="button"
                                onClick={() => {
                                  setSelectedOptionalFields((prev) =>
                                    prev.includes(field.id)
                                      ? prev.filter((id) => id !== field.id)
                                      : [...prev, field.id]
                                  );
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                  isSelected
                                    ? 'bg-sky-50/80 border-[#0099e6] shadow-xs ring-1 ring-[#0099e6]/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-base">{field.icon}</span>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                                      <span>{field.label}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">{field.hint}</div>
                                  </div>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                    isSelected
                                      ? 'bg-[#0099e6] border-[#0099e6] text-white'
                                      : 'border-slate-300 bg-slate-50'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
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
                        <div><span className="text-slate-500">Organizer:</span> <span className="font-semibold text-slate-900">{hostType === 'COLLEGE' ? '🎓 ' : '🏢 '}{organizerName || '—'}</span></div>
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
                        <div><span className="text-slate-500">Type:</span> <span className={`font-semibold ${registrationType === 'PAID' ? 'text-[#ea580c]' : 'text-slate-900'}`}>{registrationType === 'PAID' ? 'Paid Entry (Verification Required)' : 'Free Entry'}</span></div>
                        <div><span className="text-slate-500">Capacity:</span> <span className="font-semibold text-slate-900">{isUnlimitedCapacity || !registrationCapacity ? '♾️ Unlimited' : `${registrationCapacity} Participants`}</span></div>
                        <div><span className="text-slate-500">Approval:</span> <span className="font-semibold text-slate-900">🔒 Manual (Default)</span></div>
                        <div><span className="text-slate-500">Custom Q&apos;s:</span> <span className="font-semibold text-slate-900">{customQuestions.length}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Notice Banner for Paid Hackathons */}
                  {registrationType === 'PAID' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/60 to-white border-2 border-amber-200/80 shadow-xs space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Paid Hackathon Verification & Escrow Notice</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Paid entry hackathons require organizer credential verification and payment gateway configuration by the Hacker&apos;s Unity team before going live. Clicking <strong>&quot;Submit Verification Request&quot;</strong> will save your hackathon with <span className="font-semibold text-amber-700">Verification Pending</span> status and provide you with instant pre-filled details to fast-track your launch.
                      </p>
                    </div>
                  )}

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
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isSaving || !title.trim()}
                      className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        registrationType === 'PAID'
                          ? 'bg-[#ea580c] hover:bg-[#c2410c] shadow-orange-500/20'
                          : 'bg-[#0099e6] hover:bg-[#0284c7] shadow-sky-500/20'
                      }`}
                    >
                      {registrationType === 'PAID' ? (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>{isSaving ? 'Submitting Request...' : isEditMode ? 'Save & Request Verification' : 'Submit Verification Request'}</span>
                        </>
                      ) : (
                        <>
                          {isEditMode ? <Save className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                          <span>{isSaving ? 'Saving Changes...' : isEditMode ? 'Save & Update Hackathon' : 'Publish Hackathon Live'}</span>
                        </>
                      )}
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

export default function HostHackathonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 text-[#0099e6] animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading Organizer Studio...</p>
        </div>
      }
    >
      <HostHackathonContent />
    </Suspense>
  );
}

