'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'authenticating' | 'error'>('authenticating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function processAuth() {
      try {
        const code = searchParams.get('code');
        const next = searchParams.get('next') || '/dashboard';
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(errorDescription || error);
          }
          return;
        }

        if (code) {
          console.log('[OAuth Callback] 🔄 Exchanging PKCE code for session in browser...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            // Check if session is already established by cookies
            const { data: checkData } = await supabase.auth.getSession();
            if (checkData.session && isMounted) {
              console.log('[OAuth Callback] ✅ Session active! Redirecting to:', next);
              router.replace(next);
              return;
            }

            console.error('[OAuth Callback] ❌ Exchange error:', exchangeError);
            if (isMounted) {
              setStatus('error');
              setErrorMessage(exchangeError.message);
            }
            return;
          }

          if (data.session && isMounted) {
            console.log('[OAuth Callback] ✅ Session authenticated successfully! Redirecting to:', next);
            router.replace(next);
            return;
          }
        }

        // Fallback: check if session is already established
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          console.log('[OAuth Callback] ✅ Existing session found, redirecting to:', next);
          router.replace(next);
          return;
        }

        // If no code and no session after 1s, redirect to home
        setTimeout(() => {
          if (isMounted) {
            router.replace(next);
          }
        }, 1000);
      } catch (err: any) {
        console.error('[OAuth Callback] ❌ Unexpected auth error:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err.message || 'Authentication error');
        }
      }
    }

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0d121f] border border-rose-800/80 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-black text-white">Authentication Failed</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {errorMessage || 'Unable to complete sign-in. Please try again.'}
          </p>
          <div className="pt-4">
            <button
              onClick={() => router.replace('/dashboard')}
              className="px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4">
      <div className="p-8 rounded-3xl bg-[#0d121f]/90 border border-slate-800 backdrop-blur-xl text-center space-y-4 shadow-2xl">
        <Loader2 className="w-10 h-10 text-[#0099e6] animate-spin mx-auto" />
        <h3 className="text-lg font-black text-white">Authenticating with Google</h3>
        <p className="text-xs text-slate-400">Verifying session tokens & loading your builder workspace...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4">
          <Loader2 className="w-10 h-10 text-[#0099e6] animate-spin" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
