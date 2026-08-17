'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Bookmark,
  ArrowUpRight,
  Sparkles,
  Clock,
} from 'lucide-react';
import { ExtendedEvent } from '@/lib/mock-data';
import { formatCurrency, getDaysLeft, getStatusBadge, getCategoryBadge } from '@/lib/utils';
import { toggleBookmarkEvent } from '@/lib/storage';
import { RegistrationModal } from './registration-modal';

interface HackathonCardProps {
  event: ExtendedEvent;
  isBookmarked?: boolean;
  onBookmarkChange?: () => void;
}

export function HackathonCard({ event, isBookmarked = false, onBookmarkChange }: HackathonCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [showRegModal, setShowRegModal] = useState(false);

  const statusInfo = getStatusBadge(event.status);
  const categoryInfo = getCategoryBadge(event.category);
  const deadlineInfo = getDaysLeft(event.registrationDeadline);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmarkEvent(event.id);
    setBookmarked(!bookmarked);
    onBookmarkChange?.();
  };

  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-[#0099e6]/40 transition-all duration-300">
        {/* Top Header */}
        <div className="h-20 w-full bg-gradient-to-r from-sky-50 via-slate-50 to-orange-50/60 relative p-4 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#0099e6] border border-[#0099e6]/20 shadow-2xs">
              {categoryInfo.label}
            </span>
            {event.featured && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100/80 text-[#ea580c] border border-orange-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> FEATURED
              </span>
            )}
          </div>

          <button
            onClick={handleBookmark}
            title={bookmarked ? 'Remove Bookmark' : 'Save Hackathon'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              bookmarked
                ? 'bg-[#0099e6] text-white border-[#0099e6] shadow-sm'
                : 'bg-white text-slate-400 hover:text-slate-700 border-slate-200 shadow-2xs hover:border-slate-300'
            }`}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            {/* Status & Deadline pill */}
            <div className="flex items-center justify-between gap-2 mb-2 text-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{statusInfo.label}</span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-medium ${deadlineInfo.urgent ? 'text-[#ea580c] font-bold' : 'text-slate-500'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{deadlineInfo.text}</span>
              </div>
            </div>

            {/* Title & Organizer */}
            <Link href={`/hackathons/${event.slug}`} className="block group-hover:text-[#0099e6] transition-colors">
              <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                {event.title}
              </h3>
            </Link>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>by</span>
              <span className="font-semibold text-slate-700">{event.organizerName}</span>
            </p>

            {/* Description */}
            <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200"
              >
                #{tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-400">
                +{event.tags.length - 3}
              </span>
            )}
          </div>

          {/* Stats Bar (Prizes, Location, Builders) */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea580c]">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Prize Pool</div>
                <div className="font-extrabold text-[#ea580c] text-sm">
                  {formatCurrency(event.totalPrizeValue)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0099e6]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Hackers</div>
                <div className="font-bold text-slate-800 text-xs">
                  {event.participantsCount.toLocaleString()}+ Registered
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <Link
              href={`/hackathons/${event.slug}`}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-all"
            >
              <span>Explore Details</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <button
              onClick={() => setShowRegModal(true)}
              className="py-2 px-4 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-xs shadow-sky-500/30 transition-all cursor-pointer"
            >
              Register
            </button>
          </div>
        </div>
      </div>

      <RegistrationModal
        event={event}
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
      />
    </>
  );
}
