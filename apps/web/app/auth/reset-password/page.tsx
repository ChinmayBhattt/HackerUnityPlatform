'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  validatePassword,
  PASSWORD_STRENGTH_LABELS,
  PASSWORD_STRENGTH_COLORS,
} from '@/lib/password-validation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Check if session exists (from PKCE exchange or recovery token)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setErrorMessage(validation.errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const strengthRes = validatePassword(password);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
            Please enter your new secure password below to regain access to your account.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200/80 flex items-center gap-3 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {hasSession === false && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Recovery link expired or invalid</p>
              <p className="mt-0.5 text-amber-700">
                Please request a new password reset link from the{' '}
                <Link href="/forgot-password" className="underline font-bold">
                  Forgot Password
                </Link>{' '}
                page.
              </p>
            </div>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-800 text-xs font-semibold leading-relaxed">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-900">Password updated!</p>
                <p className="mt-1">
                  Your password has been successfully updated. You can now use your new password to sign in.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0088cc] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {password && (
              <div className="space-y-1.5 px-1 py-0.5">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-500">Strength:</span>
                  <span style={{ color: PASSWORD_STRENGTH_COLORS[strengthRes.strength] }}>
                    {PASSWORD_STRENGTH_LABELS[strengthRes.strength]}
                  </span>
                </div>
                <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  {[0, 1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className="flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor:
                          step < strengthRes.strength
                            ? PASSWORD_STRENGTH_COLORS[strengthRes.strength]
                            : '#e2e8f0',
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  Must be at least 8 characters with uppercase, lowercase, and a number.
                </p>
              </div>
            )}

            <div className="relative">
              <label htmlFor="confirm-new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-new-password"
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0088cc] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
