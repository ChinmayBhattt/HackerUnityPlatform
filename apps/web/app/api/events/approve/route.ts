import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';
const serverSupabase = createClient(supabaseUrl, supabaseSecretKey);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get('id') || url.searchParams.get('eventId');
    const slug = url.searchParams.get('slug');

    if (!eventId && !slug) {
      return new Response(renderResultHtml('Error', 'Missing Event ID or Slug', false), {
        headers: { 'Content-Type': 'text/html' },
        status: 400,
      });
    }

    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));

    let updateRes: any = null;
    if (isUuid) {
      updateRes = await serverSupabase
        .from('events')
        .update({ status: 'PUBLISHED', updated_at: new Date().toISOString() })
        .eq('id', eventId)
        .select('*')
        .single();
    } else {
      const target = slug || eventId;
      updateRes = await serverSupabase
        .from('events')
        .update({ status: 'PUBLISHED', updated_at: new Date().toISOString() })
        .eq('slug', target)
        .select('*')
        .single();
    }

    if (updateRes?.error || !updateRes?.data) {
      // Try by slug fallback
      const fallbackTarget = slug || eventId;
      const secondTry = await serverSupabase
        .from('events')
        .update({ status: 'PUBLISHED', updated_at: new Date().toISOString() })
        .eq('slug', fallbackTarget)
        .select('*')
        .single();

      if (secondTry?.error || !secondTry?.data) {
        return new Response(
          renderResultHtml('Approval Failed', updateRes?.error?.message || 'Hackathon event not found in database.', false),
          { headers: { 'Content-Type': 'text/html' }, status: 404 }
        );
      }
      updateRes = secondTry;
    }

    const event = updateRes.data;
    const origin = url.origin || 'https://hackersunity.com';
    const liveUrl = `${origin}/hackathons/${event.slug || event.id}`;

    return new Response(
      renderResultHtml(
        'Hackathon Approved & Published! 🎉',
        `The hackathon <strong>"${event.title}"</strong> has been successfully approved and is now live on Hacker's Unity for the global community.`,
        true,
        liveUrl,
        event.title
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      renderResultHtml('Server Error', err.message || 'An unexpected error occurred during approval.', false),
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, slug } = body;

    if (!eventId && !slug) {
      return NextResponse.json({ error: 'Missing eventId or slug' }, { status: 400 });
    }

    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));
    let query = serverSupabase
      .from('events')
      .update({ status: 'PUBLISHED', updated_at: new Date().toISOString() });

    if (isUuid) {
      query = query.eq('id', eventId);
    } else {
      query = query.eq('slug', slug || eventId);
    }

    const { data, error } = await query.select('*').single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

function renderResultHtml(title: string, message: string, isSuccess: boolean, liveUrl?: string, eventTitle?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} • Hacker's Unity</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 28px;
      padding: 40px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 153, 230, 0.15);
    }
    .icon-badge {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      background: ${isSuccess ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'};
      box-shadow: 0 10px 25px ${isSuccess ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'};
    }
    h1 {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin: 0 0 12px;
      color: #ffffff;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 28px;
    }
    p strong {
      color: #f1f5f9;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 14px;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(135deg, #0099e6 0%, #0284c7 100%);
      color: #ffffff;
      box-shadow: 0 10px 20px rgba(0, 153, 230, 0.3);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 24px rgba(0, 153, 230, 0.4);
    }
    .footer-note {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-badge">${isSuccess ? '✓' : '✕'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${
      isSuccess && liveUrl
        ? `<a href="${liveUrl}" class="btn btn-primary">View Live Hackathon →</a>`
        : `<a href="/" class="btn btn-primary">Go to Home</a>`
    }
    <div class="footer-note">Hacker's Unity Moderation Desk</div>
  </div>
</body>
</html>`;
}
