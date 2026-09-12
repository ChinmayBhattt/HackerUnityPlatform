import { NextRequest, NextResponse } from 'next/server';
import {
  handleDatabaseWebhook,
  DatabaseWebhookPayload,
  TABLE_CONFIG,
} from '@/lib/google-sheets-sync';

export async function POST(req: NextRequest) {
  try {
    // 1. Webhook Secret Authentication (if configured)
    const configuredSecret = process.env.SHEETS_SYNC_SECRET;
    if (configuredSecret) {
      const headerSecret = req.headers.get('x-webhook-secret');
      const querySecret = req.nextUrl.searchParams.get('secret');
      const authHeader = req.headers.get('authorization');
      const bearerSecret = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      const provided = headerSecret || querySecret || bearerSecret;
      if (provided !== configuredSecret) {
        return NextResponse.json(
          { error: 'Unauthorized webhook request. Invalid secret.' },
          { status: 401 }
        );
      }
    }

    // 2. Parse payload
    const body = (await req.json()) as DatabaseWebhookPayload;

    if (!body || !body.type || !body.table) {
      return NextResponse.json(
        { error: 'Malformed webhook payload. Must include "type" and "table".' },
        { status: 400 }
      );
    }

    // 3. Check if table is in configuration
    if (!TABLE_CONFIG[body.table]) {
      return NextResponse.json({
        success: true,
        message: `Table "${body.table}" not mapped in TABLE_CONFIG. Skipped.`,
      });
    }

    // 4. Process event
    const result = await handleDatabaseWebhook(body);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Webhook: supabase-to-sheets] Processing error:', err);
    return NextResponse.json(
      {
        error: err.message || 'Internal server error while syncing to Google Sheets',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/webhooks/supabase-to-sheets',
    supportedTables: Object.keys(TABLE_CONFIG),
    description: 'Supabase Database Webhook handler for Google Sheets mirroring',
  });
}
