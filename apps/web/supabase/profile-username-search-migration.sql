-- ==============================================================================
-- Hacker's Unity Platform - Real-time Username & Profile Search Migration
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. ADD USERNAME COLUMN TO PROFILES TABLE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. CREATE CASE-INSENSITIVE UNIQUE INDEX ON USERNAME
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (LOWER(username));

-- 3. BACKFILL EXISTING PROFILES WITH CLEAN UNIQUE USERNAMES
-- (Derived from email prefix or name, lowercase, only alphanumeric and underscores)
DO $$
DECLARE
  rec RECORD;
  base_uname TEXT;
  candidate_uname TEXT;
  counter INT;
BEGIN
  FOR rec IN SELECT id, email, name, username FROM public.profiles WHERE username IS NULL OR trim(username) = ''
  LOOP
    -- Generate base handle from email prefix if available, else name
    IF rec.email IS NOT NULL AND split_part(rec.email, '@', 1) != '' THEN
      base_uname := lower(regexp_replace(split_part(rec.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
    ELSIF rec.name IS NOT NULL AND trim(rec.name) != '' THEN
      base_uname := lower(regexp_replace(rec.name, '[^a-zA-Z0-9_]', '', 'g'));
    ELSE
      base_uname := 'builder';
    END IF;

    -- Ensure base_uname is at least 3 chars
    IF length(base_uname) < 3 THEN
      base_uname := base_uname || '_' || substring(rec.id::text from 1 for 4);
    END IF;

    candidate_uname := base_uname;
    counter := 1;

    -- Find unique candidate
    WHILE EXISTS (
      SELECT 1 FROM public.profiles
      WHERE lower(username) = candidate_uname AND id != rec.id
    ) LOOP
      candidate_uname := base_uname || counter;
      counter := counter + 1;
    END LOOP;

    -- Update row
    UPDATE public.profiles
    SET username = candidate_uname
    WHERE id = rec.id;
  END LOOP;
END $$;

-- 4. FAST SEARCH INDEXES (For live real-time autocomplete & search)
CREATE INDEX IF NOT EXISTS idx_profiles_name_search
  ON public.profiles (name);

CREATE INDEX IF NOT EXISTS idx_profiles_username_search
  ON public.profiles (username);

-- 5. UPDATE AUTH USER CREATION TRIGGER TO AUTOMATICALLY SET USERNAME
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_uname TEXT;
  candidate_uname TEXT;
  counter INT;
BEGIN
  -- Extract username from user_metadata or derive from email/name
  candidate_uname := lower(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'username', ''), '[^a-zA-Z0-9_]', '', 'g'));
  
  IF candidate_uname IS NULL OR length(candidate_uname) < 3 THEN
    base_uname := lower(regexp_replace(split_part(COALESCE(NEW.email, ''), '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
    IF length(base_uname) < 3 THEN
      base_uname := 'builder_' || substring(NEW.id::text from 1 for 4);
    END IF;
    candidate_uname := base_uname;
    counter := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.profiles
      WHERE lower(username) = candidate_uname AND id != NEW.id
    ) LOOP
      candidate_uname := base_uname || counter;
      counter := counter + 1;
    END LOOP;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    name,
    username,
    role,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, concat(NEW.id, '@user.hackersunity.dev')),
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(COALESCE(NEW.email, ''), '@', 1),
      'Hacker'
    ),
    candidate_uname,
    COALESCE(NEW.raw_user_meta_data->>'role', 'PARTICIPANT'),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Resilient fallback: ensure auth signup is never blocked
    RAISE WARNING 'handle_new_user trigger warning: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind trigger on auth.users if not already active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. REALTIME REPLICATION CONFIGURATION FOR PROFILES, SUBMISSIONS, REGISTRATIONS
DO $$
DECLARE
  tbl text;
  tables_to_add text[] := ARRAY['profiles', 'submissions', 'registrations', 'events'];
BEGIN
  FOREACH tbl IN ARRAY tables_to_add
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) AND NOT EXISTS (
      SELECT 1 
      FROM pg_publication_rel pr
      JOIN pg_publication p ON p.oid = pr.prpubid
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE p.pubname = 'supabase_realtime' 
        AND n.nspname = 'public' 
        AND c.relname = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    END IF;
  END LOOP;
END $$;

-- 7. ENSURE RLS POLICIES FOR PUBLIC PARTICIPATIONS & WINNINGS
-- Public read of user submissions (winnings/projects)
DROP POLICY IF EXISTS "Submissions viewable by everyone" ON public.submissions;
CREATE POLICY "Submissions viewable by everyone" ON public.submissions
  FOR SELECT USING (true);

-- Public read of confirmed registrations (participations showcase)
DROP POLICY IF EXISTS "Public can view confirmed registrations" ON public.registrations;
CREATE POLICY "Public can view confirmed registrations" ON public.registrations
  FOR SELECT USING (status = 'CONFIRMED' OR auth.uid() = user_id);

-- Ensure public read for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
