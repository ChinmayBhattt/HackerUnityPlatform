// @ts-nocheck
// ==============================================================================
// Supabase Edge Function: sync-to-sheets
// Automatically receives database webhook changes and syncs them to Google Sheets
// ==============================================================================

declare const Deno: any;

// Central Table Configuration (matches Next.js sync engine)
const TABLE_CONFIG: Record<string, { sheetName: string; primaryKey: string }> = {
  profiles: { sheetName: 'Profiles', primaryKey: 'id' },
  events: { sheetName: 'Events', primaryKey: 'id' },
  registrations: { sheetName: 'Registrations', primaryKey: 'id' },
  submissions: { sheetName: 'Submissions', primaryKey: 'id' },
  teams: { sheetName: 'Teams', primaryKey: 'id' },
  team_members: { sheetName: 'Team Members', primaryKey: 'id' },
  team_invitations: { sheetName: 'Team Invitations', primaryKey: 'id' },
  bookmarks: { sheetName: 'Bookmarks', primaryKey: 'id' },
  contact_inquiries: { sheetName: 'Contact Inquiries', primaryKey: 'id' },
  contact_messages: { sheetName: 'Contact Messages', primaryKey: 'id' },
  mentor_applications: { sheetName: 'Mentor Applications', primaryKey: 'id' },
  news: { sheetName: 'News', primaryKey: 'id' },
  newsletter_subscribers: { sheetName: 'Newsletter Subscribers', primaryKey: 'id' },
  notifications: { sheetName: 'Notifications', primaryKey: 'id' },
  user_notifications: { sheetName: 'User Notifications', primaryKey: 'id' },
};

const SPREADSHEET_ID =
  Deno.env.get('GOOGLE_SPREADSHEET_ID') ||
  '104nHo8CjXSjDLlQ6kKr28jwfC0YD2Zrip_ZY6OxAZuE';
const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

function base64Url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToBinary(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const raw = atob(clean);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    buf[i] = raw.charCodeAt(i);
  }
  return buf.buffer;
}

async function getAccessToken(): Promise<string> {
  const clientEmail =
    Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') ||
    'hackers-unity-sheets@premium-catbird-457008-b2.iam.gserviceaccount.com';
  const privateKey = (Deno.env.get('GOOGLE_PRIVATE_KEY') || '').replace(/\\n/g, '\n');

  if (!privateKey) {
    throw new Error('Missing GOOGLE_PRIVATE_KEY in Edge Function secrets');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );

  const keyBuffer = pemToBinary(privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );

  const signature = base64Url(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );

  const jwt = `${header}.${payload}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`Failed to obtain Google token: ${txt}`);
  }

  const tokenJson = await tokenRes.json();
  return tokenJson.access_token;
}

async function sheetsApi(accessToken: string, path: string, options: RequestInit = {}) {
  const url = `${SHEETS_BASE_URL}/${SPREADSHEET_ID}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Sheets API error: ${res.status} ${txt}`);
  }

  return res.json();
}

function formatValue(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// ─── EDGE FUNCTION HANDLER ──────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ status: 'Edge function active' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;
    const config = TABLE_CONFIG[table];

    if (!config) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Table "${table}" not configured for Google Sheets. Ignored.`,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = await getAccessToken();
    const sheetName = config.sheetName;
    const encodedSheet = encodeURIComponent(sheetName);

    // 1. Ensure sheet tab exists
    const meta = await sheetsApi(token, '?fields=sheets.properties');
    const existingTabs = (meta.sheets || []).map((s: any) => s.properties);
    let tab = existingTabs.find((t: any) => t.title.toLowerCase() === sheetName.toLowerCase());

    if (!tab) {
      const addRes = await sheetsApi(token, ':batchUpdate', {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: { rowCount: 1000, columnCount: 26, frozenRowCount: 1 },
                },
              },
            },
          ],
        }),
      });
      tab = addRes.replies?.[0]?.addSheet?.properties;
    }

    // 2. Read existing headers
    const existing = await sheetsApi(token, `/values/${encodedSheet}!A1:ZZZ?majorDimension=ROWS`);
    const rows: string[][] = existing.values || [];
    let headers = rows[0] || [];

    const target = record || old_record || {};
    if (headers.length === 0) {
      const keys = Object.keys(target);
      headers = [config.primaryKey, ...keys.filter((k) => k !== config.primaryKey).sort()];
      await sheetsApi(token, `/values/${encodedSheet}!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ range: `${sheetName}!A1`, majorDimension: 'ROWS', values: [headers] }),
      });
    }

    const pkColIdx = headers.indexOf(config.primaryKey);
    const targetPk = String((record && record[config.primaryKey]) ?? (old_record && old_record[config.primaryKey]) ?? '');

    // ─── INSERT ───
    if (type === 'INSERT' && record) {
      const newKeys = Object.keys(record).filter((k) => !headers.includes(k));
      if (newKeys.length > 0) {
        headers.push(...newKeys);
        await sheetsApi(token, `/values/${encodedSheet}!A1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          body: JSON.stringify({ range: `${sheetName}!A1`, majorDimension: 'ROWS', values: [headers] }),
        });
      }

      const rowValues = headers.map((h) => formatValue(record[h]));
      await sheetsApi(token, `/values/${encodedSheet}!A:A:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: 'POST',
        body: JSON.stringify({ range: `${sheetName}!A1`, majorDimension: 'ROWS', values: [rowValues] }),
      });

      return new Response(JSON.stringify({ success: true, action: 'INSERT', table, pk: targetPk }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ─── UPDATE ───
    if (type === 'UPDATE' && record) {
      let foundRow = -1;
      for (let r = 1; r < rows.length; r++) {
        if (String(rows[r][pkColIdx >= 0 ? pkColIdx : 0]).trim() === targetPk.trim()) {
          foundRow = r + 1;
          break;
        }
      }

      const rowValues = headers.map((h) => formatValue(record[h]));
      if (foundRow > 0) {
        await sheetsApi(token, `/values/${encodedSheet}!A${foundRow}?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          body: JSON.stringify({ range: `${sheetName}!A${foundRow}`, majorDimension: 'ROWS', values: [rowValues] }),
        });
        return new Response(JSON.stringify({ success: true, action: 'UPDATE', table, row: foundRow, pk: targetPk }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        await sheetsApi(token, `/values/${encodedSheet}!A:A:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
          method: 'POST',
          body: JSON.stringify({ range: `${sheetName}!A1`, majorDimension: 'ROWS', values: [rowValues] }),
        });
        return new Response(JSON.stringify({ success: true, action: 'UPDATE_APPENDED', table, pk: targetPk }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ─── DELETE ───
    if (type === 'DELETE') {
      let foundRow0 = -1;
      for (let r = 1; r < rows.length; r++) {
        if (String(rows[r][pkColIdx >= 0 ? pkColIdx : 0]).trim() === targetPk.trim()) {
          foundRow0 = r;
          break;
        }
      }

      if (foundRow0 > 0) {
        await sheetsApi(token, ':batchUpdate', {
          method: 'POST',
          body: JSON.stringify({
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: tab.sheetId,
                    dimension: 'ROWS',
                    startIndex: foundRow0,
                    endIndex: foundRow0 + 1,
                  },
                },
              },
            ],
          }),
        });
        return new Response(JSON.stringify({ success: true, action: 'DELETE', table, row: foundRow0 + 1, pk: targetPk }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, action: 'DELETE_SKIPPED', table, pk: targetPk }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Edge function error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
