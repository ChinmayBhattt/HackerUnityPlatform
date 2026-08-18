'use client';

import { useState } from 'react';
import { X, CheckCircle2, Rocket } from 'lucide-react';
import { ExtendedEvent } from '@/lib/mock-data';
import { registerForEventStorage, saveEventRegistration, EventRegistration } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface RegistrationModalProps {
  event: ExtendedEvent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RegistrationModal({ event, isOpen, onClose, onSuccess }: RegistrationModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Default fields
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college || '');
  const [city, setCity] = useState('');
  const [githubUrl, setGithubUrl] = useState(user?.socialLinks?.github || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.socialLinks?.linkedin || '');
  const [skillsInput, setSkillsInput] = useState(user?.skills?.join(', ') || '');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [agreeRules, setAgreeRules] = useState(true);

  if (!isOpen) return null;

  const handleCustomAnswer = (questionId: string, value: string) => {
    setCustomAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const approvalMode = event.approvalMode || 'AUTO';
    const status = approvalMode === 'AUTO' ? 'CONFIRMED' : 'PENDING';

    // Save detailed registration
    const registration: EventRegistration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      eventId: event.id,
      userName: fullName,
      userEmail: email,
      phone: phone || '',
      college: college || '',
      city: city || '',
      githubUrl: githubUrl || '',
      linkedinUrl: linkedinUrl || '',
      skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
      customAnswers,
      status: status as any,
      registeredAt: new Date().toISOString(),
    };
    saveEventRegistration(registration);

    // Also save in the legacy format for dashboard compatibility
    registerForEventStorage({
      eventId: event.id,
      eventName: event.title,
      registeredAt: new Date().toISOString(),
      isTeam: false,
      role: 'Builder',
      status: status === 'CONFIRMED' ? 'CONFIRMED' : 'UNDER_REVIEW',
    });

    setStep('success');
    setTimeout(() => {
      onSuccess?.();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0099e6]">Register</span>
            <h2 className="text-lg font-black text-slate-900 pr-6 leading-tight">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 'success' ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {event.approvalMode === 'MANUAL' ? 'REGISTRATION SUBMITTED' : 'REGISTRATION CONFIRMED'}
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {event.approvalMode === 'MANUAL' ? 'Application Submitted!' : 'You are in!'}
                </h3>
                <p className="text-sm text-slate-600 max-w-sm">
                  {event.approvalMode === 'MANUAL'
                    ? <>Your registration for <span className="text-[#0099e6] font-bold">{event.title}</span> is pending approval by the organizer.</>
                    : <>You are registered for <span className="text-[#0099e6] font-bold">{event.title}</span>. We have added this to your Builder Dashboard.</>
                  }
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Prize info */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[#ea580c] font-bold">{formatCurrency(event.totalPrizeValue)} Pool</span>
                {event.registrationType === 'FREE' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">FREE ENTRY</span>
                )}
              </div>

              {/* Default Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input type="text" required placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                  <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input type="tel" placeholder="+91 99887 76655" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input type="text" placeholder="e.g. Jaipur" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College / Organization</label>
                <input type="text" placeholder="e.g. IIT Delhi" value={college} onChange={(e) => setCollege(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GitHub URL</label>
                  <input type="url" placeholder="https://github.com/..." value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn URL</label>
                  <input type="url" placeholder="https://linkedin.com/in/..." value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skills (comma separated)</label>
                <input type="text" placeholder="Next.js, Python, PyTorch, TypeScript" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors" />
              </div>

              {/* Custom Questions */}
              {event.customQuestions && event.customQuestions.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Additional Questions</label>
                  {event.customQuestions.map((q) => (
                    <div key={q.id}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {q.label} {q.required && '*'}
                      </label>
                      {q.type === 'textarea' ? (
                        <textarea rows={2} required={q.required} value={customAnswers[q.id] || ''} onChange={(e) => handleCustomAnswer(q.id, e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none resize-none" />
                      ) : q.type === 'select' && q.options ? (
                        <select required={q.required} value={customAnswers[q.id] || ''} onChange={(e) => handleCustomAnswer(q.id, e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#0099e6]">
                          <option value="">Select...</option>
                          {q.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input type="text" required={q.required} value={customAnswers[q.id] || ''} onChange={(e) => handleCustomAnswer(q.id, e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors" />
                      )}
                    </div>
                  ))}
                </div>
              )}

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
                  <span>{event.approvalMode === 'MANUAL' ? 'Submit Application' : 'Confirm Registration'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
