-- ==============================================================================
-- Hacker's Unity - Admin Approval Workflow Migration
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Update the status check constraint on the events table
-- This allows events to be in PENDING_APPROVAL and REJECTED states
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE public.events ADD CONSTRAINT events_status_check 
  CHECK (status IN (
    'DRAFT', 
    'PENDING_APPROVAL', 
    'PUBLISHED', 
    'REGISTRATION_OPEN', 
    'LIVE', 
    'JUDGING', 
    'COMPLETED', 
    'ARCHIVED', 
    'REJECTED'
  ));

-- 2. Add moderation & administrative review columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS admin_feedback TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS host_type TEXT DEFAULT 'COLLEGE';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS institution_name TEXT;

-- 3. Ensure realtime is enabled for the events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
END $$;
