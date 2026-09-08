import { NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAdminClient,
} from '@/lib/api-auth';

const VALID_INQUIRY_TYPES = ['general', 'host', 'sponsor', 'support'];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, inquiryType = 'general', subject, message } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'Subject line is required.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    const cleanType = VALID_INQUIRY_TYPES.includes(inquiryType) ? inquiryType : 'general';
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    // Check optional authenticated user session
    let userId: string | null = null;
    try {
      const auth = await authenticateRequest(req);
      if (auth?.userId) {
        userId = auth.userId;
      }
    } catch {
      // Unauthenticated submission is completely fine for public contact form
    }

    const serverSupabase = createAdminClient();

    // Insert into contact_inquiries table
    const { data, error } = await serverSupabase
      .from('contact_inquiries')
      .insert({
        name: cleanName,
        email: cleanEmail,
        inquiry_type: cleanType,
        subject: cleanSubject,
        message: cleanMessage,
        status: 'PENDING',
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[Contact API] Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to record your inquiry. Please try again or email us directly.' },
        { status: 500 }
      );
    }

    // Realtime Broadcast to notify admins in real-time
    try {
      const channel = serverSupabase.channel('public:admin_inquiries');
      await channel.send({
        type: 'broadcast',
        event: 'inquiry_created',
        payload: {
          id: data.id,
          name: cleanName,
          email: cleanEmail,
          inquiryType: cleanType,
          subject: cleanSubject,
          createdAt: data.created_at,
        },
      });
    } catch (realtimeErr) {
      console.warn('[Contact API] Realtime broadcast non-fatal notice:', realtimeErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been received. Our team will get back to you shortly!',
      id: data.id,
    });
  } catch (err: any) {
    console.error('[Contact API Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while processing your inquiry.' },
      { status: 500 }
    );
  }
}
