import { supabase } from './supabase';
import { ExtendedEvent, MOCK_EVENTS } from './mock-data';
import {
  UserPublic,
  EventStatus,
  EventCategory,
  EventType,
} from '@hackers-unity/shared-types';

/**
 * ─── HELPER: MAP DATABASE EVENT ROW TO EXTENDED EVENT ─────────────────────────
 */
export function mapDbEventToExtended(item: any): ExtendedEvent {
  const isTeam = item.is_team_event ?? true;
  const minTeam = Number(item.min_team_size || (isTeam ? 2 : 1));
  const maxTeam = Number(item.max_team_size || (isTeam ? 4 : 1));
  const teamSizeDisplay = minTeam === maxTeam ? `${minTeam}` : `${minTeam}-${maxTeam}`;

  const prizeVal = Number(item.total_prize_value || 0);
  const formattedPrize = prizeVal > 0 ? (item.prize || `$${prizeVal.toLocaleString()}`) : 'Perks & Swag';

  return {
    id: item.id,
    organizerId: item.organizer_id || 'usr_organizer',
    organizerName: item.organizer_name || "Hacker's Unity",
    organizerAvatar: item.organizer_avatar || '⚡',
    organizerLogo: item.logo_url || '',
    title: item.title,
    name: item.title,
    slug: item.slug,
    description: item.description || '',
    category: (item.category as EventCategory) || EventCategory.HACKATHON,
    eventType: (item.event_type as EventType) || EventType.ONLINE,
    mode: item.event_type === EventType.ONLINE ? 'Online' : item.event_type === EventType.OFFLINE ? 'In-Person' : 'Hybrid',
    startDate: item.start_date,
    endDate: item.end_date,
    registrationDeadline: item.registration_deadline,
    eligibilityRules: {
      teamSize: isTeam ? `${teamSizeDisplay} Members` : 'Individual',
      eligibility: item.eligibility || 'Open worldwide to developers and builders',
    },
    prizes: item.prizes || [],
    totalPrizeValue: prizeVal,
    prize: formattedPrize,
    prizeAmount: prizeVal,
    bannerUrl: item.banner_url || item.image || null,
    image: item.image || item.banner_url || null,
    logoUrl: item.logo_url || null,
    rulesDocUrl: item.rules_doc_url || null,
    registrationLink: item.registration_link || null,
    status: (item.status as EventStatus) || EventStatus.PUBLISHED,
    maxParticipants: item.max_participants || 2000,
    minTeamSize: minTeam,
    maxTeamSize: maxTeam,
    teamSize: isTeam ? teamSizeDisplay : 'Individual',
    isTeamEvent: isTeam,
    location: item.location || 'Online',
    createdAt: item.created_at || new Date().toISOString(),
    participantsCount: item.registration_count || item.participants_count || 1,
    participantsDisplay: `${item.registration_count || item.participants_count || 1}+`,
    featured: Boolean(item.featured),
    tags: item.tags || ['Hackathon', 'Innovation'],
    bannerGradient: item.banner_gradient || 'from-sky-950/60 via-slate-900/80 to-black',
    tracks: item.tracks || [],
    stages: item.stages || [],
    faqs: item.faqs || [],
    sponsors: item.sponsors || [],
    tagline: item.tagline || item.short_description || '',
    timezone: item.timezone || 'Asia/Kolkata',
    eligibility: item.eligibility || 'Open to all builders',
    difficulty: item.difficulty || 'OPEN',
    rulesText: item.rules_text || '',
    registrationType: item.registration_type || 'FREE',
    registrationCapacity: item.registration_capacity || null,
    approvalMode: item.approval_mode || 'AUTO',
    customQuestions: item.custom_questions || [],
  };
}

/**
 * ─── 1. SLUG GENERATOR ────────────────────────────────────────────────────────
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title) || 'hackathon';
  try {
    const { data } = await supabase
      .from('events')
      .select('slug')
      .ilike('slug', `${baseSlug}%`);

    if (!data || data.length === 0) {
      return baseSlug;
    }

    const existingSlugs = new Set(data.map((row: any) => row.slug));
    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let counter = 1;
    while (existingSlugs.has(`${baseSlug}-${counter}`)) {
      counter++;
    }
    return `${baseSlug}-${counter}`;
  } catch {
    return `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }
}

/**
 * ─── 2. ASSET UPLOAD (Supabase Storage) ───────────────────────────────────────
 */
export async function uploadHackathonAsset(
  file: File,
  folder: 'logos' | 'banners' | 'general' = 'general'
): Promise<{ url: string | null; error?: string }> {
  try {
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('hackathon-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return { url: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('hackathon-assets')
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    return { url: null, error: err.message || 'Upload failed' };
  }
}

/**
 * ─── 3. EVENT QUERIES ─────────────────────────────────────────────────────────
 */
export async function fetchPublishedEvents(): Promise<ExtendedEvent[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('status', ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'])
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchPublishedEvents error:', error.message);
      return MOCK_EVENTS;
    }

    if (!data || data.length === 0) {
      return MOCK_EVENTS;
    }

    return data.map(mapDbEventToExtended);
  } catch (err) {
    console.warn('Supabase fetchPublishedEvents exception:', err);
    return MOCK_EVENTS;
  }
}

export async function fetchEventBySlug(slugOrId: string): Promise<ExtendedEvent | null> {
  try {
    // Try matching slug or id
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`slug.eq."${slugOrId}",id.eq."${slugOrId}"`)
      .single();

    if (error || !data) {
      // Fallback to mock search
      const found = MOCK_EVENTS.find((e) => e.slug === slugOrId || e.id === slugOrId);
      return found || null;
    }

    return mapDbEventToExtended(data);
  } catch {
    const found = MOCK_EVENTS.find((e) => e.slug === slugOrId || e.id === slugOrId);
    return found || null;
  }
}

export async function fetchOrganizerEvents(organizerId: string): Promise<ExtendedEvent[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(mapDbEventToExtended);
  } catch {
    return [];
  }
}

/**
 * ─── 4. EVENT MUTATIONS ───────────────────────────────────────────────────────
 */
export async function createEventInSupabase(
  event: Partial<ExtendedEvent>,
  userId?: string
): Promise<{ success: boolean; data?: ExtendedEvent; error?: string }> {
  try {
    const finalSlug = event.slug || (await generateUniqueSlug(event.title || 'untitled-hackathon'));

    const insertPayload: any = {
      slug: finalSlug,
      title: event.title || 'Untitled Hackathon',
      description: event.description || '',
      category: event.category || 'HACKATHON',
      event_type: event.eventType || 'ONLINE',
      location: event.location || 'Online',
      organizer_id: userId || null,
      organizer_name: event.organizerName || 'Organizer',
      organizer_avatar: event.organizerAvatar || '⚡',
      start_date: event.startDate || new Date().toISOString(),
      end_date: event.endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      registration_deadline: event.registrationDeadline || new Date().toISOString(),
      total_prize_value: Number(event.totalPrizeValue || 0),
      prizes: event.prizes || [],
      tracks: event.tracks || [],
      stages: event.stages || [],
      faqs: event.faqs || [],
      sponsors: event.sponsors || [],
      tags: event.tags || [],
      min_team_size: event.minTeamSize || 1,
      max_team_size: event.maxTeamSize || 4,
      is_team_event: event.isTeamEvent ?? true,
      featured: Boolean(event.featured),
      status: event.status || EventStatus.PUBLISHED,
      tagline: event.tagline || '',
      logo_url: event.logoUrl || null,
      banner_url: event.bannerUrl || event.image || null,
      registration_start: event.registrationStart || null,
      timezone: event.timezone || 'Asia/Kolkata',
      eligibility: event.eligibility || null,
      difficulty: event.difficulty || 'OPEN',
      rules_text: event.rulesText || null,
      registration_type: event.registrationType || 'FREE',
      registration_capacity: event.registrationCapacity || null,
      approval_mode: event.approvalMode || 'AUTO',
      custom_questions: event.customQuestions || [],
      registration_count: 0,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      console.warn('Supabase event creation error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: mapDbEventToExtended(data) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Creation failed' };
  }
}

export async function updateEventInSupabase(
  eventId: string,
  updates: Partial<ExtendedEvent>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updatePayload: any = {};
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.eventType !== undefined) updatePayload.event_type = updates.eventType;
    if (updates.location !== undefined) updatePayload.location = updates.location;
    if (updates.startDate !== undefined) updatePayload.start_date = updates.startDate;
    if (updates.endDate !== undefined) updatePayload.end_date = updates.endDate;
    if (updates.registrationDeadline !== undefined) updatePayload.registration_deadline = updates.registrationDeadline;
    if (updates.totalPrizeValue !== undefined) updatePayload.total_prize_value = updates.totalPrizeValue;
    if (updates.prizes !== undefined) updatePayload.prizes = updates.prizes;
    if (updates.tracks !== undefined) updatePayload.tracks = updates.tracks;
    if (updates.stages !== undefined) updatePayload.stages = updates.stages;
    if (updates.faqs !== undefined) updatePayload.faqs = updates.faqs;
    if (updates.sponsors !== undefined) updatePayload.sponsors = updates.sponsors;
    if (updates.tags !== undefined) updatePayload.tags = updates.tags;
    if (updates.minTeamSize !== undefined) updatePayload.min_team_size = updates.minTeamSize;
    if (updates.maxTeamSize !== undefined) updatePayload.max_team_size = updates.maxTeamSize;
    if (updates.isTeamEvent !== undefined) updatePayload.is_team_event = updates.isTeamEvent;
    if (updates.featured !== undefined) updatePayload.featured = updates.featured;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.tagline !== undefined) updatePayload.tagline = updates.tagline;
    if (updates.logoUrl !== undefined) updatePayload.logo_url = updates.logoUrl;
    if (updates.bannerUrl !== undefined) updatePayload.banner_url = updates.bannerUrl;
    if (updates.eligibility !== undefined) updatePayload.eligibility = updates.eligibility;
    if (updates.difficulty !== undefined) updatePayload.difficulty = updates.difficulty;
    if (updates.rulesText !== undefined) updatePayload.rules_text = updates.rulesText;
    if (updates.customQuestions !== undefined) updatePayload.custom_questions = updates.customQuestions;
    updatePayload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', eventId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Update failed' };
  }
}

export async function deleteEventInSupabase(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Delete failed' };
  }
}

/**
 * ─── 5. REGISTRATION OPERATIONS ───────────────────────────────────────────────
 */
export interface RegistrationInput {
  eventId: string;
  userId?: string | null;
  userName: string;
  userEmail: string;
  phone?: string;
  college?: string;
  city?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
  customAnswers?: Record<string, string>;
  isTeam?: boolean;
  teamName?: string;
  teamId?: string;
  role?: string;
  status?: 'CONFIRMED' | 'PENDING';
}

export async function checkUserRegistration(
  eventId: string,
  userId?: string | null,
  email?: string
): Promise<{ isRegistered: boolean; registration?: any }> {
  try {
    if (userId) {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (data) return { isRegistered: true, registration: data };
    }

    if (email) {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_email', email)
        .maybeSingle();

      if (data) return { isRegistered: true, registration: data };
    }

    return { isRegistered: false };
  } catch {
    return { isRegistered: false };
  }
}

export async function registerForEventSupabase(
  input: RegistrationInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already registered
    const { isRegistered } = await checkUserRegistration(input.eventId, input.userId, input.userEmail);
    if (isRegistered) {
      return { success: false, error: 'You are already registered for this event.' };
    }

    const payload: any = {
      event_id: input.eventId,
      user_id: input.userId || null,
      user_name: input.userName,
      user_email: input.userEmail,
      phone: input.phone || null,
      college: input.college || null,
      city: input.city || null,
      github_url: input.githubUrl || null,
      linkedin_url: input.linkedinUrl || null,
      skills: input.skills || [],
      custom_answers: input.customAnswers || {},
      is_team: Boolean(input.isTeam),
      team_name: input.teamName || null,
      role: input.role || (input.isTeam ? 'Team Leader' : 'Individual Hacker'),
      status: input.status || 'CONFIRMED',
      registered_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('registrations').insert(payload);

    if (error) {
      console.warn('Supabase registration error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed' };
  }
}

export async function fetchEventRegistrations(eventId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function fetchUserRegistrations(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*, events(*)')
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * ─── 6. TEAMS & SQUADS OPERATIONS ─────────────────────────────────────────────
 */
export async function createTeamSupabase(
  eventId: string,
  leaderId: string,
  teamName: string,
  maxMembers: number = 4,
  description?: string
): Promise<{ success: boolean; team?: any; error?: string }> {
  try {
    // 1. Create team record
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: teamName,
        event_id: eventId,
        leader_id: leaderId,
        max_members: maxMembers,
        description: description || '',
      })
      .select('*')
      .single();

    if (teamError || !team) {
      return { success: false, error: teamError?.message || 'Failed to create team' };
    }

    // 2. Add leader to team_members
    try {
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: leaderId,
        role: 'LEADER',
        status: 'ACCEPTED',
      });
    } catch (e) {
      console.warn('team_members table insert non-fatal:', e);
    }

    return { success: true, team };
  } catch (err: any) {
    return { success: false, error: err.message || 'Team creation failed' };
  }
}

export async function fetchEventTeams(eventId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url))')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function joinTeamSupabase(
  teamId: string,
  userId: string,
  maxMembers: number = 4
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check team member count
    const { data: members } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId);

    if (members && members.length >= maxMembers) {
      return { success: false, error: 'This team has already reached its maximum capacity.' };
    }

    const { error } = await supabase.from('team_members').insert({
      team_id: teamId,
      user_id: userId,
      role: 'MEMBER',
      status: 'ACCEPTED',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to join team' };
  }
}

/**
 * ─── 7. REALTIME SUBSCRIPTION HELPERS ─────────────────────────────────────────
 */
export function subscribeToPublishedEvents(onEventChange: () => void): () => void {
  try {
    const channel = supabase
      .channel('public:events_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          onEventChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Realtime subscription error:', e);
    return () => {};
  }
}

export function subscribeToEventDetails(
  eventIdOrSlug: string,
  onUpdate: () => void
): () => void {
  try {
    const channel = supabase
      .channel(`public:event_${eventIdOrSlug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

/**
 * ─── 8. PROFILE OPERATIONS ────────────────────────────────────────────────────
 */
export async function saveProfileToSupabase(user: UserPublic): Promise<{ success: boolean }> {
  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      college: user.college,
      organization: user.organization,
      bio: user.bio,
      skills: user.skills,
      github_url: user.socialLinks?.github,
      linkedin_url: user.socialLinks?.linkedin,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  } catch {
    return { success: true };
  }
}
