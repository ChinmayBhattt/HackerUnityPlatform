'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cookie,
  ShieldCheck,
  BarChart3,
  Sliders,
  Megaphone,
  X,
  Check,
  Settings2,
} from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: true,
  functional: true,
  marketing: false,
};

const CONSENT_STATUS_KEY = 'hu_cookie_consent';
const PREFERENCES_KEY = 'hu_cookie_preferences';

declare global {
  interface Window {
    openCookieSettings?: () => void;
  }
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [saveToast, setSaveToast] = useState(false);

  // Initialize on mount
  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem(CONSENT_STATUS_KEY);
      const storedPrefs = localStorage.getItem(PREFERENCES_KEY);

      if (storedPrefs) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...JSON.parse(storedPrefs),
          necessary: true, // Always true
        });
      }

      // If user hasn't accepted/rejected yet, show banner after brief delay
      if (!storedConsent) {
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors (incognito mode, etc)
    }
  }, []);

  // Set up global triggers
  useEffect(() => {
    const handleOpenSettings = () => {
      // When opening settings, make sure current preferences are loaded
      try {
        const storedPrefs = localStorage.getItem(PREFERENCES_KEY);
        if (storedPrefs) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...JSON.parse(storedPrefs),
            necessary: true,
          });
        }
      } catch {
        // Ignore
      }
      setShowBanner(false);
      setShowModal(true);
    };

    window.openCookieSettings = handleOpenSettings;
    window.addEventListener('open_cookie_settings', handleOpenSettings);
    window.addEventListener('open_cookie_consent', handleOpenSettings);

    return () => {
      delete window.openCookieSettings;
      window.removeEventListener('open_cookie_settings', handleOpenSettings);
      window.removeEventListener('open_cookie_consent', handleOpenSettings);
    };
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const saveAndClose = (prefs: CookiePreferences, status: 'accepted' | 'rejected' | 'custom') => {
    try {
      localStorage.setItem(CONSENT_STATUS_KEY, status);
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore
    }

    setPreferences(prefs);
    setShowBanner(false);
    setShowModal(false);

    // Show temporary confirmation
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
    };
    saveAndClose(allAccepted, 'accepted');
  };

  const handleRejectAll = () => {
    const rejected: CookiePreferences = {
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
    };
    saveAndClose(rejected, 'rejected');
  };

  const handleSaveCustom = () => {
    saveAndClose(preferences, 'custom');
  };

  return (
    <>
      {/* ─── Success Feedback Toast ────────────────────────────────────── */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-[100000] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-semibold shadow-2xl shadow-emerald-900/30 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <Check className="w-4 h-4 text-white shrink-0" />
          <span>Cookie preferences saved successfully!</span>
        </div>
      )}

      {/* ─── Bottom Floating Banner ───────────────────────────────────── */}
      {showBanner && !showModal && (
        <aside
          role="dialog"
          aria-label="Cookie consent banner"
          className="
            fixed bottom-4 left-4 right-4 sm:right-auto sm:left-6 sm:bottom-6 z-[9999]
            w-auto sm:w-[420px] max-w-[calc(100vw-32px)]
            rounded-3xl p-5 sm:p-6
            bg-white/95 dark:bg-[#0b101b]/95 backdrop-blur-xl
            border border-slate-200/90 dark:border-slate-800
            shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]
            transition-all duration-300 animate-in slide-in-from-bottom-6 fade-in
          "
        >
          <div className="flex items-start gap-3.5 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 flex items-center justify-center shrink-0 text-[#0099e6]">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                We Value Your Privacy
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Hacker&apos;s Unity uses cookies to keep your account secure, measure platform performance, and enhance your hackathon experience.{' '}
                <Link
                  href="/privacy"
                  className="text-[#0099e6] hover:underline font-medium"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0099e6] to-[#f97316] hover:opacity-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer text-center"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={handleRejectAll}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer text-center"
            >
              Reject Non-Essential
            </button>
            <button
              type="button"
              onClick={() => {
                setShowBanner(false);
                setShowModal(true);
              }}
              className="px-2.5 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>
          </div>
        </aside>
      )}

      {/* ─── Dedicated Cookie Settings Modal ──────────────────────────── */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 flex items-center justify-center text-[#0099e6] shrink-0">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Cookie Preferences
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Control which cookies and tracking tools you permit on Hacker&apos;s Unity.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Category 1: Strictly Necessary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Strictly Necessary Cookies
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Always Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Essential for platform security, user authentication, session persistence, and fraud protection. The website cannot function securely without these cookies.
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    aria-label="Strictly Necessary Cookies (Always Active)"
                    className="w-4 h-4 accent-[#0099e6] cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              {/* Category 2: Performance & Analytics */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#0099e6] shrink-0" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Analytics & Performance
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Allows us to count visits and traffic sources so we can measure and improve hackathon page loading speeds, discover popular features, and optimize user experience.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0099e6]" />
                </label>
              </div>

              {/* Category 3: Functional & Personalization */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-violet-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Functional & Personalization
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Enables enhanced website functionality and personalization, such as remembering your preferred theme (dark/light), saved draft submissions, and search filters.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) =>
                      setPreferences({ ...preferences, functional: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500" />
                </label>
              </div>

              {/* Category 4: Marketing & Announcements */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#f97316] shrink-0" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Marketing & Announcements
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Used to deliver customized notifications regarding upcoming sponsored hackathons, cash prize announcements, and community meetup invitations.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f97316]" />
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={handleRejectAll}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Reject Non-Essential
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0099e6] to-[#f97316] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
