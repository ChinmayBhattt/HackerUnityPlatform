/**
 * Standalone CLI Script to synchronize Supabase tables to Google Sheets
 * Usage:
 *   npx tsx scripts/sync-sheets.ts
 *   npx tsx scripts/sync-sheets.ts --table=profiles
 */

import fs from 'fs';
import path from 'path';

// Native .env.local loader
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

import {
  syncAllTables,
  syncFullTable,
  getSpreadsheetTabs,
  getSpreadsheetId,
  TABLE_CONFIG,
} from '../lib/google-sheets-sync';

async function main() {
  console.log('\n======================================================');
  console.log(" Hacker's Unity: Supabase -> Google Sheets Sync Tool");
  console.log('======================================================');

  const spreadsheetId = getSpreadsheetId();
  console.log(`Target Spreadsheet ID: ${spreadsheetId}`);
  console.log(`Configured Tables: ${Object.keys(TABLE_CONFIG).length}`);

  // Test connection
  try {
    const tabs = await getSpreadsheetTabs();
    console.log(`Connection successful! Existing tabs in spreadsheet: ${tabs.length}`);
  } catch (err: any) {
    console.error('\n[Error] Failed to connect to Google Sheets:');
    console.error(err.message);
    console.error('\nPlease verify that GOOGLE_PRIVATE_KEY and GOOGLE_SERVICE_ACCOUNT_EMAIL are set in .env.local.');
    process.exit(1);
  }

  // Parse arguments
  const args = process.argv.slice(2);
  const tableArg = args.find((a) => a.startsWith('--table='));
  const specificTable = tableArg ? tableArg.split('=')[1] : null;

  if (specificTable) {
    if (!TABLE_CONFIG[specificTable]) {
      console.error(`\nUnknown table "${specificTable}". Configured tables are:`);
      console.error(Object.keys(TABLE_CONFIG).join(', '));
      process.exit(1);
    }

    console.log(`\nStarting sync for single table: "${specificTable}"...`);
    const res = await syncFullTable(specificTable);
    console.log(`Sync complete!`);
    console.log(`  Table: ${res.table}`);
    console.log(`  Tab: "${res.sheetName}"`);
    console.log(`  Rows Synced: ${res.rowsSynced}`);
    console.log(`  Duration: ${res.durationMs}ms`);
    return;
  }

  console.log('\nStarting full synchronization across all 15 tables...\n');
  const summary = await syncAllTables();

  console.log('------------------------------------------------------');
  summary.results.forEach((r) => {
    const status = r.success ? 'SUCCESS' : 'FAILED';
    const errorStr = r.error ? ` - Error: ${r.error}` : '';
    console.log(` [${status}] ${r.table.padEnd(24)} -> "${r.sheetName.padEnd(22)}" | ${String(r.rowsSynced).padStart(4)} rows | ${r.durationMs}ms${errorStr}`);
  });
  console.log('------------------------------------------------------');
  console.log(`\nTotal Records Synced: ${summary.totalRows}`);
  console.log(`Total Duration: ${(summary.totalDurationMs / 1000).toFixed(2)}s`);
  console.log(`Status: ${summary.success ? 'ALL TABLES SYNCED SUCCESSFULLY' : 'SOME TABLES HAD ERRORS'}\n`);
}

main().catch((e) => {
  console.error('\nFatal script error:', e);
  process.exit(1);
});
