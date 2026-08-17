'use client';

import { useState } from 'react';
import { X, CheckCircle2, Users, User, Rocket } from 'lucide-react';
import { ExtendedEvent } from '@/lib/mock-data';
import { registerForEventStorage } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';

interface RegistrationModalProps {
  event: ExtendedEvent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RegistrationModal({ event, isOpen, onClose, onSuccess }: RegistrationModalProps) {
  const [step, setStep] = useState<'type' | 'details' | 'success'>('type');
  const [isTeam, setIsTeam] = useState(event.isTeamEvent);
  const [teamName, setTeamName] = useState('');
  const [teamEmails, setTeamEmails] = useState('');
  const [roleInTeam, setRoleInTeam] = useState('Fullstack / AI Engineer');
  const [trackChoice, setTrackChoice] = useState(event.tracks[0]?.title || 'General Open Track');
  const [agreeRules, setAgreeRules] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerForEventStorage({
      eventId: event.id,
      eventName: event.title,
      registeredAt: new Date().toISOString(),
      teamName: isTeam ? teamName || 'Team Alpha' : undefined,
      isTeam: isTeam,
      role: roleInTeam,
      status: 'CONFIRMED',
    });
    setStep('success');
    setTimeout(() => {
      onSuccess?.();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg p-6 overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'success' ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                REGISTRATION CONFIRMED
              </div>
              <h3 className="text-xl font-black text-slate-900">You are in!</h3>
              <p className="text-sm text-slate-600 max-w-sm">
                You are registered for <span className="text-[#0099e6] font-bold">{event.title}</span>.
                We have added this to your Builder Dashboard.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              Back to Arena
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0099e6]">Event Check-In</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-[#ea580c] font-bold">{formatCurrency(event.totalPrizeValue)} Pool</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-4 pr-6">{event.title}</h2>

            {/* Participation Type toggle */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setIsTeam(false)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  !isTeam
                    ? 'bg-sky-50/80 border-[#0099e6] text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <User className="w-5 h-5 mb-1.5 text-[#0099e6]" />
                <div className="text-sm font-bold text-slate-900">Solo Hacker</div>
                <div className="text-[11px] text-slate-500">Participate as an individual builder</div>
              </button>
              <button
                type="button"
                onClick={() => setIsTeam(true)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isTeam
                    ? 'bg-orange-50/80 border-[#f97316] text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Users className="w-5 h-5 mb-1.5 text-[#f97316]" />
                <div className="text-sm font-bold text-slate-900">Team Participation</div>
                <div className="text-[11px] text-slate-500">
                  {event.minTeamSize || 1} to {event.maxTeamSize || 4} members squad
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isTeam && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Squad / Team Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Neural Ninjas"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Invite Teammates by Email (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="alex@example.com, sara@example.com"
                      value={teamEmails}
                      onChange={(e) => setTeamEmails(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Primary Role</label>
                  <select
                    value={roleInTeam}
                    onChange={(e) => setRoleInTeam(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]"
                  >
                    <option>Fullstack Developer</option>
                    <option>AI / ML Engineer</option>
                    <option>Smart Contract / Web3</option>
                    <option>Frontend / UI/UX</option>
                    <option>Backend & Cloud</option>
                    <option>Product & Pitch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Track</label>
                  <select
                    value={trackChoice}
                    onChange={(e) => setTrackChoice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6] truncate"
                  >
                    {event.tracks.map((t) => (
                      <option key={t.title} value={t.title}>
                        {t.title}
                      </option>
                    ))}
                    <option value="General Track">General Track</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreeRules}
                  onChange={(e) => setAgreeRules(e.target.checked)}
                  required
                  className="rounded border-slate-300 text-[#0099e6] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="agree" className="text-xs text-slate-600 cursor-pointer">
                  I agree to the <span className="text-slate-900 underline font-semibold">Code of Conduct</span> and event rules.
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!agreeRules}
                  className="flex-[2] py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Confirm Registration</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
