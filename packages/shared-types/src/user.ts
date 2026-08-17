import { UserRole } from './auth';

// ─── User types ──────────────────────────────────────────

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  college: string | null;
  organization: string | null;
  graduationYear: number | null;
  bio: string | null;
  avatarUrl: string | null;
  skills: string[];
  resumeUrl: string | null;
  socialLinks: SocialLinks | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
  twitter?: string;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  college?: string;
  organization?: string;
  graduationYear?: number;
  bio?: string;
  skills?: string[];
  socialLinks?: SocialLinks;
}

// ─── Organizer Profile ───────────────────────────────────

export enum OrganizationType {
  COLLEGE = 'COLLEGE',
  COMPANY = 'COMPANY',
  COMMUNITY = 'COMMUNITY',
}

export interface OrganizerProfile {
  id: string;
  userId: string;
  organizationName: string;
  organizationType: OrganizationType;
  verified: boolean;
  logoUrl: string | null;
  description: string | null;
}
