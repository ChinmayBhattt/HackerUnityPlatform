-- ==============================================================================
-- Hacker's Unity Platform - Fix Foreign Key Violations (Profiles & Teams)
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. Ensure profiles table exists with proper columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'PARTICIPANT' CHECK (role IN ('PARTICIPANT', 'ORGANIZER', 'ADMIN', 'JUDGE')),
  college TEXT,
  organization TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  elo_score INTEGER DEFAULT 1200,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Backfill profiles for all existing auth users who don't have a profile yet
INSERT INTO public.profiles (id, email, name, role, updated_at)
SELECT 
  id,
  COALESCE(email, ''),
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Hacker'),
  COALESCE(raw_user_meta_data->>'role', 'PARTICIPANT'),
  NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = CASE 
    WHEN public.profiles.name IS NULL OR public.profiles.name = '' OR public.profiles.name = 'Hacker' 
    THEN EXCLUDED.name 
    ELSE public.profiles.name 
  END;

-- 3. Automatic trigger: guarantees any newly created user in auth.users immediately gets a public.profiles row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Hacker'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'PARTICIPANT'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify RLS policies for profiles so users can insert their own profile
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
