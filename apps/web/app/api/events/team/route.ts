import { NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAdminClient,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-auth';

function generateInviteCode(): string {
  const rand = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8);
  return `hu_adm_${rand}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const eventIdParam = url.searchParams.get('eventId');
    const codeParam = url.searchParams.get('code');

    const serverSupabase = createAdminClient();

    // ─── 1. PUBLIC / SEMI-PUBLIC INVITE LOOKUP BY CODE ──────────────────
    if (codeParam && !eventIdParam) {
      const { data: event, error: eventErr } = await serverSupabase
        .from('events')
        .select('id, slug, title, description, category, event_type, location, start_date, end_date, organizer_id, organizer_name, organizer_avatar, logo_url, banner_url, admin_invite_code')
        .eq('admin_invite_code', codeParam)
        .maybeSingle();

      if (eventErr || !event) {
        return NextResponse.json({ error: 'Invalid or expired invite link.' }, { status: 404 });
      }

      // Check current auth status optionally
      const auth = await authenticateRequest();
      let isOwner = false;
      let isAlreadyAdmin = false;

      if (auth) {
        isOwner = event.organizer_id === auth.userId;
        if (!isOwner) {
          const { data: adminRecord } = await serverSupabase
            .from('event_admins')
            .select('id')
            .eq('event_id', event.id)
            .eq('user_id', auth.userId)
            .maybeSingle();
          isAlreadyAdmin = Boolean(adminRecord);
        }
      }

      return NextResponse.json({
        success: true,
        event: {
          id: event.id,
          slug: event.slug,
          title: event.title,
          description: event.description,
          category: event.category,
          eventType: event.event_type,
          location: event.location,
          startDate: event.start_date,
          endDate: event.end_date,
          organizerName: event.organizer_name,
          organizerAvatar: event.organizer_avatar,
          logoUrl: event.logo_url,
          bannerUrl: event.banner_url,
        },
        isOwner,
        isAlreadyAdmin,
        isAuthenticated: Boolean(auth),
      });
    }

    // ─── 2. EVENT TEAM MANAGEMENT LOOKUP BY EVENT ID ────────────────────
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be signed in to view the event team.');
    }

    if (!eventIdParam) {
      return NextResponse.json({ error: 'Missing eventId parameter' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventIdParam);
    let eventQuery = serverSupabase
      .from('events')
      .select('id, slug, title, organizer_id, organizer_name, organizer_avatar, admin_invite_code');

    if (isUuid) {
      eventQuery = eventQuery.eq('id', eventIdParam);
    } else {
      eventQuery = eventQuery.eq('slug', eventIdParam);
    }

    const { data: event, error: fetchErr } = await eventQuery.maybeSingle();
    if (fetchErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isOwner = event.organizer_id === auth.userId;
    const userRole = auth.user.user_metadata?.role;
    const isSuperAdmin = userRole === 'ADMIN' || auth.email === process.env.ADMIN_EMAIL;

    // Check if user is in event_admins
    const { data: coHostRecord } = await serverSupabase
      .from('event_admins')
      .select('id, role')
      .eq('event_id', event.id)
      .eq('user_id', auth.userId)
      .maybeSingle();

    const isCoHost = Boolean(coHostRecord);

    if (!isOwner && !isCoHost && !isSuperAdmin) {
      return forbiddenResponse('You are not authorized to view this event team.');
    }

    // Ensure invite code exists on the event
    let inviteCode = event.admin_invite_code;
    if (!inviteCode) {
      inviteCode = generateInviteCode();
      await serverSupabase
        .from('events')
        .update({ admin_invite_code: inviteCode })
        .eq('id', event.id);
    }

    // Fetch owner profile
    let ownerProfile: any = null;
    if (event.organizer_id) {
      const { data: ownerProf } = await serverSupabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, phone, college, company')
        .eq('id', event.organizer_id)
        .maybeSingle();
      ownerProfile = ownerProf || {
        id: event.organizer_id,
        full_name: event.organizer_name,
        email: '',
        avatar_url: event.organizer_avatar,
      };
    }

    // Fetch co-host admins
    let adminsList: any[] = [];
    try {
      const { data: admins, error: adminsErr } = await serverSupabase
        .from('event_admins')
        .select(`
          id,
          event_id,
          user_id,
          role,
          joined_at,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('event_id', event.id)
        .order('joined_at', { ascending: true });

      if (!adminsErr && admins) {
        adminsList = admins.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          role: item.role || 'ADMIN',
          joinedAt: item.joined_at,
          fullName: item.profiles?.full_name || 'Co-Host Admin',
          email: item.profiles?.email || '',
          avatarUrl: item.profiles?.avatar_url || null,
        }));
      }
    } catch (e) {
      console.warn('Could not query event_admins table:', e);
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://hackersunity.com';
    const inviteUrl = `${origin}/host/join?code=${inviteCode}`;

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
      },
      isOwner,
      isCoHost,
      inviteCode,
      inviteUrl,
      owner: ownerProfile || {
        id: event.organizer_id,
        full_name: event.organizer_name || 'Event Owner',
        email: '',
        avatar_url: event.organizer_avatar,
      },
      admins: adminsList,
    });
  } catch (err: any) {
    console.error('Error fetching event team:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be signed in to perform this action.');
    }

    const body = await req.json();
    const { action, eventId, code } = body;
    const serverSupabase = createAdminClient();

    // ─── ACTION: JOIN AS CO-HOST ADMIN VIA INVITE CODE ──────────────────
    if (action === 'join') {
      if (!code) {
        return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
      }

      // Find event by code
      const { data: event, error: eventErr } = await serverSupabase
        .from('events')
        .select('id, slug, title, organizer_id')
        .eq('admin_invite_code', code.trim())
        .maybeSingle();

      if (eventErr || !event) {
        return NextResponse.json({ error: 'Invalid or expired invite link.' }, { status: 404 });
      }

      // Check if user is the main owner
      if (event.organizer_id === auth.userId) {
        return NextResponse.json({
          success: true,
          alreadyAdmin: true,
          eventId: event.id,
          eventSlug: event.slug,
          message: 'You are the primary owner of this hackathon.',
        });
      }

      // Check if already in event_admins
      const { data: existingAdmin } = await serverSupabase
        .from('event_admins')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', auth.userId)
        .maybeSingle();

      if (existingAdmin) {
        return NextResponse.json({
          success: true,
          alreadyAdmin: true,
          eventId: event.id,
          eventSlug: event.slug,
          message: 'You are already an admin for this hackathon.',
        });
      }

      // Insert new admin record
      const { error: insertErr } = await serverSupabase
        .from('event_admins')
        .insert({
          event_id: event.id,
          user_id: auth.userId,
          role: 'ADMIN',
          invited_by: event.organizer_id,
        });

      if (insertErr) {
        console.error('Error inserting event_admins row:', insertErr.message);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        eventId: event.id,
        eventSlug: event.slug,
        eventTitle: event.title,
        message: `Successfully joined ${event.title} as Event Admin!`,
      });
    }

    // ─── ACTION: REGENERATE INVITE CODE (OWNER ONLY) ─────────────────────
    if (action === 'regenerate_code') {
      if (!eventId) {
        return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      let query = serverSupabase.from('events').select('id, organizer_id');
      if (isUuid) query = query.eq('id', eventId);
      else query = query.eq('slug', eventId);

      const { data: event } = await query.maybeSingle();
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      const isOwner = event.organizer_id === auth.userId;
      const userRole = auth.user.user_metadata?.role;
      const isSuperAdmin = userRole === 'ADMIN' || auth.email === process.env.ADMIN_EMAIL;

      if (!isOwner && !isSuperAdmin) {
        return forbiddenResponse('Only the event owner can regenerate invite links.');
      }

      const newCode = generateInviteCode();
      const { error: updateErr } = await serverSupabase
        .from('events')
        .update({ admin_invite_code: newCode })
        .eq('id', event.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://hackersunity.com';
      return NextResponse.json({
        success: true,
        inviteCode: newCode,
        inviteUrl: `${origin}/host/join?code=${newCode}`,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in POST /api/events/team:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be signed in to remove team members.');
    }

    const body = await req.json();
    const { eventId, adminUserId } = body;

    if (!eventId || !adminUserId) {
      return NextResponse.json({ error: 'Missing eventId or adminUserId' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    let query = serverSupabase.from('events').select('id, organizer_id');
    if (isUuid) query = query.eq('id', eventId);
    else query = query.eq('slug', eventId);

    const { data: event } = await query.maybeSingle();
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isOwner = event.organizer_id === auth.userId;
    const isSelf = adminUserId === auth.userId;
    const userRole = auth.user.user_metadata?.role;
    const isSuperAdmin = userRole === 'ADMIN' || auth.email === process.env.ADMIN_EMAIL;

    // Only owner can remove other admins; or an admin can remove themselves (leave)
    if (!isOwner && !isSelf && !isSuperAdmin) {
      return forbiddenResponse('Only the event owner can remove admins.');
    }

    // Prevent removing the primary owner
    if (adminUserId === event.organizer_id) {
      return NextResponse.json({ error: 'Cannot remove the primary event owner.' }, { status: 400 });
    }

    const { error: delErr } = await serverSupabase
      .from('event_admins')
      .delete()
      .eq('event_id', event.id)
      .eq('user_id', adminUserId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Admin removed successfully.' });
  } catch (err: any) {
    console.error('Error removing event admin:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
