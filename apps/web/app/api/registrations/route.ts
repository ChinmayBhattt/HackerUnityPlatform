import { NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAdminClient,
  unauthorizedResponse,
} from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be signed in to register for an event.');
    }

    const body = await req.json();
    const { input } = body;

    if (!input || !input.eventId) {
      return NextResponse.json({ error: 'Missing required registration fields' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();

    // Resolve event UUID if slug provided
    let targetEventId = input.eventId;
    const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.eventId);
    if (!isEventUuid) {
      const { data: eventData } = await serverSupabase
        .from('events')
        .select('id')
        .eq('slug', input.eventId)
        .maybeSingle();
      if (eventData?.id) {
        targetEventId = eventData.id;
      } else {
        // Custom or local event not stored in database
        return NextResponse.json({ success: true, localOnly: true });
      }
    }

    // Always bind registration to authenticated user's ID and email
    const validUserId = auth.userId;
    const userEmail = (auth.email || input.userEmail || '').toLowerCase().trim();

    // Ensure user profile exists
    const { data: existingProf } = await serverSupabase
      .from('profiles')
      .select('id')
      .eq('id', validUserId)
      .maybeSingle();

    if (!existingProf) {
      await serverSupabase.from('profiles').insert({
        id: validUserId,
        name: input.userName || auth.user.user_metadata?.name || 'Hacker',
        email: userEmail,
        phone: input.phone || null,
        college: input.college || null,
        github_url: input.githubUrl || null,
        linkedin_url: input.linkedinUrl || null,
        skills: input.skills || [],
        updated_at: new Date().toISOString(),
      });
    }

    // Check if already registered
    const { data: existingReg } = await serverSupabase
      .from('registrations')
      .select('id')
      .eq('event_id', targetEventId)
      .eq('user_id', validUserId)
      .maybeSingle();

    if (existingReg) {
      return NextResponse.json({ error: 'You are already registered for this event.' }, { status: 400 });
    }

    if (userEmail) {
      const { data: existingEmailReg } = await serverSupabase
        .from('registrations')
        .select('id')
        .eq('event_id', targetEventId)
        .eq('user_email', userEmail)
        .maybeSingle();

      if (existingEmailReg) {
        return NextResponse.json({ error: 'This email is already registered for this event.' }, { status: 400 });
      }
    }

    const payload: any = {
      event_id: targetEventId,
      user_id: validUserId,
      user_name: input.userName || auth.user.user_metadata?.name || 'Hacker',
      user_email: userEmail,
      phone: input.phone || null,
      college: input.college || null,
      city: input.city || null,
      github_url: input.githubUrl || null,
      linkedin_url: input.linkedinUrl || null,
      skills: input.skills || [],
      custom_answers: input.customAnswers || {},
      is_team: Boolean(input.isTeam),
      team_name: input.teamName || null,
      role: input.role || (input.isTeam ? 'Team Leader' : 'Individual Hacker'),
      status: input.status || 'CONFIRMED',
      registered_at: new Date().toISOString(),
    };

    const { error: insertErr } = await serverSupabase
      .from('registrations')
      .insert(payload);

    if (insertErr) {
      console.error('Server Supabase registration error:', insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Sync exact live registration count to events table
    try {
      const { count: exactCount } = await serverSupabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', targetEventId);

      if (typeof exactCount === 'number') {
        await serverSupabase
          .from('events')
          .update({ registration_count: exactCount, updated_at: new Date().toISOString() })
          .eq('id', targetEventId);

        // Realtime broadcast to all clients
        try {
          const channel = serverSupabase.channel('public:events_realtime');
          await channel.send({
            type: 'broadcast',
            event: 'registration_created',
            payload: { eventId: targetEventId, count: exactCount },
          });
        } catch (bcErr) {
          console.warn('Realtime broadcast warning:', bcErr);
        }
      }
    } catch (countErr) {
      console.warn('Failed to update event registration count:', countErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API /api/registrations error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET: Fetch exact realtime registration count for an event
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const slug = searchParams.get('slug');

    if (!eventId && !slug) {
      return NextResponse.json({ error: 'Missing eventId or slug' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();

    let targetEventId = eventId;
    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));
    if (!isUuid) {
      const slugQuery = eventId || slug;
      if (slugQuery) {
        const { data: eventData } = await serverSupabase
          .from('events')
          .select('id, registration_count')
          .eq('slug', slugQuery)
          .maybeSingle();
        if (eventData?.id) {
          targetEventId = eventData.id;
        } else {
          targetEventId = null;
        }
      }
    }

    if (!targetEventId) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Query exact count of real rows in registrations table using service client (bypasses RLS)
    const { count, error } = await serverSupabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', targetEventId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const exactCount = count ?? 0;

    // Keep events.registration_count accurately synced in database
    await serverSupabase
      .from('events')
      .update({ registration_count: exactCount })
      .eq('id', targetEventId);

    return NextResponse.json({
      success: true,
      eventId: targetEventId,
      count: exactCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

