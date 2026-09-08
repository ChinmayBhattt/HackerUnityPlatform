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

-- 2. Fix any existing blank or null emails in profiles table to prevent unique constraint violation
UPDATE public.profiles
SET email = concat(id, '@user.hackersunity.dev')
WHERE email IS NULL OR trim(email) = '';

-- 3. Backfill profiles for all existing auth users who don't have a profile yet
-- (Uses unique placeholder email if auth.users email is blank, null, or duplicate)
INSERT INTO public.profiles (id, email, name, role, updated_at)
SELECT DISTINCT ON (u.id)
  u.id,
  CASE
    WHEN u.email IS NOT NULL AND trim(u.email) != '' AND NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.email = trim(u.email) AND p.id != u.id
    ) THEN trim(u.email)
    ELSE concat(u.id, '@user.hackersunity.dev')
  END AS email,
  COALESCE(
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    NULLIF(split_part(COALESCE(u.email, ''), '@', 1), ''),
    'Hacker'
  ) AS name,
  COALESCE(u.raw_user_meta_data->>'role', 'PARTICIPANT') AS role,
  NOW() AS updated_at
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Automatic trigger: guarantees any newly created user in auth.users immediately gets a public.profiles row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  clean_email TEXT;
  user_name TEXT;
BEGIN
  clean_email := NULLIF(trim(NEW.email), '');
  IF clean_email IS NULL THEN
    clean_email := concat(NEW.id, '@user.hackersunity.dev');
  END IF;

  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NULLIF(split_part(clean_email, '@', 1), ''),
    'Hacker'
  );

  INSERT INTO public.profiles (id, email, name, role, avatar_url)
  VALUES (
    NEW.id,
    clean_email,
    user_name,
    COALESCE(NEW.raw_user_meta_data->>'role', 'PARTICIPANT'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If email already exists in profiles under another account, assign unique id email fallback
    BEGIN
      INSERT INTO public.profiles (id, email, name, role, avatar_url)
      VALUES (
        NEW.id,
        concat(NEW.id, '@user.hackersunity.dev'),
        user_name,
        COALESCE(NEW.raw_user_meta_data->>'role', 'PARTICIPANT'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN NEW;
    END;
    RETURN NEW;
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify RLS policies for profiles so users can insert their own profile
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
