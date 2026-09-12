import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = body?.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing in environment variables');
      return NextResponse.json(
        { error: 'Database service is temporarily unavailable. Please try again later.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert subscriber record
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([
        {
          email,
          source: 'website_footer',
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select('id, email')
      .single();

    if (error) {
      // Postgres unique violation code 23505
      if (
        error.code === '23505' ||
        error.message?.includes('duplicate key') ||
        error.message?.includes('unique')
      ) {
        return NextResponse.json({
          success: true,
          alreadySubscribed: true,
          message: "You are already subscribed to Hacker's Unity updates!",
        });
      }

      console.error('Supabase newsletter insert error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Successfully subscribed! Welcome to Hacker's Unity updates.",
    });
  } catch (err: any) {
    console.error('Newsletter subscribe route exception:', err);
    return NextResponse.json(
      { error: err?.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
