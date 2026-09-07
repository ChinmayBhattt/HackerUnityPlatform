'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/auth/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0099e6] mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
            Enter the email address associated with your account and we&apos;ll send you a secure link to reset your password.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200/80 flex items-center gap-3 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-800 text-xs font-semibold leading-relaxed">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-900">Reset link sent!</p>
                <p className="mt-1">
                  We&apos;ve sent an email to <span className="font-bold">{email}</span> with instructions to reset your password.
                </p>
                <p className="mt-2 text-[11px] text-emerald-700">
                  Please check your inbox (and spam folder). The link will expire in 1 hour.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
              }}
              className="w-full py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
            >
              Send to a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-[#eb3e45] hover:bg-[#d93037] text-white font-extrabold text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
