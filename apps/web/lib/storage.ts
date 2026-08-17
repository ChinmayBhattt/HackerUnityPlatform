import { ExtendedEvent, MOCK_EVENTS } from './mock-data';
import { UserPublic, UserRole } from '@hackers-unity/shared-types';

export interface UserRegistrationItem {
  eventId: string;
  eventName: string;
  registeredAt: string;
  teamName?: string;
  isTeam: boolean;
  role: string;
  status: 'CONFIRMED' | 'SUBMITTED' | 'UNDER_REVIEW';
}

const STORAGE_KEYS = {
  BOOKMARKS: 'hackers_unity_bookmarks',
  REGISTRATIONS: 'hackers_unity_registrations',
  HOSTED_EVENTS: 'hackers_unity_hosted_events',
  USER_PROFILE: 'hackers_unity_user_profile',
  INVITES: 'hackers_unity_invites',
};

export const DEFAULT_USER: UserPublic = {
  id: 'usr_me',
  name: 'Chinmay Bhatt',
  email: 'chinmay@hackersunity.dev',
  phone: '+91 99887 76655',
  role: UserRole.PARTICIPANT,
  college: 'Computer Science & AI Institute',
  organization: 'Hackers Unity Core',
  graduationYear: 2026,
  bio: 'Fullstack builder, AI agent enthusiast, and competitive hackathon winner.',
  avatarUrl: '⚡',
  skills: ['Next.js 16', 'TypeScript', 'Node.js', 'PyTorch', 'TailwindCSS', 'PostgreSQL'],
  resumeUrl: null,
  socialLinks: {
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    portfolio: 'https://hackersunity.dev',
  },
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
};

// Bookmarks
export function getBookmarkedEventIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmarkEvent(eventId: string): string[] {
  if (typeof window === 'undefined') return [];
  const current = getBookmarkedEventIds();
  const exists = current.includes(eventId);
  const updated = exists ? current.filter((id) => id !== eventId) : [...current, eventId];
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
  return updated;
}

// Registrations
export function getMyRegistrations(): UserRegistrationItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerForEventStorage(reg: UserRegistrationItem): void {
  if (typeof window === 'undefined') return;
  const current = getMyRegistrations();
  const filtered = current.filter((item) => item.eventId !== reg.eventId);
  const updated = [reg, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}

// Custom Hosted Events
export function getCustomEvents(): ExtendedEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOSTED_EVENTS);
    if (!raw) return [];
    const parsed: ExtendedEvent[] = JSON.parse(raw);
    return parsed.filter(
      (e) =>
        e &&
        e.title &&
        !e.title.toLowerCase().includes('global autonomous ai sprint') &&
        !e.id?.includes('global-autonomous')
    );
  } catch {
    return [];
  }
}

export function saveHostedEvent(event: ExtendedEvent): void {
  if (typeof window === 'undefined') return;
  const current = getCustomEvents();
  const updated = [event, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.HOSTED_EVENTS, JSON.stringify(updated));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}

export function getAllEvents(): ExtendedEvent[] {
  const custom = getCustomEvents();
  return [...custom, ...MOCK_EVENTS];
}

export function getEventBySlug(slug: string): ExtendedEvent | undefined {
  const all = getAllEvents();
  return all.find((e) => e.slug === slug || e.id === slug);
}

// User Profile
export function getStoredUser(): UserPublic | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: UserPublic): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    window.dispatchEvent(new Event('hackers_unity_storage_change'));
  } catch (e) {
    console.error(e);
  }
}
