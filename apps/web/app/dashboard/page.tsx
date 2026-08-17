'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Bookmark,
  Users,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import {
  getMyRegistrations,
  getBookmarkedEventIds,
  getAllEvents,
  getStoredUser,
  saveStoredUser,
  UserRegistrationItem,
} from '@/lib/storage';
import { ExtendedEvent } from '@/lib/mock-data';
import { UserPublic } from '@hackers-unity/shared-types';
import { HackathonCard } from '@/components/hackathon-card';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'registrations' | 'bookmarks' | 'teams' | 'profile'>('registrations');
  const [registrations, setRegistrations] = useState<UserRegistrationItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [allEvents, setAllEvents] = useState<ExtendedEvent[]>([]);
  const [user, setUser] = useState<UserPublic>(getStoredUser());
  const [profileSaved, setProfileSaved] = useState(false);

  // Editable Profile fields
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [college, setCollege] = useState(user.college || '');
  const [skillsInput, setSkillsInput] = useState(user.skills.join(', '));
  const [github, setGithub] = useState(user.socialLinks?.github || '');
  const [linkedin, setLinkedin] = useState(user.socialLinks?.linkedin || '');

  useEffect(() => {
    setRegistrations(getMyRegistrations());
    setBookmarkedIds(getBookmarkedEventIds());
    setAllEvents(getAllEvents());
    const currentUser = getStoredUser();
    setUser(currentUser);
    setName(currentUser.name);
    setBio(currentUser.bio || '');
    setCollege(currentUser.college || '');
    setSkillsInput(currentUser.skills.join(', '));

    const handleStorage = () => {
      setRegistrations(getMyRegistrations());
      setBookmarkedIds(getBookmarkedEventIds());
      setAllEvents(getAllEvents());
      setUser(getStoredUser());
    };
    window.addEventListener('hackers_unity_storage_change', handleStorage);
    return () => window.removeEventListener('hackers_unity_storage_change', handleStorage);
  }, []);

  const bookmarkedEvents = allEvents.filter((e) => bookmarkedIds.includes(e.id));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserPublic = {
      ...user,
      name,
      bio,
      college,
      skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
      socialLinks: {
        github,
        linkedin,
      },
    };
    saveStoredUser(updated);
    setUser(updated);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* ─── Profile Banner Header ──────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center font-black text-2xl text-[#0099e6] shadow-xs">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0099e6] border border-sky-200">
                Verified Hacker
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{user.college || user.organization}</p>
            <div className="flex items-center gap-2 mt-2">
              {user.skills.slice(0, 4).map((s) => (
                <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div className="text-left md:text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Hacker Arena Elo</div>
            <div className="text-2xl font-black text-[#0099e6] font-mono">2,140</div>
          </div>
          <Link
            href="/host"
            className="px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ea580c] border border-orange-200 text-xs font-bold transition-all shadow-2xs"
          >
            Host Hackathon
          </Link>
        </div>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'registrations'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>My Hackathons ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'bookmarks'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved / Bookmarks ({bookmarkedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'teams'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Squads & Invites</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#0099e6] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* ─── TAB 1: Registrations ─────────────────────────────────── */}
      {activeTab === 'registrations' && (
        <div className="space-y-4 animate-in fade-in">
          {registrations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No registered hackathons yet</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Explore our directory and sign up for an upcoming sprint.</p>
              <Link
                href="/hackathons"
                className="mt-4 inline-block px-4 py-2 rounded-xl bg-[#0099e6] text-white text-xs font-bold"
              >
                Browse Hackathons
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registrations.map((reg) => (
                <div
                  key={reg.eventId}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {reg.status}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{reg.eventName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Registered on {formatDate(reg.registeredAt)}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Participation Mode:</span>
                      <span className="font-bold text-slate-900">{reg.isTeam ? 'Squad / Team' : 'Solo Hacker'}</span>
                    </div>
                    {reg.teamName && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Squad Name:</span>
                        <span className="font-bold text-[#ea580c]">{reg.teamName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Your Role:</span>
                      <span className="font-bold text-[#0099e6]">{reg.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/hackathons/ai-nexus-global-2026`}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center border border-slate-200"
                    >
                      View Event Hub
                    </Link>
                    <button className="px-4 py-2 rounded-xl bg-sky-50 text-[#0099e6] text-xs font-bold border border-sky-200 hover:bg-sky-100 cursor-pointer">
                      Submit Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: Bookmarks ─────────────────────────────────────── */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4 animate-in fade-in">
          {bookmarkedEvents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No saved hackathons</h3>
              <p className="text-xs text-slate-500 mt-1">Click the bookmark icon on any hackathon card to save it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedEvents.map((event) => (
                <HackathonCard key={event.id} event={event} isBookmarked={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: Teams & Invites ───────────────────────────────── */}
      {activeTab === 'teams' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0099e6]" />
              <span>Active Squad: CyberSynthetics (AI Nexus Hackathon)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0099e6] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  C
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Chinmay Bhatt (You)</div>
                  <div className="text-[10px] text-[#0099e6] font-bold">Team Lead & AI Core</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f97316] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  E
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Elena Rostova</div>
                  <div className="text-[10px] text-[#ea580c] font-bold">UI/UX & Next.js</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-center">
                <Link href="/teammates" className="text-xs text-[#0099e6] hover:underline font-bold">
                  + Invite 3rd Member
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Profile Editor ────────────────────────────────── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl space-y-4 animate-in fade-in">
          {profileSaved && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile updated and synchronized!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bio / Specialty</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none resize-none leading-relaxed font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">University / Organization</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Skills (comma separated)</label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Profile URL</label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Profile URL</label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 outline-none font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
