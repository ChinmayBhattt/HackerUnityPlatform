'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { UserPublic, UserRole } from '@hackers-unity/shared-types';
import { getStoredUser, saveStoredUser, clearStoredUser } from './storage';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: UserPublic | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string,
    phone?: string,
    role?: UserRole
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean; message?: string }>;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<{ error?: string }>;
  signInWithPhone: (phone: string) => Promise<{ error?: string }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error?: string }>;
  updateUserProfile: (updates: Partial<UserPublic>) => Promise<{ error?: string }>;
  updateUserPassword: (newPass: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setSupabaseUser(session.user);
        syncProfileFromSupabaseUser(session.user);
      } else {
        setUser(getStoredUser());
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        setSupabaseUser(session.user);
        await syncProfileFromSupabaseUser(session.user);
      } else if (event === 'SIGNED_OUT' || !session) {
        setSupabaseUser(null);
        setUser(null);
        clearStoredUser();
      }
      setLoading(false);
    });

    const handleStorageChange = () => {
      const stored = getStoredUser();
      if (!supabaseUser) {
        setUser(stored);
      }
    };
    window.addEventListener('hackers_unity_storage_change', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hackers_unity_storage_change', handleStorageChange);
    };
  }, []);

  const syncProfileFromSupabaseUser = async (sbUser: SupabaseUser) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      if (profile) {
        const fullUser: UserPublic = {
          id: profile.id,
          name: profile.name || sbUser.user_metadata?.name || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Hacker',
          email: profile.email || sbUser.email || '',
          phone: profile.phone || sbUser.phone || null,
          role: (profile.role as UserRole) || UserRole.PARTICIPANT,
          college: profile.college || 'Developer Guild',
          organization: profile.organization || 'Hackers Unity',
          graduationYear: 2026,
          bio: profile.bio || 'Passionate builder & hackathon enthusiast.',
          avatarUrl: profile.avatar_url || sbUser.user_metadata?.avatar_url || '⚡',
          skills: profile.skills || ['Next.js', 'TypeScript', 'PostgreSQL'],
          resumeUrl: null,
          socialLinks: {
            github: profile.github_url || 'https://github.com',
            linkedin: profile.linkedin_url || 'https://linkedin.com',
          },
          emailVerified: !!sbUser.email_confirmed_at,
          createdAt: profile.created_at || sbUser.created_at,
        };
        setUser(fullUser);
        saveStoredUser(fullUser);
      } else {
        const initialUser: UserPublic = {
          id: sbUser.id,
          name: sbUser.user_metadata?.name || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Hacker',
          email: sbUser.email || '',
          phone: sbUser.user_metadata?.phone || sbUser.phone || null,
          role: (sbUser.user_metadata?.role as UserRole) || UserRole.PARTICIPANT,
          college: 'Developer Community',
          organization: 'Hackers Unity',
          graduationYear: 2026,
          bio: 'Building future technologies.',
          avatarUrl: sbUser.user_metadata?.avatar_url || '⚡',
          skills: ['Next.js', 'TypeScript'],
          resumeUrl: null,
          socialLinks: {},
          emailVerified: !!sbUser.email_confirmed_at,
          createdAt: sbUser.created_at,
        };
        setUser(initialUser);
        saveStoredUser(initialUser);

        await supabase.from('profiles').upsert({
          id: initialUser.id,
          email: initialUser.email,
          name: initialUser.name,
          role: initialUser.role,
        });
      }
    } catch {
      setUser(getStoredUser());
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) return { error: error.message };
      if (data.user) {
        await syncProfileFromSupabaseUser(data.user);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    phone?: string,
    role: UserRole = UserRole.PARTICIPANT
  ) => {
    try {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            name,
            full_name: name,
            phone: phone || '',
            role,
          },
        },
      });

      if (error) return { error: error.message };

      if (data.user) {
        const createdUser: UserPublic = {
          id: data.user.id,
          name: name,
          email: cleanEmail,
          phone: phone || null,
          role: role,
          college: 'Developer Community',
          organization: 'Hackers Unity',
          graduationYear: 2026,
          bio: 'Building future technologies.',
          avatarUrl: '⚡',
          skills: ['Next.js', 'TypeScript'],
          resumeUrl: null,
          socialLinks: {},
          emailVerified: !!data.user.email_confirmed_at,
          createdAt: data.user.created_at,
        };

        if (data.session) {
          setUser(createdUser);
          saveStoredUser(createdUser);
        }

        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            name: name,
            role: role,
            phone: phone || null,
          });
        } catch (e) {
          console.warn('Profile creation warning:', e);
        }

        if (!data.session) {
          return {
            needsEmailConfirmation: true,
            message: 'Account created! Please check your email to confirm your account or sign in directly.',
          };
        }
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Sign up failed' };
    }
  };

  const signInWithOAuth = async (provider: 'github' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'OAuth error' };
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Phone sign in error' };
    }
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: token.trim(),
        type: 'sms',
      });
      if (error) return { error: error.message };
      if (data.user) {
        await syncProfileFromSupabaseUser(data.user);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'OTP verification failed' };
    }
  };

  const updateUserProfile = async (updates: Partial<UserPublic>) => {
    try {
      if (!user) return { error: 'Not authenticated' };
      const updatedUser: UserPublic = {
        ...user,
        ...updates,
      };
      setUser(updatedUser);
      saveStoredUser(updatedUser);

      // Save to Supabase if authenticated
      if (supabaseUser) {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          name: updatedUser.name,
          college: updatedUser.college,
          organization: updatedUser.organization,
          bio: updatedUser.bio,
          skills: updatedUser.skills,
          avatar_url: updatedUser.avatarUrl,
          phone: updatedUser.phone,
          github_url: updatedUser.socialLinks?.github,
          linkedin_url: updatedUser.socialLinks?.linkedin,
          updated_at: new Date().toISOString(),
        });
        if (error) console.warn('Supabase profile update warning:', error);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Profile update failed' };
    }
  };

  const updateUserPassword = async (newPass: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPass,
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Password update failed' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    clearStoredUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signInWithPhone,
        verifyPhoneOtp,
        updateUserProfile,
        updateUserPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
