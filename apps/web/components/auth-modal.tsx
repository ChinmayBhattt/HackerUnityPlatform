'use client';

import { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Info,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { Logo } from './logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signInWithPhone,
    verifyPhoneOtp,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [method, setMethod] = useState<'email' | 'phone'>('email');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successText, setSuccessText] = useState("Welcome to Hacker's Unity!");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    // 1. Phone OTP Verification
    if (method === 'phone') {
      if (!otpSent) {
        const res = await signInWithPhone(phoneNumber);
        if (res.error) {
          setErrorMessage(res.error);
          setIsLoading(false);
          return;
        }
        setOtpSent(true);
        setInfoMessage('SMS code sent! Please enter the 6-digit OTP code below.');
        setIsLoading(false);
        return;
      } else {
        const res = await verifyPhoneOtp(phoneNumber, otpCode);
        if (res.error) {
          setErrorMessage(res.error);
          setIsLoading(false);
          return;
        }
        setSuccessText('Phone verified & signed in!');
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsLoading(false);
          onSuccess?.();
          onClose();
        }, 1000);
        return;
      }
    }

    // 2. Email Sign In
    if (mode === 'login') {
      const res = await signInWithEmail(email, password);
      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }
      setSuccessText('Welcome back to Hacker\'s Unity!');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsLoading(false);
        onSuccess?.();
        onClose();
      }, 1000);
    } else {
      // 3. Email Sign Up
      const res = await signUpWithEmail(email, password, name, phoneNumber);
      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      if (res.needsEmailConfirmation) {
        setInfoMessage(res.message || 'Account created! Please check your email to verify your account or sign in.');
        setIsLoading(false);
        return;
      }

      setSuccessText('Account created & signed in successfully!');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsLoading(false);
        onSuccess?.();
        onClose();
      }, 1200);
    }
  };

  const handleOAuth = async (provider: 'google' = 'google') => {
    setIsLoading(true);
    setErrorMessage(null);
    const res = await signInWithOAuth(provider);
    if (res.error) {
      setErrorMessage(res.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md p-6 sm:p-7 overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{successText}</h3>
            <p className="text-xs text-slate-500">Your session is authenticated with Supabase.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-5 flex flex-col items-center">
              <Logo size={52} showText={false} className="mb-2" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {mode === 'login' ? 'Sign In to Hacker\'s Unity' : 'Create Builder Account'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Join 50,000+ developers competing in premier hackathons.
              </p>
            </div>

            {/* Mode Switcher: Sign In vs Sign Up */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setInfoMessage(null);
                  setOtpSent(false);
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-white text-[#0099e6] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setInfoMessage(null);
                  setOtpSent(false);
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-white text-[#0099e6] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Info / Email Confirmation Alert */}
            {infoMessage && (
              <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-start gap-2 animate-in fade-in">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0099e6]" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* Social OAuth Button: Google */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Method switch: Email vs Phone */}
            <div className="flex items-center justify-between mb-3 text-[11px] text-slate-500 font-bold border-b border-slate-100 pb-2">
              <span>Or continue with:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('email');
                    setOtpSent(false);
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  className={`cursor-pointer ${method === 'email' ? 'text-[#0099e6] underline' : 'hover:text-slate-800'}`}
                >
                  Email & Password
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('phone');
                    setOtpSent(false);
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  className={`cursor-pointer ${method === 'phone' ? 'text-[#0099e6] underline' : 'hover:text-slate-800'}`}
                >
                  Mobile Number
                </button>
              </div>
            </div>


            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Method 1: Email Mode */}
              {method === 'email' && (
                <>
                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Satoshi Nakamoto"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="builder@hackersunity.dev"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Method 2: Phone Mode */}
              {method === 'phone' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="+919876543210 (with country code)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={otpSent}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit SMS Code *</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0099e6] rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none tracking-widest font-mono text-center font-bold"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm shadow-sky-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Supabase...</span>
                  </>
                ) : (
                  <span>
                    {method === 'phone'
                      ? otpSent
                        ? 'Verify SMS OTP'
                        : 'Send SMS OTP Code'
                      : mode === 'login'
                      ? 'Sign In to Arena'
                      : 'Create Builder Account'}
                  </span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
