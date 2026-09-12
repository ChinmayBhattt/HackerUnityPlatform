import { NextRequest, NextResponse } from 'next/server';
import {
  syncAllTables,
  syncFullTable,
  getSpreadsheetTabs,
  getSpreadsheetId,
  TABLE_CONFIG,
} from '@/lib/google-sheets-sync';
import { authenticateRequest } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/api-auth';
import { UserRole } from '@hackers-unity/shared-types';

async function isAuthorizedAdmin(req: NextRequest): Promise<boolean> {
  // 1. Check sync secret
  const configuredSecret = process.env.SHEETS_SYNC_SECRET;
  if (configuredSecret) {
    const querySecret = req.nextUrl.searchParams.get('secret');
    const headerSecret = req.headers.get('x-sync-secret');
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (querySecret === configuredSecret || headerSecret === configuredSecret || bearer === configuredSecret) {
      return true;
    }
  }

  // 2. Check authenticated user session with admin role
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) return false;

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.userId)
      .single();

    if (profile?.role === UserRole.ADMIN || profile?.role === UserRole.SUPER_ADMIN) {
      return true;
    }
  } catch {
    // Auth check failed
  }

  return false;
}

// ─── GET: Check Sheets Connection & Mapped Tabs Status ───────────────────────
export async function GET(req: NextRequest) {
  try {
    const isAuthed = await isAuthorizedAdmin(req);
    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session or valid secret required.' },
        { status: 401 }
      );
    }

    const spreadsheetId = getSpreadsheetId();
    let tabs: any[] = [];
    let connectionError: string | null = null;

    try {
      tabs = await getSpreadsheetTabs();
    } catch (err: any) {
      connectionError = err.message || 'Failed to connect to Google Sheets';
    }

    const tableStatuses = Object.entries(TABLE_CONFIG).map(([table, conf]) => {
      const matchedTab = tabs.find(
        (t) => t.title.toLowerCase() === conf.sheetName.toLowerCase()
      );
      return {
        table,
        sheetName: conf.sheetName,
        primaryKey: conf.primaryKey,
        description: conf.description,
        existsInSpreadsheet: Boolean(matchedTab),
        sheetId: matchedTab?.sheetId ?? null,
        rowCount: matchedTab?.rowCount ?? null,
      };
    });

    return NextResponse.json({
      success: !connectionError,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      connectionStatus: connectionError ? 'ERROR' : 'CONNECTED',
      connectionError,
      configuredTablesCount: Object.keys(TABLE_CONFIG).length,
      tables: tableStatuses,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── POST: Trigger Full Synchronization ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const isAuthed = await isAuthorizedAdmin(req);
    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session or valid secret required.' },
        { status: 401 }
      );
    }

    const tableParam = req.nextUrl.searchParams.get('table');

    // Case 1: Single table sync
    if (tableParam) {
      if (!TABLE_CONFIG[tableParam]) {
        return NextResponse.json(
          { error: `Unknown table "${tableParam}". Configured tables: ${Object.keys(TABLE_CONFIG).join(', ')}` },
          { status: 400 }
        );
      }

      const result = await syncFullTable(tableParam);
      return NextResponse.json({
        success: result.success,
        mode: 'single',
        result,
        timestamp: new Date().toISOString(),
      });
    }

    // Case 2: Full sync for all tables
    const summary = await syncAllTables();

    return NextResponse.json({
      success: summary.success,
      mode: 'all',
      totalRows: summary.totalRows,
      totalDurationMs: summary.totalDurationMs,
      results: summary.results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Admin: sync-sheets] Sync failure:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during synchronization' },
      { status: 500 }
    );
  }
}
