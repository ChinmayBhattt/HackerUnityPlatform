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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API /api/registrations error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
