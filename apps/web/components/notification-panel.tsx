'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Loader2,
  Sparkles,
  Megaphone,
  Calendar,
  Users,
  Trophy,
  Newspaper,
  Rocket,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { useNotifications } from '@/lib/notification-context';
import { useAuth } from '@/lib/auth-context';
import { formatRelativeTime } from '@/lib/notification-service';
import { acceptTeamInvite, declineTeamInvite } from '@/lib/supabase-service';
import { NotificationDbType, UserNotification } from '@hackers-unity/shared-types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'invites' | 'events' | 'announcements';

function stripEmojis(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getNotificationIcon(type: NotificationDbType) {
  const iconClass = 'w-4 h-4';
  switch (type) {
    case NotificationDbType.EVENT:
      return <Rocket className={`${iconClass} text-[#0099e6]`} />;
    case NotificationDbType.REGISTRATION:
      return <Sparkles className={`${iconClass} text-emerald-500`} />;
    case NotificationDbType.REMINDER:
      return <Calendar className={`${iconClass} text-amber-500`} />;
    case NotificationDbType.ANNOUNCEMENT:
      return <Megaphone className={`${iconClass} text-[#0099e6]`} />;
    case NotificationDbType.TEAM:
      return <Users className={`${iconClass} text-violet-500`} />;
    case NotificationDbType.RESULT:
      return <Trophy className={`${iconClass} text-yellow-500`} />;
    case NotificationDbType.NEWS:
      return <Newspaper className={`${iconClass} text-teal-500`} />;
    case NotificationDbType.SYSTEM:
    default:
      return <Bell className={`${iconClass} text-slate-500`} />;
  }
}

function getNotificationBg(type: NotificationDbType, isRead: boolean): string {
  if (isRead) return 'bg-white hover:bg-slate-50/80';
  switch (type) {
    case NotificationDbType.EVENT:
      return 'bg-sky-50/70 hover:bg-sky-50';
    case NotificationDbType.REGISTRATION:
      return 'bg-emerald-50/70 hover:bg-emerald-50';
    case NotificationDbType.REMINDER:
      return 'bg-amber-50/70 hover:bg-amber-50';
    case NotificationDbType.ANNOUNCEMENT:
      return 'bg-sky-50/60 hover:bg-sky-50';
    case NotificationDbType.TEAM:
      return 'bg-violet-50/80 hover:bg-violet-50';
    case NotificationDbType.RESULT:
      return 'bg-yellow-50/70 hover:bg-yellow-50';
    case NotificationDbType.NEWS:
      return 'bg-teal-50/70 hover:bg-teal-50';
    default:
      return 'bg-slate-50/60 hover:bg-slate-50';
  }
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const { user, supabaseUser } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  // Track action states for invite accept/decline
  const [actionLoading, setActionLoading] = useState<Record<string, 'accept' | 'decline' | null>>({});
  const [actionResults, setActionResults] = useState<Record<string, 'accepted' | 'declined'>>({});

  const userId = supabaseUser?.id || user?.id;

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const invitesCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.notification.type === NotificationDbType.TEAM ||
          n.notification.metadata?.inviteToken ||
          n.id.startsWith('invite-')
      ).length,
    [notifications]
  );

  const eventsCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.notification.type === NotificationDbType.EVENT ||
          n.notification.eventId ||
          n.id.startsWith('event-notif-')
      ).length,
    [notifications]
  );

  const announcementsCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.notification.type === NotificationDbType.ANNOUNCEMENT ||
          n.notification.type === NotificationDbType.NEWS ||
          n.notification.type === NotificationDbType.SYSTEM ||
          n.id.startsWith('announcement-')
      ).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'invites') {
      return notifications.filter(
        (n) =>
          n.notification.type === NotificationDbType.TEAM ||
          n.notification.metadata?.inviteToken ||
          n.id.startsWith('invite-')
      );
    }
    if (activeTab === 'events') {
      return notifications.filter(
        (n) =>
          n.notification.type === NotificationDbType.EVENT ||
          n.notification.eventId ||
          n.id.startsWith('event-notif-')
      );
    }
    if (activeTab === 'announcements') {
      return notifications.filter(
        (n) =>
          n.notification.type === NotificationDbType.ANNOUNCEMENT ||
          n.notification.type === NotificationDbType.NEWS ||
          n.notification.type === NotificationDbType.SYSTEM ||
          n.id.startsWith('announcement-')
      );
    }
    return notifications;
  }, [notifications, activeTab]);

  if (!isOpen) return null;

  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.notification.actionUrl) {
      router.push(notif.notification.actionUrl);
      onClose();
    }
  };

  const handleAcceptInvite = async (e: React.MouseEvent, notif: UserNotification) => {
    e.stopPropagation();
    const token = notif.notification.metadata?.inviteToken;
    if (!token) {
      if (notif.notification.actionUrl) {
        router.push(notif.notification.actionUrl);
        onClose();
      }
      return;
    }

    const currentUserId = userId || 'guest_user';
    setActionLoading((prev) => ({ ...prev, [notif.id]: 'accept' }));

    try {
      const res = await acceptTeamInvite(token, currentUserId);
      if (res.success) {
        setActionResults((prev) => ({ ...prev, [notif.id]: 'accepted' }));
        await markAsRead(notif.id);
        refreshNotifications();
      } else {
        alert(res.error || 'Failed to accept invite');
      }
    } catch (err: any) {
      console.error('Failed to accept invite:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [notif.id]: null }));
    }
  };

  const handleDeclineInvite = async (e: React.MouseEvent, notif: UserNotification) => {
    e.stopPropagation();
    const token = notif.notification.metadata?.inviteToken;
    if (!token) return;

    setActionLoading((prev) => ({ ...prev, [notif.id]: 'decline' }));

    try {
      const res = await declineTeamInvite(token);
      if (res.success) {
        setActionResults((prev) => ({ ...prev, [notif.id]: 'declined' }));
        await markAsRead(notif.id);
        refreshNotifications();
      } else {
        alert(res.error || 'Failed to decline invite');
      }
    } catch (err: any) {
      console.error('Failed to decline invite:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [notif.id]: null }));
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-[400px] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/60 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#0099e6]/10 flex items-center justify-center text-[#0099e6]">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#f97316] text-white text-[10px] font-bold min-w-[18px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAllAsRead();
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-[#0099e6] hover:text-[#0284c7] transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors text-center shrink-0 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('invites')}
          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors text-center shrink-0 ${
            activeTab === 'invites'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Invites ({invitesCount})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors text-center shrink-0 ${
            activeTab === 'events'
              ? 'bg-[#0099e6] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Events ({eventsCount})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors text-center shrink-0 ${
            activeTab === 'announcements'
              ? 'bg-[#0099e6] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Updates ({announcementsCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-[380px] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#0099e6] mb-2" />
            <span className="text-xs font-medium">Connecting to live feed...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <span className="text-xs font-bold text-slate-600">No {activeTab === 'all' ? '' : activeTab} notifications yet</span>
            <span className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
              {activeTab === 'invites'
                ? 'Squad invites sent to your email will appear here with instant Accept / Reject options.'
                : activeTab === 'events'
                ? 'Upcoming hackathons & challenges will appear here in real time.'
                : 'Live announcements and community updates appear here.'}
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notif) => {
              const isTeamInvite =
                notif.notification.type === NotificationDbType.TEAM ||
                Boolean(notif.notification.metadata?.inviteToken) ||
                notif.id.startsWith('invite-');
              const inviteToken = notif.notification.metadata?.inviteToken;
              const resultState = actionResults[notif.id];
              const isLoadingAccept = actionLoading[notif.id] === 'accept';
              const isLoadingDecline = actionLoading[notif.id] === 'decline';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full flex flex-col px-4 py-3 text-left transition-colors cursor-pointer group ${getNotificationBg(
                    notif.notification.type,
                    notif.isRead
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    {/* SVG Icon Box */}
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 group-hover:scale-105 transition-transform">
                      {isTeamInvite ? (
                        <Users className="w-4 h-4 text-violet-600" />
                      ) : (
                        getNotificationIcon(notif.notification.type)
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isTeamInvite && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-violet-100 text-violet-700 tracking-wide uppercase">
                              Squad Invite
                            </span>
                          )}
                          <span
                            className={`text-xs leading-tight line-clamp-1 ${
                              notif.isRead ? 'font-semibold text-slate-700' : 'font-extrabold text-slate-900'
                            }`}
                          >
                            {stripEmojis(notif.notification.title)}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#0099e6] shrink-0 mt-1" />
                        )}
                      </div>

                      <p
                        className={`text-[11px] mt-1 leading-snug line-clamp-2 ${
                          notif.isRead ? 'text-slate-500' : 'text-slate-600'
                        }`}
                      >
                        {stripEmojis(notif.notification.message)}
                      </p>

                      {/* Interactive Invite Actions */}
                      {isTeamInvite && inviteToken && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                          {resultState === 'accepted' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <Check className="w-3.5 h-3.5" /> Joined Squad!
                            </span>
                          ) : resultState === 'declined' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                              <X className="w-3.5 h-3.5" /> Invite Declined
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={Boolean(actionLoading[notif.id])}
                                onClick={(e) => handleAcceptInvite(e, notif)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isLoadingAccept ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                )}
                                <span>Accept</span>
                              </button>

                              <button
                                type="button"
                                disabled={Boolean(actionLoading[notif.id])}
                                onClick={(e) => handleDeclineInvite(e, notif)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 active:scale-95 text-rose-600 border border-rose-200 text-[11px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isLoadingDecline ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                <span>Reject</span>
                              </button>
                            </div>
                          )}

                          {notif.notification.actionUrl && (
                            <span className="text-[11px] font-bold text-[#0099e6] hover:text-[#0284c7] flex items-center gap-0.5 ml-auto">
                              View Squad <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      )}

                      {/* Normal Action Link & Relative Time */}
                      {!isTeamInvite && (
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeTime(notif.notification.createdAt)}
                          </span>
                          {notif.notification.actionUrl && (
                            <span className="text-[10px] font-bold text-[#0099e6] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              View details <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">Realtime sync active</span>
        <Link
          href="/hackathons"
          onClick={onClose}
          className="text-[#0099e6] hover:text-[#0284c7] font-bold transition-colors"
        >
          Explore All Hackathons &rarr;
        </Link>
      </div>
    </div>
  );
}
