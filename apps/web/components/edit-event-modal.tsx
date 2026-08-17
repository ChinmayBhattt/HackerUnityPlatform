'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trophy, Calendar, MapPin, Tag, Globe, Sparkles, AlertCircle } from 'lucide-react';
import { ExtendedEvent } from '@/lib/mock-data';
import { EventCategory, EventStatus, EventType } from '@hackers-unity/shared-types';

interface EditEventModalProps {
  event: ExtendedEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEvent: ExtendedEvent) => void;
}

export function EditEventModal({ event, isOpen, onClose, onSave }: EditEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [mode, setMode] = useState('In-Person');
  const [eventType, setEventType] = useState<EventType>(EventType.OFFLINE);
  const [status, setStatus] = useState<EventStatus>(EventStatus.PUBLISHED);
  const [prize, setPrize] = useState('');
  const [totalPrizeValue, setTotalPrizeValue] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [image, setImage] = useState('');
  const [ctaText, setCtaText] = useState('Learn More');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title || event.name || '');
      setDescription(event.description || '');
      setDomain(event.domain || '');
      setMode(event.mode || (event.eventType === EventType.ONLINE ? 'Online' : 'In-Person'));
      setEventType(event.eventType || EventType.OFFLINE);
      setStatus(event.status || EventStatus.PUBLISHED);
      setPrize(event.prize || `₹${event.totalPrizeValue?.toLocaleString() || '0'}`);
      setTotalPrizeValue(event.totalPrizeValue || 0);
      setStartDate(event.startDate ? event.startDate.split('T')[0] : '');
      setEndDate(event.endDate ? event.endDate.split('T')[0] : '');
      setRegistrationDeadline(event.registrationDeadline ? event.registrationDeadline.split('T')[0] : '');
      setLocation(event.location || '');
      setTagsInput(event.tags ? event.tags.join(', ') : '');
      setRegistrationLink(event.registrationLink || '');
      setImage(event.image || event.bannerUrl || '');
      setCtaText(event.ctaText || 'Learn More');
      setError(null);
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Event title is required');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: ExtendedEvent = {
      ...event,
      title: title.trim(),
      name: title.trim(),
      description: description.trim(),
      domain: domain.trim(),
      mode: mode,
      eventType: mode.toLowerCase().includes('online') ? EventType.ONLINE : EventType.OFFLINE,
      status: status,
      prize: prize.trim(),
      totalPrizeValue: Number(totalPrizeValue) || 0,
      startDate: startDate ? `${startDate}T00:00:00Z` : event.startDate,
      endDate: endDate ? `${endDate}T23:59:59Z` : event.endDate,
      registrationDeadline: registrationDeadline ? `${registrationDeadline}T23:59:59Z` : event.registrationDeadline,
      location: location.trim(),
      tags: parsedTags.length > 0 ? parsedTags : event.tags,
      registrationLink: registrationLink.trim(),
      image: image.trim(),
      bannerUrl: image.trim(),
      ctaText: ctaText.trim() || 'Learn More',
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0099e6] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Organizer Management</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">Edit Hackathon Event</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
              placeholder="e.g. CodeWars National Hackathon"
              required
            />
          </div>

          {/* Status & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] bg-white"
              >
                <option value={EventStatus.PUBLISHED}>Open for Registration (Live)</option>
                <option value={EventStatus.ONGOING}>Ongoing / Live Hacking</option>
                <option value={EventStatus.COMPLETED}>Completed / Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Format / Mode</label>
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setEventType(e.target.value.toLowerCase().includes('online') ? EventType.ONLINE : EventType.OFFLINE);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] bg-white"
              >
                <option value="In-Person">In-Person (Offline)</option>
                <option value="Online">Online (Virtual)</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Prize & Prize Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prize Pool Display <span className="text-slate-400 font-normal">(e.g. ₹50,000 or $2,100)</span>
              </label>
              <div className="relative">
                <Trophy className="w-4 h-4 text-orange-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                  placeholder="₹50,000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Numeric Value <span className="text-slate-400 font-normal">(for calculations)</span>
              </label>
              <input
                type="number"
                value={totalPrizeValue}
                onChange={(e) => setTotalPrizeValue(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="50000"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description & Overview</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
              placeholder="Describe your hackathon tracks, theme, and rules..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Reg. Deadline</label>
              <input
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
              />
            </div>
          </div>

          {/* Domain & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Domain Focus</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="AI/ML, Web3, FinTech"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                  placeholder="AI/ML, Web3, IoT"
                />
              </div>
            </div>
          </div>

          {/* Poster Image URL & Registration Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Poster / Banner Image Path</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="/gallery/codewars.png"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">External Registration URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={registrationLink}
                  onChange={(e) => setRegistrationLink(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                  placeholder="https://devfolio.co/..."
                />
              </div>
            </div>
          </div>

          {/* Location & CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Physical Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                  placeholder="e.g. ACEIT Campus, Jaipur"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Card CTA Button Text</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                placeholder="Learn More / Explore"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
