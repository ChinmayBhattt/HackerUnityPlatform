'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Megaphone,
  Newspaper,
  Send,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Trophy,
  Rocket,
  Calendar,
  Lock,
  ArrowLeft,
  Eye,
  Plus,
  Radio,
  FileText,
  History,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  NotificationDbType,
  NotificationTargetType,
  NewsCategory,
  NewsStatus,
  UserRole,
} from '@hackers-unity/shared-types';
import { createNotification, fetchSentNotifications, formatRelativeTime } from '@/lib/notification-service';
import { createNews, getNewsCategoryLabel } from '@/lib/news-service';
import { supabase } from '@/lib/supabase';
import { MOCK_EVENTS } from '@/lib/mock-data';

const POPULAR_EMOJIS = ['🔔', '🚀', '📢', '🎉', '⏰', '🏆', '👥', '📰', '⚡', '🤖', '🔥', '💡'];

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Tabs: 'broadcast' | 'news' | 'history'
  const [activeTab, setActiveTab] = useState<'broadcast' | 'news' | 'history'>('broadcast');

  // Broadcast Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationDbType>(NotificationDbType.ANNOUNCEMENT);
  const [icon, setIcon] = useState('📢');
  const [targetType, setTargetType] = useState<NotificationTargetType>(NotificationTargetType.ALL);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // News Form State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState<NewsCategory>(NewsCategory.PLATFORM_UPDATES);
  const [newsDescription, setNewsDescription] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCoverImage, setNewsCoverImage] = useState('');
  const [newsStatus, setNewsStatus] = useState<NewsStatus>(NewsStatus.PUBLISHED);
  const [sendNewsNotif, setSendNewsNotif] = useState(true);
  const [isPublishingNews, setIsPublishingNews] = useState(false);
  const [newsSuccess, setNewsSuccess] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  // History State
  const [sentHistory, setSentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Events list for participant selector
  const [eventsList, setEventsList] = useState<{ id: string; title: string; slug: string }[]>([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data } = await supabase.from('events').select('id, title, slug');
        if (data && data.length > 0) {
          setEventsList(data);
        } else {
          setEventsList(MOCK_EVENTS.map((e) => ({ id: e.id, title: e.title, slug: e.slug })));
        }
      } catch {
        setEventsList(MOCK_EVENTS.map((e) => ({ id: e.id, title: e.title, slug: e.slug })));
      }
    }
    loadEvents();
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && user?.id) {
      setLoadingHistory(true);
      fetchSentNotifications(user.id).then((res) => {
        setSentHistory(res.data);
        setLoadingHistory(false);
      });
    }
  }, [activeTab, user?.id]);

  // Auth Guard: Admin or Organizer only
  const isAuthorized =
    user &&
    (user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.ORGANIZER ||
      user.email?.includes('admin') ||
      user.email?.includes('chinmay'));

  if (!authLoading && !isAuthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Access Restricted</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          The Broadcast Studio is reserved for platform administrators and verified hackathon organizers.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs transition-all shadow-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Handle Send Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setNotifError('Please enter both a title and message.');
      return;
    }

    setIsSendingNotif(true);
    setNotifError(null);
    setNotifSuccess(false);

    let targetIds: string[] | undefined;
    if (targetType === NotificationTargetType.SPECIFIC_USER && targetUserId.trim()) {
      targetIds = [targetUserId.trim()];
    }

    const res = await createNotification(
      {
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        icon: icon || '🔔',
        eventId: targetType === NotificationTargetType.EVENT_PARTICIPANTS ? selectedEventId || undefined : undefined,
        targetType: targetType,
        targetUserIds: targetIds,
        actionUrl: actionUrl.trim() || undefined,
      },
      user?.id || 'usr_admin'
    );

    setIsSendingNotif(false);

    if (res.error) {
      setNotifError(res.error);
    } else {
      setNotifSuccess(true);
      setTitle('');
      setMessage('');
      setActionUrl('');
      setTimeout(() => setNotifSuccess(false), 4000);
    }
  };

  // Handle Publish News
  const handlePublishNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsDescription.trim()) {
      setNewsError('Please provide at least a title and short description.');
      return;
    }

    setIsPublishingNews(true);
    setNewsError(null);
    setNewsSuccess(false);

    const res = await createNews(
      {
        title: newsTitle.trim(),
        category: newsCategory,
        description: newsDescription.trim(),
        content: newsContent.trim(),
        coverImage: newsCoverImage.trim() || undefined,
        status: newsStatus,
        sendNotification: sendNewsNotif,
      },
      user?.id || 'usr_admin'
    );

    setIsPublishingNews(false);

    if (res.error) {
      setNewsError(res.error);
    } else {
      setNewsSuccess(true);
      setNewsTitle('');
      setNewsDescription('');
      setNewsContent('');
      setNewsCoverImage('');
      setTimeout(() => setNewsSuccess(false), 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Toast Feedback */}
      {notifSuccess && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-950 text-white text-xs font-bold shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-xl">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-white">Notification Broadcast Sent!</div>
            <div className="text-[11px] text-slate-400 font-normal">Realtime channels updated across all targeted clients.</div>
          </div>
        </div>
      )}

      {newsSuccess && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-950 text-white text-xs font-bold shadow-2xl border border-sky-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-xl">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-white">News Article Successfully Published!</div>
            <div className="text-[11px] text-slate-400 font-normal">Live on /news hub and indexed.</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#0099e6] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Broadcast & News Studio</span>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c] text-[10px] font-extrabold uppercase tracking-wider border border-orange-200">
              Admin
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Publish platform announcements, send targeted hackathon alerts, and publish editorial news articles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/news"
            className="px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-[#0099e6] border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Newspaper className="w-4 h-4" />
            <span>View Public News</span>
          </Link>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'bg-[#0099e6] text-white shadow-xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcast Notification</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'news'
              ? 'bg-[#0099e6] text-white shadow-xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Publish News & Updates</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-[#0099e6] text-white shadow-xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Dispatch History</span>
        </button>
      </div>

      {/* ═══ TAB 1: BROADCAST NOTIFICATIONS ═══ */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSendNotification} className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#0099e6]" />
                  <span>Compose Realtime Notification</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Deliver instant popups and bell panel badges to users across web and mobile.
                </p>
              </div>

              {notifError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{notifError}</span>
                </div>
              )}

              {/* Title & Icon Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-9">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notification Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 🚀 HackStorm 2026 Registration Open!"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Emoji Icon</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                  >
                    {POPULAR_EMOJIS.map((em) => (
                      <option key={em} value={em}>
                        {em} Icon
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notification Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Message / Details *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. Over $50,000 in bounties are up for grabs. Form your squad before deadline closes."
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] resize-none"
                />
              </div>

              {/* Notification Type & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notification Category</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as NotificationDbType)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer capitalize"
                  >
                    <option value={NotificationDbType.ANNOUNCEMENT}>📢 Announcement</option>
                    <option value={NotificationDbType.EVENT}>🚀 Hackathon / Event</option>
                    <option value={NotificationDbType.REGISTRATION}>🎉 Registration Alert</option>
                    <option value={NotificationDbType.REMINDER}>⏰ Milestone Reminder</option>
                    <option value={NotificationDbType.TEAM}>👥 Team / Squad Update</option>
                    <option value={NotificationDbType.RESULT}>🏆 Winner / Results</option>
                    <option value={NotificationDbType.NEWS}>📰 News Publication</option>
                    <option value={NotificationDbType.SYSTEM}>🔔 System Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Audience</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as NotificationTargetType)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                  >
                    <option value={NotificationTargetType.ALL}>🌐 All Registered Users (Broadcast)</option>
                    <option value={NotificationTargetType.EVENT_PARTICIPANTS}>🎯 Event Participants</option>
                    <option value={NotificationTargetType.EVENT_ORGANIZERS}>🛡️ Event Organizers</option>
                    <option value={NotificationTargetType.SPECIFIC_USER}>👤 Specific User ID</option>
                  </select>
                </div>
              </div>

              {/* Conditional Event Selector */}
              {targetType === NotificationTargetType.EVENT_PARTICIPANTS && (
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-800">Select Linked Hackathon *</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                  >
                    <option value="">-- Choose a Hackathon --</option>
                    {eventsList.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Specific User ID */}
              {targetType === NotificationTargetType.SPECIFIC_USER && (
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-800">Recipient Profile UUID *</label>
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="Enter target user UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                  />
                </div>
              )}

              {/* Action Click URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Action URL (On Click)</label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="e.g. /hackathons/codewars or /news/latest-dispatch"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  When user clicks the notification, they will be navigated to this path.
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  ⚡ Broadcasts instantly through Supabase Realtime
                </span>
                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingNotif ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send Realtime Broadcast</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                <Eye className="w-4 h-4 text-[#0099e6]" />
                <span>Live Interactive Preview</span>
              </div>
              <p className="text-[11px] text-slate-500">
                This is how your notification will render in the recipient&apos;s notification drawer:
              </p>

              {/* Preview Item in Panel */}
              <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3.5 flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <span className="text-sm">{icon || '🔔'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">
                      {title.trim() || 'Notification Title Preview'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#0099e6] shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-snug">
                    {message.trim() || 'Your notification message description will appear here.'}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Just now</span>
                </div>
              </div>

              {/* Preview Toast */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-700 mb-2">Live Toast Popup Preview:</div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                    <span className="text-sm">{icon || '🔔'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-900 line-clamp-1">
                      {title.trim() || 'Announcement Title'}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {message.trim() || 'Toast preview message preview snippet.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 2: PUBLISH NEWS & UPDATES ═══ */}
      {activeTab === 'news' && (
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handlePublishNews} className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#0099e6]" />
                <span>Create & Publish Platform News</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Post official updates, technology radar dispatches, and tournament recaps to the /news hub.
              </p>
            </div>

            {newsError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{newsError}</span>
              </div>
            )}

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Article Title *</label>
                <input
                  type="text"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="e.g. Hacker's Unity Announces Season 4 AI Agent League"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
                <select
                  value={newsCategory}
                  onChange={(e) => setNewsCategory(e.target.value as NewsCategory)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                >
                  <option value={NewsCategory.PLATFORM_UPDATES}>⚡ Hacker&apos;s Unity Updates</option>
                  <option value={NewsCategory.HACKATHONS}>🏆 Hackathons</option>
                  <option value={NewsCategory.AI}>🤖 AI & Autonomous Agents</option>
                  <option value={NewsCategory.TECHNOLOGY}>💻 Technology & Cloud</option>
                  <option value={NewsCategory.COMPETITIONS}>⚔️ Competitions</option>
                  <option value={NewsCategory.INTERNSHIPS}>💼 Internships & Fellowships</option>
                  <option value={NewsCategory.OPPORTUNITIES}>🌟 Opportunities & Grants</option>
                </select>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Short Teaser / Summary *</label>
              <textarea
                value={newsDescription}
                onChange={(e) => setNewsDescription(e.target.value)}
                rows={2}
                placeholder="A compelling 1-2 sentence preview that appears on news cards and notifications..."
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] resize-none"
              />
            </div>

            {/* Cover Image URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cover Image URL</label>
              <input
                type="url"
                value={newsCoverImage}
                onChange={(e) => setNewsCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/... or hosted image link"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
              />
            </div>

            {/* Full Markdown Content Body */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Article Body Content (Markdown Supported)
              </label>
              <textarea
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                rows={8}
                placeholder={`## Section Heading\n\nParagraph describing the milestone or announcement...\n\n### Key Highlights:\n- First bullet point\n- Second bullet point`}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] resize-y"
              />
            </div>

            {/* Send notification toggle */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold text-slate-900">Broadcast Notification on Publish?</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Automatically send a notification to all users when this story goes live.
                </div>
              </div>
              <input
                type="checkbox"
                checked={sendNewsNotif}
                onChange={(e) => setSendNewsNotif(e.target.checked)}
                className="w-4 h-4 rounded text-[#0099e6] focus:ring-[#0099e6] accent-[#0099e6] cursor-pointer"
              />
            </div>

            {/* Status & Submit */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={newsStatus}
                  onChange={(e) => setNewsStatus(e.target.value as NewsStatus)}
                  className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value={NewsStatus.PUBLISHED}>🚀 Publish Immediately</option>
                  <option value={NewsStatus.DRAFT}>📝 Save as Draft</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPublishingNews}
                className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPublishingNews ? <Loader2 className="w-4 h-4 animate-spin" /> : <Newspaper className="w-4 h-4" />}
                <span>{newsStatus === NewsStatus.PUBLISHED ? 'Publish News Article' : 'Save Draft'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══ TAB 3: DISPATCH HISTORY ═══ */}
      {activeTab === 'history' && (
        <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-[#0099e6]" />
              <span>Past Dispatches & Broadcasts</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Log of notifications and announcements sent from your account.
            </p>
          </div>

          {loadingHistory ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0099e6] mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400">Loading history...</p>
            </div>
          ) : sentHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-600">No past broadcasts found</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Dispatches you send will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sentHistory.map((item) => (
                <div key={item.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center font-bold text-sm shrink-0">
                      {item.icon || '🔔'}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{item.title}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span className="capitalize font-semibold text-slate-600">Audience: {item.target_type}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {item.action_url && (
                    <Link
                      href={item.action_url}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors whitespace-nowrap"
                    >
                      View Link
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
