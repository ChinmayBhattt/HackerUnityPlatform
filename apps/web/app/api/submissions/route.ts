import { NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAdminClient,
  unauthorizedResponse,
} from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId parameter' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();
    let resolvedEventId = eventId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    if (!isUuid) {
      const { data: eventData } = await serverSupabase
        .from('events')
        .select('id')
        .eq('slug', eventId)
        .maybeSingle();
      if (eventData?.id) {
        resolvedEventId = eventData.id;
      } else {
        // Event not found in DB (e.g. mock/local event)
        return NextResponse.json({ success: true, submissions: [] });
      }
    }

    const { data, error } = await serverSupabase
      .from('submissions')
      .select(`
        *,
        profiles:submitter_id (
          id,
          name,
          email,
          avatar_url,
          college
        )
      `)
      .eq('event_id', resolvedEventId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message, submissions: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, submissions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be signed in to submit a project.');
    }

    const serverSupabase = createAdminClient();
    const body = await req.json();
    const { action, submission, webhookUrl } = body;

    // Trigger Google Apps Script Webhook
    if (action === 'sync_webhook' && webhookUrl && submission) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            event: submission.eventName || submission.eventId,
            projectTitle: submission.projectTitle,
            submitterName: auth.user.user_metadata?.name || submission.submittedByName || 'Hacker',
            submitterEmail: auth.email || submission.submittedByEmail || '',
            track: submission.track || 'General',
            repoUrl: submission.projectLink,
            demoUrl: submission.demoVideoUrl || '',
            presentationUrl: submission.presentationUrl || '',
            status: submission.status || 'SUBMITTED',
            score: submission.score || 0,
          }),
        });
        return NextResponse.json({ success: true, message: 'Google Sheets webhook triggered' });
      } catch (webhookErr: any) {
        console.warn('Webhook dispatch notice:', webhookErr.message);
        return NextResponse.json({ success: true, warning: 'Webhook dispatched with notice' });
      }
    }

    // Save or update submission in Supabase
    if (submission) {
      let targetEventId = submission.eventId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submission.eventId);
      if (!isUuid) {
        const { data: ev } = await serverSupabase
          .from('events')
          .select('id')
          .eq('slug', submission.eventId)
          .maybeSingle();
        if (ev?.id) {
          targetEventId = ev.id;
        } else {
          // Event not in DB, client storage handles it
          return NextResponse.json({ success: true, localOnly: true });
        }
      }

      // Bind submission to authenticated user ID
      const targetSubmitterId = auth.userId;

      // Ensure submitter profile exists
      const { data: prof } = await serverSupabase
        .from('profiles')
        .select('id')
        .eq('id', targetSubmitterId)
        .maybeSingle();

      if (!prof) {
        await serverSupabase.from('profiles').insert({
          id: targetSubmitterId,
          name: auth.user.user_metadata?.name || submission.submittedByName || 'Hacker',
          email: auth.email,
          updated_at: new Date().toISOString(),
        });
      }

      const submissionPayload = {
        event_id: targetEventId,
        submitter_id: targetSubmitterId,
        project_name: submission.projectTitle,
        tagline: submission.tagline || '',
        description: submission.projectDescription,
        repo_url: submission.projectLink,
        demo_url: submission.demoVideoUrl || '',
        video_url: submission.demoVideoUrl || '',
        track: submission.track || 'General',
        status: submission.status || 'SUBMITTED',
        score: submission.score || 0,
        created_at: submission.submittedAt || new Date().toISOString(),
      };

      // Robust upsert without relying on non-existent unique constraints
      const { data: existingSub } = await serverSupabase
        .from('submissions')
        .select('id')
        .eq('event_id', targetEventId)
        .eq('submitter_id', targetSubmitterId)
        .maybeSingle();

      let data: any = null;
      let error: any = null;

      if (existingSub?.id) {
        const updateRes = await serverSupabase
          .from('submissions')
          .update(submissionPayload)
          .eq('id', existingSub.id)
          .select()
          .maybeSingle();
        data = updateRes.data;
        error = updateRes.error;
      } else {
        const insertRes = await serverSupabase
          .from('submissions')
          .insert(submissionPayload)
          .select()
          .maybeSingle();
        data = insertRes.data;
        error = insertRes.error;
      }

      if (error) {
        console.error('Failed to save submission:', error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Realtime Broadcast across event channel
      try {
        const channel = serverSupabase.channel(`submissions_stream_${targetEventId}`);
        await channel.send({
          type: 'broadcast',
          event: 'submission_created',
          payload: { submission: data || submission },
        });
      } catch (broadcastErr) {}

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
