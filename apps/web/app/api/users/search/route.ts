import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

    const supabaseAdmin = createAdminClient();

    // 1. Fetch profiles matching query
    let profiles: any[] = [];
    const cleanQuery = query.replace(/^@/, '').toLowerCase();

    try {
      // First attempt query with username and name
      let dbQuery = supabaseAdmin
        .from('profiles')
        .select(`
          id,
          username,
          name,
          email,
          avatar_url,
          banner_url,
          role,
          college,
          organization,
          profession_type,
          bio,
          skills,
          github_url,
          linkedin_url,
          portfolio_url,
          created_at
        `)
        .limit(limit);

      if (cleanQuery) {
        dbQuery = dbQuery.or(
          `username.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`
        );
      } else {
        dbQuery = dbQuery.order('created_at', { ascending: false });
      }

      const { data, error } = await dbQuery;

      if (error) {
        // If column username does not exist yet (code 42703), fallback to name/email search
        if (error.code === '42703') {
          let fallbackQuery = supabaseAdmin
            .from('profiles')
            .select(`
              id,
              name,
              email,
              avatar_url,
              banner_url,
              role,
              college,
              organization,
              profession_type,
              bio,
              skills,
              github_url,
              linkedin_url,
              portfolio_url,
              created_at
            `)
            .limit(limit);

          if (cleanQuery) {
            fallbackQuery = fallbackQuery.or(`name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`);
          } else {
            fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
          }

          const fallbackRes = await fallbackQuery;
          profiles = fallbackRes.data || [];
        } else {
          console.warn('[Users Search] Profiles query error:', error);
          profiles = [];
        }
      } else {
        profiles = data || [];
      }
    } catch (queryErr) {
      console.warn('[Users Search] Exception:', queryErr);
      profiles = [];
    }

    if (profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const userIds = profiles.map((p) => p.id);

    // 2. Fetch winning submissions count
    let winningsMap: Record<string, number> = {};
    try {
      const { data: winSubs } = await supabaseAdmin
        .from('submissions')
        .select('submitter_id')
        .in('submitter_id', userIds)
        .eq('status', 'WINNER');

      if (winSubs) {
        winSubs.forEach((s) => {
          winningsMap[s.submitter_id] = (winningsMap[s.submitter_id] || 0) + 1;
        });
      }
    } catch (winErr) {
      console.warn('[Users Search] Winnings count fetch warning:', winErr);
    }

    // 3. Fetch participations (registrations) count
    let participationsMap: Record<string, number> = {};
    try {
      const { data: regs } = await supabaseAdmin
        .from('registrations')
        .select('user_id')
        .in('user_id', userIds);

      if (regs) {
        regs.forEach((r) => {
          participationsMap[r.user_id] = (participationsMap[r.user_id] || 0) + 1;
        });
      }
    } catch (regErr) {
      console.warn('[Users Search] Registrations count fetch warning:', regErr);
    }

    // 4. Transform and enrich response
    const users = profiles.map((p) => {
      // Derive clean handle if username column not backfilled yet
      const derivedUsername =
        p.username ||
        (p.email ? p.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : null) ||
        (p.name ? p.name.toLowerCase().replace(/[^a-z0-9_]/g, '') : 'builder');

      return {
        id: p.id,
        username: derivedUsername,
        name: p.name || 'Anonymous Builder',
        avatarUrl: p.avatar_url || null,
        bannerUrl: p.banner_url || null,
        role: p.role || 'PARTICIPANT',
        college: p.college || null,
        organization: p.organization || null,
        professionType: p.profession_type || 'STUDENT',
        bio: p.bio || null,
        skills: Array.isArray(p.skills) ? p.skills : [],
        socialLinks: {
          github: p.github_url || null,
          linkedin: p.linkedin_url || null,
          portfolio: p.portfolio_url || null,
        },
        winningsCount: winningsMap[p.id] || 0,
        participationsCount: participationsMap[p.id] || 0,
        createdAt: p.created_at,
      };
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('[Users Search API Route Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error', users: [] }, { status: 500 });
  }
}
