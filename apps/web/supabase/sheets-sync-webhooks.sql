-- ==============================================================================
-- Hacker's Unity - Supabase to Google Sheets Realtime Synchronization Setup
-- Target Spreadsheet: https://docs.google.com/spreadsheets/d/104nHo8CjXSjDLlQ6kKr28jwfC0YD2Zrip_ZY6OxAZuE
-- Service Account: hackers-unity-sheets@premium-catbird-457008-b2.iam.gserviceaccount.com
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- METHOD 1: RECOMMENDED - SUPABASE DASHBOARD DATABASE WEBHOOKS (Easiest & Robust)
-- ─────────────────────────────────────────────────────────────────────────────
/*
In your Supabase Dashboard:
1. Go to "Database" -> "Webhooks" -> Click "Create a webhook".
2. Name: "sheets_sync_profiles" (repeat for each table).
3. Table: Select table (e.g., "profiles").
4. Events: Check [x] Insert, [x] Update, [x] Delete.
5. Webhook Type: HTTP Request.
6. Method: POST.
7. URL: 
   https://hackersunity.com/api/webhooks/supabase-to-sheets
   (Or your local tunnel URL during development, e.g. https://your-domain/api/webhooks/supabase-to-sheets)
8. HTTP Headers:
   - Content-Type: application/json
   - x-webhook-secret: <YOUR_SHEETS_SYNC_SECRET>
9. Click "Save webhook".

Repeat for the 15 configured tables:
- profiles
- events
- registrations
- submissions
- teams
- team_members
- team_invitations
- bookmarks
- contact_inquiries
- contact_messages
- mentor_applications
- news
- newsletter_subscribers
- notifications
- user_notifications
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- METHOD 2: SQL-LEVEL WEBHOOK TRIGGERS USING PG_NET
-- (Automates webhooks directly from Postgres if pg_net is enabled)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pg_net extension if available
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- Master trigger function that forwards Postgres changes as JSON to webhook URL
CREATE OR REPLACE FUNCTION public.fn_sync_to_google_sheets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook_url TEXT := 'https://hackersunity.com/api/webhooks/supabase-to-sheets';
  v_secret TEXT := 'hu_sheets_sync_live_secret'; -- Set matching SHEETS_SYNC_SECRET
  v_payload JSONB;
BEGIN
  v_payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    'old_record', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END
  );

  -- Perform asynchronous HTTP POST via pg_net (non-blocking for fast database commits)
  BEGIN
    PERFORM net.http_post(
      url := v_webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', v_secret
      ),
      body := v_payload
    );
  EXCEPTION WHEN OTHERS THEN
    -- Prevent network errors from aborting user database transactions
    RAISE WARNING '[SheetsSync Webhook] HTTP dispatch warning: %', SQLERRM;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ATTACH TRIGGERS TO ALL 15 PLATFORM TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Profiles
DROP TRIGGER IF EXISTS trg_sheets_sync_profiles ON public.profiles;
CREATE TRIGGER trg_sheets_sync_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 2. Events
DROP TRIGGER IF EXISTS trg_sheets_sync_events ON public.events;
CREATE TRIGGER trg_sheets_sync_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 3. Registrations
DROP TRIGGER IF EXISTS trg_sheets_sync_registrations ON public.registrations;
CREATE TRIGGER trg_sheets_sync_registrations
  AFTER INSERT OR UPDATE OR DELETE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 4. Submissions
DROP TRIGGER IF EXISTS trg_sheets_sync_submissions ON public.submissions;
CREATE TRIGGER trg_sheets_sync_submissions
  AFTER INSERT OR UPDATE OR DELETE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 5. Teams
DROP TRIGGER IF EXISTS trg_sheets_sync_teams ON public.teams;
CREATE TRIGGER trg_sheets_sync_teams
  AFTER INSERT OR UPDATE OR DELETE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 6. Team Members
DROP TRIGGER IF EXISTS trg_sheets_sync_team_members ON public.team_members;
CREATE TRIGGER trg_sheets_sync_team_members
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 7. Team Invitations
DROP TRIGGER IF EXISTS trg_sheets_sync_team_invitations ON public.team_invitations;
CREATE TRIGGER trg_sheets_sync_team_invitations
  AFTER INSERT OR UPDATE OR DELETE ON public.team_invitations
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 8. Bookmarks
DROP TRIGGER IF EXISTS trg_sheets_sync_bookmarks ON public.bookmarks;
CREATE TRIGGER trg_sheets_sync_bookmarks
  AFTER INSERT OR UPDATE OR DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 9. Contact Inquiries
DROP TRIGGER IF EXISTS trg_sheets_sync_contact_inquiries ON public.contact_inquiries;
CREATE TRIGGER trg_sheets_sync_contact_inquiries
  AFTER INSERT OR UPDATE OR DELETE ON public.contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 10. Contact Messages
DROP TRIGGER IF EXISTS trg_sheets_sync_contact_messages ON public.contact_messages;
CREATE TRIGGER trg_sheets_sync_contact_messages
  AFTER INSERT OR UPDATE OR DELETE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 11. Mentor Applications
DROP TRIGGER IF EXISTS trg_sheets_sync_mentor_applications ON public.mentor_applications;
CREATE TRIGGER trg_sheets_sync_mentor_applications
  AFTER INSERT OR UPDATE OR DELETE ON public.mentor_applications
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 12. News
DROP TRIGGER IF EXISTS trg_sheets_sync_news ON public.news;
CREATE TRIGGER trg_sheets_sync_news
  AFTER INSERT OR UPDATE OR DELETE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 13. Newsletter Subscribers
DROP TRIGGER IF EXISTS trg_sheets_sync_newsletter_subscribers ON public.newsletter_subscribers;
CREATE TRIGGER trg_sheets_sync_newsletter_subscribers
  AFTER INSERT OR UPDATE OR DELETE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 14. Notifications
DROP TRIGGER IF EXISTS trg_sheets_sync_notifications ON public.notifications;
CREATE TRIGGER trg_sheets_sync_notifications
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();

-- 15. User Notifications
DROP TRIGGER IF EXISTS trg_sheets_sync_user_notifications ON public.user_notifications;
CREATE TRIGGER trg_sheets_sync_user_notifications
  AFTER INSERT OR UPDATE OR DELETE ON public.user_notifications
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_google_sheets();
