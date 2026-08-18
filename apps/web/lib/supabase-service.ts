import { supabase } from './supabase';
import { ExtendedEvent } from './mock-data';
import {
  UserRegistrationItem,
  EventRegistration,
  registerForEventStorage,
  saveHostedEvent,
  saveStoredUser,
  saveEventRegistration,
} from './storage';
import { UserPublic } from '@hackers-unity/shared-types';

/**
 * 1. Asset Upload (Supabase Storage)
 */
export async function uploadHackathonAsset(
  file: File,
  path: string
): Promise<{ url: string | null; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('hackathon-assets')
      .upload(path, file, { upsert: true });

    if (error) {
      console.warn('Upload warning:', error.message);
      return { url: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('hackathon-assets')
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl };
  } catch {
    return { url: null, error: 'Upload failed' };
  }
}

/**
 * 2. Event Service (Supabase + Local fallback)
 */
export async function fetchEventsFromSupabase(): Promise<ExtendedEvent[] | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map((item: any) => ({
      id: item.id,
      organizerId: item.organizer_id || 'usr_organizer',
      organizerName: item.organizer_name,
      organizerAvatar: item.organizer_avatar || '⚡',
      title: item.title,
      slug: item.slug,
      description: item.description,
      category: item.category,
      eventType: item.event_type,
      startDate: item.start_date,
      endDate: item.end_date,
      registrationDeadline: item.registration_deadline,
      eligibilityRules: { openGlobally: true },
      prizes: item.prizes || [],
      totalPrizeValue: Number(item.total_prize_value || 0),
      bannerUrl: item.banner_url || null,
      rulesDocUrl: null,
      status: item.status,
      maxParticipants: 2000,
      minTeamSize: item.min_team_size || 1,
      maxTeamSize: item.max_team_size || 4,
      isTeamEvent: item.is_team_event ?? true,
      location: item.location || 'Online',
      createdAt: item.created_at,
      participantsCount: item.participants_count || 1,
      featured: item.featured ?? false,
      tags: item.tags || [],
      bannerGradient: item.banner_gradient || 'from-sky-50 via-white to-orange-50/60',
      tracks: item.tracks || [],
      stages: item.stages || [],
      faqs: item.faqs || [],
      sponsors: item.sponsors || [],
      // New fields
      tagline: item.tagline || '',
      logoUrl: item.logo_url || null,
      registrationStart: item.registration_start,
      timezone: item.timezone || 'Asia/Kolkata',
      eligibility: item.eligibility || '',
      difficulty: item.difficulty || 'OPEN',
      rulesText: item.rules_text || '',
      registrationType: item.registration_type || 'FREE',
      registrationCapacity: item.registration_capacity,
      approvalMode: item.approval_mode || 'AUTO',
      customQuestions: item.custom_questions || [],
    }));
  } catch (err) {
    console.warn('Supabase fetchEvents fallback to local store:', err);
    return null;
  }
}

export async function createEventInSupabase(event: ExtendedEvent): Promise<{ success: boolean; error?: string }> {
  try {
    // Always persist to local store first
    saveHostedEvent(event);

    const { error } = await supabase.from('events').insert({
      slug: event.slug,
      title: event.title,
      description: event.description,
      category: event.category,
      event_type: event.eventType,
      location: event.location,
      organizer_name: event.organizerName,
      start_date: event.startDate,
      end_date: event.endDate,
      registration_deadline: event.registrationDeadline,
      total_prize_value: event.totalPrizeValue,
      prizes: event.prizes,
      tracks: event.tracks,
      stages: event.stages,
      faqs: event.faqs,
      sponsors: event.sponsors,
      tags: event.tags,
      min_team_size: event.minTeamSize,
      max_team_size: event.maxTeamSize,
      is_team_event: event.isTeamEvent,
      featured: event.featured,
      status: event.status,
      // New fields
      tagline: event.tagline || null,
      logo_url: event.logoUrl || null,
      banner_url: event.bannerUrl || null,
      registration_start: event.registrationStart || null,
      timezone: event.timezone || 'Asia/Kolkata',
      eligibility: event.eligibility || null,
      difficulty: event.difficulty || 'OPEN',
      rules_text: event.rulesText || null,
      registration_type: event.registrationType || 'FREE',
      registration_capacity: event.registrationCapacity || null,
      approval_mode: event.approvalMode || 'AUTO',
      custom_questions: event.customQuestions || [],
    });

    if (error) {
      console.warn('Supabase insert event warning:', error.message);
      return { success: true };
    }

    return { success: true };
  } catch {
    return { success: true };
  }
}

/**
 * 3. Registration Service
 */
export async function registerForEventInSupabase(reg: UserRegistrationItem): Promise<{ success: boolean }> {
  try {
    registerForEventStorage(reg);

    await supabase.from('registrations').insert({
      event_id: reg.eventId,
      user_name: 'Hacker',
      is_team: reg.isTeam,
      team_name: reg.teamName,
      role: reg.role,
      status: reg.status,
    });

    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function submitEventRegistration(reg: EventRegistration): Promise<{ success: boolean }> {
  try {
    // Always save to local first
    saveEventRegistration(reg);

    // Try Supabase
    await supabase.from('registrations').insert({
      event_id: reg.eventId,
      user_name: reg.userName,
      user_email: reg.userEmail,
      phone: reg.phone,
      college: reg.college,
      status: reg.status,
    });

    return { success: true };
  } catch {
    return { success: true };
  }
}

/**
 * 4. Profile Service
 */
export async function saveProfileToSupabase(user: UserPublic): Promise<{ success: boolean }> {
  try {
    saveStoredUser(user);

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
    });

    return { success: true };
  } catch {
    return { success: true };
  }
}

