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
  if (!slugOrId) return null;
  const decoded = decodeURIComponent(slugOrId).trim();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded);

    let data: any = null;

    if (isUuid) {
      const res = await supabase
        .from('events')
        .select('*')
        .or(`id.eq.${decoded},slug.eq.${decoded}`)
        .maybeSingle();
      data = res.data;
    } else {
      // Query by slug without touching the UUID id column
      const res = await supabase
        .from('events')
        .select('*')
        .eq('slug', decoded)
        .maybeSingle();
      data = res.data;

      // Fallback to case-insensitive match if needed
      if (!data) {
        const ilikeRes = await supabase
          .from('events')
          .select('*')
          .ilike('slug', decoded)
          .maybeSingle();
        data = ilikeRes.data;
      }
    }

    if (!data) {
      // Fallback to mock search
      const found = MOCK_EVENTS.find(
        (e) => e.slug === decoded || e.id === decoded || e.slug.toLowerCase() === decoded.toLowerCase()
      );
      return found || null;
    }

    return mapDbEventToExtended(data);
  } catch (err) {
    console.warn('fetchEventBySlug exception:', err);
    const found = MOCK_EVENTS.find(
      (e) => e.slug === decoded || e.id === decoded || e.slug.toLowerCase() === decoded.toLowerCase()
    );
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

    const createdEvent = mapDbEventToExtended(data);

    // Instant Realtime Broadcast to all connected clients/browsers
    try {
      const channel = supabase.channel('public:events_realtime');
      channel.send({
        type: 'broadcast',
        event: 'event_created',
        payload: { event: createdEvent },
      });
    } catch (e) {
      console.warn('Broadcast send error:', e);
    }

    return { success: true, data: createdEvent };
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

    try {
      const channel = supabase.channel('public:events_realtime');
      channel.send({
        type: 'broadcast',
        event: 'event_updated',
        payload: { eventId, updates },
      });
    } catch (e) {
      console.warn('Broadcast send error:', e);
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

    try {
      const channel = supabase.channel('public:events_realtime');
      channel.send({
        type: 'broadcast',
        event: 'event_deleted',
        payload: { eventId },
      });
    } catch (e) {
      console.warn('Broadcast send error:', e);
    }

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

    // Realtime Broadcast registration to update counters everywhere
    try {
      const channel = supabase.channel('public:events_realtime');
      channel.send({
        type: 'broadcast',
        event: 'registration_created',
        payload: { eventId: input.eventId, userEmail: input.userEmail },
      });
    } catch (e) {
      console.warn('Broadcast registration error:', e);
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
 * ─── 5.5 BOOKMARK OPERATIONS ──────────────────────────────────────────────────
 */
export async function fetchUserBookmarks(userId: string): Promise<string[]> {
  try {
    if (!userId) return [];
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return [];

    const { data, error } = await supabase
      .from('bookmarks')
      .select('event_id, events(slug)')
      .eq('user_id', userId);

    if (error || !data) {
      console.warn('fetchUserBookmarks error:', error?.message);
      return [];
    }

    const ids: string[] = [];
    data.forEach((row: any) => {
      if (row.event_id) ids.push(row.event_id);
      if (row.events?.slug) ids.push(row.events.slug);
    });

    return Array.from(new Set(ids));
  } catch (err) {
    console.warn('fetchUserBookmarks exception:', err);
    return [];
  }
}

export async function toggleBookmarkInSupabase(
  userId: string,
  eventIdOrSlug: string
): Promise<{ isBookmarked: boolean; error?: string }> {
  try {
    if (!userId) return { isBookmarked: false, error: 'User not authenticated' };
    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUserUuid) return { isBookmarked: false, error: 'Invalid user ID' };

    let targetEventId = eventIdOrSlug;
    const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventIdOrSlug);

    // If not a UUID, resolve event UUID by slug
    if (!isEventUuid) {
      const { data: eventData } = await supabase
        .from('events')
        .select('id')
        .eq('slug', eventIdOrSlug)
        .maybeSingle();

      if (eventData?.id) {
        targetEventId = eventData.id;
      } else {
        return { isBookmarked: false, error: 'Event not found in database' };
      }
    }

    // Check if bookmark already exists
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', targetEventId)
      .maybeSingle();

    if (existing) {
      // Delete bookmark
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.warn('Delete bookmark error:', deleteError.message);
        return { isBookmarked: true, error: deleteError.message };
      }
      return { isBookmarked: false };
    } else {
      // Ensure user profile exists in profiles table before inserting bookmark
      try {
        await supabase.from('profiles').upsert(
          { id: userId, updated_at: new Date().toISOString() },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      } catch (e) {
        console.warn('Profile ensure before bookmark:', e);
      }

      // Insert bookmark
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          event_id: targetEventId,
        });

      if (insertError) {
        console.warn('Insert bookmark error:', insertError.message);
        return { isBookmarked: false, error: insertError.message };
      }
      return { isBookmarked: true };
    }
  } catch (err: any) {
    console.warn('toggleBookmarkInSupabase exception:', err);
    return { isBookmarked: false, error: err.message || 'Bookmark toggle failed' };
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
 * ─── 6.5 TEAM INVITATIONS ─────────────────────────────────────────────────────
 */

/**
 * Send a team invite to an email address
 */
export async function sendTeamInvite(
  teamId: string,
  eventId: string,
  invitedByUserId: string,
  invitedEmail: string
): Promise<{ success: boolean; invite?: any; inviteLink?: string; error?: string }> {
  try {
    // Check if invite already exists for this email + team
    const { data: existing } = await supabase
      .from('team_invitations')
      .select('id, status, invite_token')
      .eq('team_id', teamId)
      .eq('invited_email', invitedEmail.toLowerCase().trim())
      .maybeSingle();

    // Fetch team and event metadata for link and email
    const { data: teamData } = await supabase
      .from('teams')
      .select('name, events(id, title, slug)')
      .eq('id', teamId)
      .maybeSingle();

    const { data: profileData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', invitedByUserId)
      .maybeSingle();

    const teamName = teamData?.name || 'Squad';
    const eventSlug = (teamData?.events as any)?.slug || eventId;
    const eventTitle = (teamData?.events as any)?.title || 'Hackathon';
    const inviterName = profileData?.name || 'A teammate';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    let inviteRecord: any = null;

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return { success: false, error: 'This person has already accepted the invite and is on the team.' };
      }
      if (existing.status === 'PENDING') {
        // Already pending, still resend the email
        inviteRecord = existing;
      } else {
        // If DECLINED or EXPIRED, update to PENDING again
        const { data: updated, error: updateErr } = await supabase
          .from('team_invitations')
          .update({
            status: 'PENDING',
            responded_at: null,
            invited_by: invitedByUserId,
          })
          .eq('id', existing.id)
          .select('*')
          .single();

        if (updateErr) {
          return { success: false, error: updateErr.message };
        }
        inviteRecord = updated;
      }
    } else {
      // Create new invite
      const { data: invite, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          event_id: eventId,
          invited_by: invitedByUserId,
          invited_email: invitedEmail.toLowerCase().trim(),
          status: 'PENDING',
        })
        .select('*')
        .single();

      if (error || !invite) {
        return { success: false, error: error?.message || 'Failed to create invite' };
      }
      inviteRecord = invite;
    }

    const inviteLink = `${origin}/hackathons/${eventSlug}/invite?token=${inviteRecord.invite_token}`;

    // Dispatch email via API route
    try {
      if (typeof window !== 'undefined') {
        fetch('/api/invite-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: invitedEmail.toLowerCase().trim(),
            teamName,
            hackathonTitle: eventTitle,
            hackathonSlug: eventSlug,
            invitedByName: inviterName,
            inviteToken: inviteRecord.invite_token,
            origin,
          }),
        }).catch((e) => console.warn('Email dispatch warning:', e));
      }
    } catch (e) {
      console.warn('Could not trigger invite email:', e);
    }

    return { success: true, invite: inviteRecord, inviteLink };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send invite' };
  }
}

/**
 * Fetch all invites for a specific team (leader view)
 */
export async function fetchTeamInvites(teamId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, profiles:invited_by(name, email, avatar_url)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Fetch all pending invites for a user by their email
 */
export async function fetchPendingInvitesForUser(email: string): Promise<any[]> {
  try {
    if (!email) return [];
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, teams(id, name, event_id, leader_id, description, profiles:leader_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date)')
      .eq('invited_email', email.toLowerCase().trim())
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Get invite details by token (for the accept page)
 */
export async function getInviteByToken(token: string): Promise<{ invite: any | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, teams(id, name, event_id, leader_id, description, max_members, profiles:leader_id(name, email, avatar_url), team_members(id, user_id, role, profiles:user_id(name, email, avatar_url))), events(id, title, slug, start_date, end_date, banner_url, location)')
      .eq('invite_token', token)
      .maybeSingle();

    if (error) return { invite: null, error: error.message };
    if (!data) return { invite: null, error: 'Invite not found or has expired.' };

    return { invite: data };
  } catch (err: any) {
    return { invite: null, error: err.message || 'Failed to fetch invite' };
  }
}

/**
 * Accept a team invite by token
 */
export async function acceptTeamInvite(
  inviteToken: string,
  userId: string
): Promise<{ success: boolean; teamId?: string; eventSlug?: string; error?: string }> {
  try {
    // 1. Get the invite
    const { invite, error: fetchErr } = await getInviteByToken(inviteToken);
    if (fetchErr || !invite) {
      return { success: false, error: fetchErr || 'Invite not found.' };
    }

    if (invite.status !== 'PENDING') {
      return { success: false, error: `This invite has already been ${invite.status.toLowerCase()}.` };
    }

    const team = invite.teams;
    if (!team) {
      return { success: false, error: 'Team not found.' };
    }

    // 2. Check team capacity
    const currentMembers = team.team_members?.length || 0;
    const maxMembers = team.max_members || 4;
    if (currentMembers >= maxMembers) {
      return { success: false, error: 'This team has already reached its maximum capacity.' };
    }

    // 3. Check if user is already a member
    const isAlreadyMember = team.team_members?.some((m: any) => m.user_id === userId);
    if (isAlreadyMember) {
      // Mark invite as accepted anyway
      await supabase
        .from('team_invitations')
        .update({ status: 'ACCEPTED', responded_at: new Date().toISOString() })
        .eq('invite_token', inviteToken);

      return { success: true, teamId: team.id, eventSlug: invite.events?.slug };
    }

    // 4. Add user to team_members
    const { error: joinErr } = await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      role: 'MEMBER',
      status: 'ACCEPTED',
    });

    if (joinErr) {
      return { success: false, error: joinErr.message };
    }

    // 5. Update invite status
    await supabase
      .from('team_invitations')
      .update({ status: 'ACCEPTED', responded_at: new Date().toISOString() })
      .eq('invite_token', inviteToken);

    return {
      success: true,
      teamId: team.id,
      eventSlug: invite.events?.slug,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to accept invite' };
  }
}

/**
 * Decline a team invite by token
 */
export async function declineTeamInvite(
  inviteToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'DECLINED', responded_at: new Date().toISOString() })
      .eq('invite_token', inviteToken)
      .eq('status', 'PENDING');

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to decline invite' };
  }
}

/**
 * Leave a team (remove self from team_members)
 */
export async function leaveTeam(
  teamId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is leader — leaders can't leave (must delete team)
    const { data: team } = await supabase
      .from('teams')
      .select('leader_id')
      .eq('id', teamId)
      .maybeSingle();

    if (team?.leader_id === userId) {
      return { success: false, error: 'Team leaders cannot leave their own team. Delete the team instead.' };
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) return { success: false, error: error.message };

    // Also update any corresponding invite
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (userProfile?.email) {
      await supabase
        .from('team_invitations')
        .update({ status: 'DECLINED', responded_at: new Date().toISOString() })
        .eq('team_id', teamId)
        .eq('invited_email', userProfile.email);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to leave team' };
  }
}

/**
 * Fetch full team details with all members (for team view)
 */
export async function fetchTeamWithMembers(teamId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), team_invitations(id, invited_email, status, created_at)')
      .eq('id', teamId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch all teams a user is part of (for dashboard)
 */
export async function fetchUserTeams(userId: string): Promise<any[]> {
  try {
    if (!userId) return [];

    // Get team IDs the user is a member of
    const { data: memberRows, error: memberErr } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (memberErr || !memberRows || memberRows.length === 0) return [];

    const teamIds = memberRows.map((r: any) => r.team_id);

    // Fetch full team details
    const { data: teams, error: teamErr } = await supabase
      .from('teams')
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date), team_invitations(id, invited_email, status, created_at)')
      .in('id', teamIds)
      .order('created_at', { ascending: false });

    if (teamErr || !teams) return [];
    return teams;
  } catch {
    return [];
  }
}

/**
 * ─── 7. REALTIME SUBSCRIPTION HELPERS ─────────────────────────────────────────
 */
export function subscribeToPublishedEvents(onEventChange: (payload?: any) => void): () => void {
  try {
    // Remove any existing channel with the same name first to prevent
    // "cannot add callbacks after subscribe()" errors on React StrictMode re-mounts
    const channelName = 'public:events_realtime';
    const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(channelName)
      // Listen to instant client-to-client Broadcasts
      .on('broadcast', { event: 'event_created' }, (payload) => {
        onEventChange(payload);
      })
      .on('broadcast', { event: 'event_updated' }, (payload) => {
        onEventChange(payload);
      })
      .on('broadcast', { event: 'event_deleted' }, (payload) => {
        onEventChange(payload);
      })
      .on('broadcast', { event: 'registration_created' }, (payload) => {
        onEventChange(payload);
      })
      // Listen to direct Postgres DB changes
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
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
  onUpdate: (payload?: any) => void
): () => void {
  try {
    const channelName = `public:event_${eventIdOrSlug}`;
    const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(channelName)
      // Broadcast events
      .on('broadcast', { event: 'event_updated' }, (payload) => {
        onUpdate(payload);
      })
      .on('broadcast', { event: 'registration_created' }, (payload) => {
        onUpdate(payload);
      })
      .on('broadcast', { event: 'team_created' }, (payload) => {
        onUpdate(payload);
      })
      // Postgres changes
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
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
