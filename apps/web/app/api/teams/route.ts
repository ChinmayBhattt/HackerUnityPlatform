import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qifwhjfisipxkytsqxez.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZndoamZpc2lweGt5dHNxeGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3OTQ2MjksImV4cCI6MjA5MzM3MDYyOX0.nmTHwpcf3SKDMQ8Sf-RdZWBOcPkX66YZQksNViLn8vY';

const serverSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action = 'create', eventId, leaderId, userId, teamName, maxMembers = 4, description = '', teamId, userName, userEmail } = body;

    // 1. CREATE SQUAD ACTION
    if (action === 'create') {
      if (!teamName || !eventId) {
        return NextResponse.json({ error: 'Missing team name or event ID' }, { status: 400 });
      }

      // Resolve event UUID if slug provided
      let targetEventId = eventId;
      const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      if (!isEventUuid) {
        const { data: eventData } = await serverSupabase
          .from('events')
          .select('id')
          .eq('slug', eventId)
          .maybeSingle();
        if (eventData?.id) {
          targetEventId = eventData.id;
        }
      }

      // Check if leaderId is UUID, ensure profile exists
      let validLeaderId = leaderId || userId;
      const isLeaderUuid = validLeaderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validLeaderId);

      if (isLeaderUuid) {
        const { data: existingProf } = await serverSupabase
          .from('profiles')
          .select('id')
          .eq('id', validLeaderId)
          .maybeSingle();

        if (!existingProf) {
          await serverSupabase.from('profiles').insert({
            id: validLeaderId,
            name: userName || 'Squad Leader',
            email: userEmail || 'leader@example.com',
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        const { data: fallbackProf } = await serverSupabase
          .from('profiles')
          .select('id')
          .limit(1)
          .maybeSingle();
        if (fallbackProf) {
          validLeaderId = fallbackProf.id;
        }
      }

      const { data: team, error: teamError } = await serverSupabase
        .from('teams')
        .insert({
          name: teamName,
          event_id: targetEventId,
          leader_id: validLeaderId,
          max_members: maxMembers,
          description: description || '',
        })
        .select('*')
        .single();

      if (teamError || !team) {
        console.error('Server Supabase create team error:', teamError?.message);
        return NextResponse.json({ error: teamError?.message || 'Failed to create team' }, { status: 500 });
      }

      // Add leader to team_members
      if (validLeaderId) {
        try {
          await serverSupabase.from('team_members').insert({
            team_id: team.id,
            user_id: validLeaderId,
            role: 'LEADER',
            status: 'ACCEPTED',
          });
        } catch (mErr) {
          console.warn('Leader insert to team_members warning:', mErr);
        }
      }

      return NextResponse.json({ success: true, team });
    }

    // 2. JOIN SQUAD ACTION
    if (action === 'join') {
      if (!teamId || !userId) {
        return NextResponse.json({ error: 'Missing teamId or userId' }, { status: 400 });
      }

      // Check member count
      const { data: members } = await serverSupabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId);

      if (members && members.length >= maxMembers) {
        return NextResponse.json({ error: 'This team has already reached its maximum capacity.' }, { status: 400 });
      }

      // Ensure profile exists
      const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      if (isUserUuid) {
        const { data: existingProf } = await serverSupabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!existingProf) {
          await serverSupabase.from('profiles').insert({
            id: userId,
            name: userName || 'Squad Member',
            email: userEmail || 'member@example.com',
            updated_at: new Date().toISOString(),
          });
        }
      }

      const { error: joinError } = await serverSupabase.from('team_members').insert({
        team_id: teamId,
        user_id: userId,
        role: 'MEMBER',
        status: 'ACCEPTED',
      });

      if (joinError) {
        return NextResponse.json({ error: joinError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('API /api/teams error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get('teamId') || url.searchParams.get('id');

    if (!teamId) {
      return NextResponse.json({ error: 'Missing teamId' }, { status: 400 });
    }

    await Promise.allSettled([
      serverSupabase.from('team_invitations').delete().eq('team_id', teamId),
      serverSupabase.from('team_members').delete().eq('team_id', teamId),
    ]);

    const { error } = await serverSupabase.from('teams').delete().eq('id', teamId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
