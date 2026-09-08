import { NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAdminClient,
  unauthorizedResponse,
} from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return unauthorizedResponse('You must be signed in to create or join a squad.');
    }

    const body = await req.json();
    const { action = 'create' } = body;
    const serverSupabase = createAdminClient();
    const validUserId = auth.userId;
    const userEmail = (auth.email || body.leaderEmail || body.userEmail || '').toLowerCase().trim();
    const userName =
      body.leaderName ||
      body.userName ||
      auth.user.user_metadata?.name ||
      auth.user.user_metadata?.full_name ||
      userEmail.split('@')[0] ||
      'Hacker';

    // 1. Ensure user profile exists in public.profiles table (prevents teams_leader_id_fkey violation)
    const { data: existingProf } = await serverSupabase
      .from('profiles')
      .select('id')
      .eq('id', validUserId)
      .maybeSingle();

    if (!existingProf) {
      await serverSupabase.from('profiles').insert({
        id: validUserId,
        name: userName,
        email: userEmail,
        phone: body.phone || auth.user.user_metadata?.phone || null,
        college: body.college || null,
        skills: body.skills || [],
        updated_at: new Date().toISOString(),
      });
    }

    if (action === 'create') {
      const { eventId, teamName, maxMembers = 4, description = '' } = body;
      if (!eventId || !teamName) {
        return NextResponse.json(
          { error: 'Missing required team fields (eventId, teamName)' },
          { status: 400 }
        );
      }

      // Resolve event UUID if slug provided
      let targetEventId = eventId;
      const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        eventId
      );
      if (!isEventUuid) {
        const { data: eventData } = await serverSupabase
          .from('events')
          .select('id')
          .eq('slug', eventId)
          .maybeSingle();
        if (eventData?.id) {
          targetEventId = eventData.id;
        } else {
          return NextResponse.json({ success: true, localOnly: true });
        }
      }

      // 2. Create team
      const { data: team, error: teamError } = await serverSupabase
        .from('teams')
        .insert({
          name: teamName.trim(),
          event_id: targetEventId,
          leader_id: validUserId,
          max_members: Number(maxMembers) || 4,
          description: description?.trim() || '',
        })
        .select('*, profiles:leader_id(name, email, avatar_url)')
        .single();

      if (teamError) {
        console.error('[Teams API] Team create error:', teamError);
        return NextResponse.json({ error: teamError.message }, { status: 400 });
      }

      // 3. Automatically add leader to team_members
      try {
        await serverSupabase.from('team_members').upsert(
          {
            team_id: team.id,
            user_id: validUserId,
            role: 'LEADER',
            status: 'ACCEPTED',
          },
          { onConflict: 'team_id,user_id' }
        );
      } catch (tmErr) {
        console.warn('[Teams API] team_members insert notice:', tmErr);
      }

      return NextResponse.json({ success: true, team });
    } else if (action === 'join') {
      const { teamId, maxMembers = 4 } = body;
      if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required to join' }, { status: 400 });
      }

      // Check team capacity and existing membership
      const { data: team, error: teamFetchErr } = await serverSupabase
        .from('teams')
        .select('id, max_members, team_members(id, user_id)')
        .eq('id', teamId)
        .maybeSingle();

      if (teamFetchErr || !team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      const members = (team.team_members as any[]) || [];
      const isAlreadyMember = members.some((m) => m.user_id === validUserId);
      if (isAlreadyMember) {
        return NextResponse.json({ success: true, alreadyMember: true });
      }

      const limit = team.max_members || Number(maxMembers) || 4;
      if (members.length >= limit) {
        return NextResponse.json(
          { error: 'This team has already reached its maximum capacity.' },
          { status: 400 }
        );
      }

      // Join team
      const { error: joinError } = await serverSupabase.from('team_members').upsert(
        {
          team_id: teamId,
          user_id: validUserId,
          role: 'MEMBER',
          status: 'ACCEPTED',
        },
        { onConflict: 'team_id,user_id' }
      );

      if (joinError) {
        return NextResponse.json({ error: joinError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('[Teams API Error]:', err);
    return NextResponse.json({ error: err.message || 'Team operation failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return unauthorizedResponse('You must be signed in to delete a squad.');
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();

    // Verify user is the squad leader
    const { data: team, error: teamErr } = await serverSupabase
      .from('teams')
      .select('id, leader_id')
      .eq('id', teamId)
      .maybeSingle();

    if (teamErr || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.leader_id !== auth.userId) {
      return NextResponse.json(
        { error: 'Only the squad leader can delete this team.' },
        { status: 403 }
      );
    }

    // Cascade cleanup
    await serverSupabase.from('team_invitations').delete().eq('team_id', teamId);
    await serverSupabase.from('team_members').delete().eq('team_id', teamId);
    const { error: delErr } = await serverSupabase.from('teams').delete().eq('id', teamId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Teams DELETE Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete team' }, { status: 500 });
  }
}
