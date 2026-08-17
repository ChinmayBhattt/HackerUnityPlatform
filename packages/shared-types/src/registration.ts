// ─── Enums ───────────────────────────────────────────────

export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  WAITLISTED = 'WAITLISTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

// ─── Types ───────────────────────────────────────────────

export interface Registration {
  id: string;
  eventId: string;
  userId: string | null;
  teamId: string | null;
  status: RegistrationStatus;
  submissionUrl: string | null;
  answers: Record<string, unknown> | null;
  registeredAt: string;
}

// ─── DTOs ────────────────────────────────────────────────

export interface RegisterForEventDto {
  eventId: string;
  teamId?: string;
  answers?: Record<string, unknown>;
}

export interface MyRegistrationsParams {
  tab?: 'upcoming' | 'ongoing' | 'past' | 'withdrawn';
  page?: number;
  limit?: number;
}
