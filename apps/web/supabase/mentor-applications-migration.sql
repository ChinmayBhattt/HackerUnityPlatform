-- ==============================================================================
-- Hacker's Unity Platform - Mentor Applications Migration
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. Create Mentor Applications Table
CREATE TABLE IF NOT EXISTS public.mentor_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Anyone (including unauthenticated guests) can submit an application
DROP POLICY IF EXISTS "Anyone can submit mentor application" ON public.mentor_applications;
CREATE POLICY "Anyone can submit mentor application"
  ON public.mentor_applications
  FOR INSERT
  WITH CHECK (true);

-- 4. Policy: Admins can view all mentor applications
DROP POLICY IF EXISTS "Admins can view mentor applications" ON public.mentor_applications;
CREATE POLICY "Admins can view mentor applications"
  ON public.mentor_applications
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

-- 5. Policy: Admins can update application status
DROP POLICY IF EXISTS "Admins can update mentor applications" ON public.mentor_applications;
CREATE POLICY "Admins can update mentor applications"
  ON public.mentor_applications
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

-- 6. Indexes for queries
CREATE INDEX IF NOT EXISTS idx_mentor_applications_email ON public.mentor_applications(email);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_status ON public.mentor_applications(status);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_created_at ON public.mentor_applications(created_at DESC);
