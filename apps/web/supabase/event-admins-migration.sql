-- ==============================================================================
-- Hacker's Unity Platform - Event Organizing Team & Co-Host Admins Migration
-- ==============================================================================

-- 1. Add admin_invite_code column to events if not exists
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS admin_invite_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_admin_invite_code 
  ON public.events(admin_invite_code) 
  WHERE admin_invite_code IS NOT NULL;

-- 2. Create event_admins table
CREATE TABLE IF NOT EXISTS public.event_admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'ADMIN' CHECK (role IN ('OWNER', 'ADMIN', 'CO_HOST')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_event_admins_event_id ON public.event_admins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_user_id ON public.event_admins(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.event_admins ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for event_admins
DROP POLICY IF EXISTS "Public can view event admins" ON public.event_admins;
CREATE POLICY "Public can view event admins" ON public.event_admins
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can join as admin via valid link" ON public.event_admins;
CREATE POLICY "Authenticated users can join as admin via valid link" ON public.event_admins
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT organizer_id FROM public.events WHERE id = event_id)
  );

DROP POLICY IF EXISTS "Event owners can delete admins or admins can leave" ON public.event_admins;
CREATE POLICY "Event owners can delete admins or admins can leave" ON public.event_admins
  FOR DELETE USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT organizer_id FROM public.events WHERE id = event_id)
  );

-- 6. Helper function to backfill existing events with invite codes if null
CREATE OR REPLACE FUNCTION public.ensure_event_invite_code(target_event_id UUID)
RETURNS TEXT AS $$
DECLARE
  existing_code TEXT;
  new_code TEXT;
BEGIN
  SELECT admin_invite_code INTO existing_code FROM public.events WHERE id = target_event_id;
  IF existing_code IS NOT NULL AND existing_code <> '' THEN
    RETURN existing_code;
  END IF;

  -- Generate 16-char random alphanumeric token
  new_code := 'hu_adm_' || SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 12);
  UPDATE public.events SET admin_invite_code = new_code WHERE id = target_event_id;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
