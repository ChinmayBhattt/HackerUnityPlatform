import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      company,
      designation,
      email,
      phone,
      linkedin_url,
      resume_url,
      notes,
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    if (!company || typeof company !== 'string' || !company.trim()) {
      return NextResponse.json({ error: 'Company / Organization is required.' }, { status: 400 });
    }

    if (!designation || typeof designation !== 'string' || !designation.trim()) {
      return NextResponse.json({ error: 'Role / Designation is required.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ error: 'Contact number is required.' }, { status: 400 });
    }

    if (!linkedin_url || typeof linkedin_url !== 'string' || !linkedin_url.trim()) {
      return NextResponse.json({ error: 'LinkedIn / Portfolio URL is required.' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanCompany = company.trim();
    const cleanDesignation = designation.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanLinkedin = linkedin_url.trim();
    const cleanResume = typeof resume_url === 'string' && resume_url.trim() ? resume_url.trim() : null;
    const cleanNotes = typeof notes === 'string' && notes.trim() ? notes.trim() : null;

    const serverSupabase = createAdminClient();

    // Insert into mentor_applications table
    const { data, error } = await serverSupabase
      .from('mentor_applications')
      .insert({
        name: cleanName,
        company: cleanCompany,
        designation: cleanDesignation,
        email: cleanEmail,
        phone: cleanPhone,
        linkedin_url: cleanLinkedin,
        resume_url: cleanResume,
        notes: cleanNotes,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[Mentor Application API] Database insert error:', error);
      return NextResponse.json(
        { 
          error: error.message || 'Failed to submit your application. Please verify your details or try again later.',
          details: error.details || error.hint || error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully! Our team will review your profile.',
      id: data.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error while processing mentor application.';
    console.error('[Mentor Application API Error]:', err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
