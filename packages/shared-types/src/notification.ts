// ─── Enums ───────────────────────────────────────────────

export enum NotificationType {
  REGISTRATION_CONFIRMED = 'REGISTRATION_CONFIRMED',
  REGISTRATION_WAITLISTED = 'REGISTRATION_WAITLISTED',
  REGISTRATION_REJECTED = 'REGISTRATION_REJECTED',
  TEAM_INVITE_RECEIVED = 'TEAM_INVITE_RECEIVED',
  TEAM_INVITE_ACCEPTED = 'TEAM_INVITE_ACCEPTED',
  TEAM_INVITE_DECLINED = 'TEAM_INVITE_DECLINED',
  EVENT_REMINDER = 'EVENT_REMINDER',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  ORGANIZER_ANNOUNCEMENT = 'ORGANIZER_ANNOUNCEMENT',
  EVENT_STATUS_CHANGE = 'EVENT_STATUS_CHANGE',
  EVENT_APPROVED = 'EVENT_APPROVED',
  EVENT_REJECTED = 'EVENT_REJECTED',
}

// ─── Types ───────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}
