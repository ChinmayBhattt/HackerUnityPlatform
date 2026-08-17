'use client';

import { useState } from 'react';
import { X, User, ShieldCheck, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { UserRole } from '@hackers-unity/shared-types';
import { DEFAULT_USER, saveStoredUser } from '@/lib/storage';
import { Logo } from './logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>(UserRole.PARTICIPANT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      ...DEFAULT_USER,
      name: name || DEFAULT_USER.name,
      email: email || DEFAULT_USER.email,
      role: role,
    };
    saveStoredUser(newUser);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSuccess?.();
      onClose();
    }, 1000);
  };

  const handleDemoSignIn = (demoRole: UserRole) => {
    const demoUser = {
      ...DEFAULT_USER,
      name: demoRole === UserRole.ORGANIZER ? "Nexus Organizer Guild" : "Chinmay Bhatt (Demo Hacker)",
      email: demoRole === UserRole.ORGANIZER ? 'guild@nexus.org' : 'chinmay@hackersunity.dev',
      role: demoRole,
    };
    saveStoredUser(demoUser);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSuccess?.();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Welcome to Hacker&apos;s Unity!</h3>
            <p className="text-sm text-slate-500">Your session is active. Let’s build something epic.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6 flex flex-col items-center">
              <Logo size={40} showText={true} className="mb-2" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                {mode === 'login' ? 'Sign in to Arena' : 'Create Builder Account'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Discover hackathons, find teammates, and ship the future.
              </p>
            </div>

            {/* Quick Demo Login Badges */}
            <div className="mb-6 p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
              <div className="text-[11px] font-bold text-[#0099e6] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>⚡ 1-Click Instant Demo Login:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSignIn(UserRole.PARTICIPANT)}
                  className="px-3 py-2 text-xs font-bold bg-white hover:bg-sky-100 text-[#0099e6] rounded-xl border border-sky-200 shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>As Hacker</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSignIn(UserRole.ORGANIZER)}
                  className="px-3 py-2 text-xs font-bold bg-white hover:bg-orange-100 text-[#ea580c] rounded-xl border border-orange-200 shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>As Organizer</span>
                </button>
              </div>
            </div>

            {/* Role switch on register */}
            {mode === 'register' && (
              <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.PARTICIPANT)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    role === UserRole.PARTICIPANT
                      ? 'bg-white text-[#0099e6] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Hacker / Builder
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.ORGANIZER)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    role === UserRole.ORGANIZER
                      ? 'bg-white text-[#ea580c] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Organizer
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Satoshi Nakamoto"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="builder@hackersunity.dev"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-sm transition-all shadow-sm shadow-sky-500/20 cursor-pointer"
              >
                {mode === 'login' ? 'Sign In to Arena' : "Join Hacker's Unity"}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-[#0099e6] hover:underline font-bold cursor-pointer"
                  >
                    Create one here
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-[#0099e6] hover:underline font-bold cursor-pointer"
                  >
                    Sign in here
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
