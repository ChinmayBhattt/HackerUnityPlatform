import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qifwhjfisipxkytsqxez.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZndoamZpc2lweGt5dHNxeGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3OTQ2MjksImV4cCI6MjA5MzM3MDYyOX0.nmTHwpcf3SKDMQ8Sf-RdZWBOcPkX66YZQksNViLn8vY';

// Use createBrowserClient from @supabase/ssr so that PKCE code verifiers
// and session tokens are stored in Cookies, ensuring cross-navigation reliability.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
