-- ==============================================================================
-- Hacker's Unity Platform - Contact Inquiries Migration
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. Create Contact Inquiries Table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  inquiry_type TEXT NOT NULL DEFAULT 'general' CHECK (inquiry_type IN ('general', 'host', 'sponsor', 'support')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Anyone (including unauthenticated guests) can submit an inquiry
DROP POLICY IF EXISTS "Anyone can submit contact inquiry" ON public.contact_inquiries;
CREATE POLICY "Anyone can submit contact inquiry"
  ON public.contact_inquiries
  FOR INSERT
  WITH CHECK (true);

-- 4. Policy: Admins can view all inquiries
DROP POLICY IF EXISTS "Admins can view contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can view contact inquiries"
  ON public.contact_inquiries
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- 5. Policy: Admins can update inquiry status
DROP POLICY IF EXISTS "Admins can update contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can update contact inquiries"
  ON public.contact_inquiries
  FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN'));

-- 6. Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON public.contact_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries(created_at DESC);
