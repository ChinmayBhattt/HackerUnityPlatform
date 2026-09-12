/**
 * ==============================================================================
 * Hacker's Unity - Google Sheets Sync Apps Script (Alternative 1-Click Method)
 * ==============================================================================
 * 
 * If you do not have the Service Account Private Key JSON, you can use this
 * Apps Script directly inside your Google Sheet:
 * 
 * STEPS:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/104nHo8CjXSjDLlQ6kKr28jwfC0YD2Zrip_ZY6OxAZuE/edit
 * 2. Click "Extensions" -> "Apps Script" in top menu.
 * 3. Delete any default code, paste this entire file content, and click "Save" (Ctrl+S).
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Select type: "Web app".
 *    - Description: "Supabase Mirror Sync"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 6. Click "Deploy" and Authorize access.
 * 7. Copy the "Web app URL" (e.g. https://script.google.com/macros/s/.../exec).
 * 8. Add it to apps/web/.env.local:
 *    GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 * ==============================================================================
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Bulk Sync Action
    if (data.action === 'BULK_SYNC') {
      var sheetName = data.sheetName || 'Data';
      var rows = data.rows || []; // Array of arrays: [ [headers...], [row1...], [row2...] ]
      
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      sheet.clearContents();
      
      if (rows.length > 0) {
        var numRows = rows.length;
        var numCols = rows[0].length;
        sheet.getRange(1, 1, numRows, numCols).setValues(rows);
        
        // Format Header Row
        sheet.setFrozenRows(1);
        var headerRange = sheet.getRange(1, 1, 1, numCols);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#0d121f');
        headerRange.setFontColor('#ffffff');
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: rows.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Realtime Webhook Action (INSERT / UPDATE / DELETE)
    var type = data.type; // 'INSERT', 'UPDATE', 'DELETE'
    var table = data.table;
    var sheetName = data.sheetName || table;
    var record = data.record || {};
    var oldRecord = data.old_record || {};
    var pkField = data.primaryKey || 'id';
    var pkValue = String(record[pkField] || oldRecord[pkField] || '');

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    // If sheet is empty, create headers
    if (lastRow === 0) {
      var keys = [pkField];
      Object.keys(record).forEach(function(k) {
        if (k !== pkField) keys.push(k);
      });
      sheet.appendRow(keys);
      sheet.setFrozenRows(1);
      var headerRange = sheet.getRange(1, 1, 1, keys.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#0d121f');
      headerRange.setFontColor('#ffffff');
      lastRow = 1;
      lastCol = keys.length;
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var pkColIdx = headers.indexOf(pkField) + 1;
    if (pkColIdx === 0) pkColIdx = 1;

    // INSERT
    if (type === 'INSERT') {
      var rowVals = headers.map(function(h) {
        var val = record[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      });
      sheet.appendRow(rowVals);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'INSERT', pk: pkValue }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // UPDATE
    if (type === 'UPDATE') {
      var foundRow = -1;
      if (lastRow > 1) {
        var pkRange = sheet.getRange(2, pkColIdx, lastRow - 1, 1).getValues();
        for (var i = 0; i < pkRange.length; i++) {
          if (String(pkRange[i][0]).trim() === pkValue.trim()) {
            foundRow = i + 2;
            break;
          }
        }
      }

      var rowVals = headers.map(function(h) {
        var val = record[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      });

      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, rowVals.length).setValues([rowVals]);
      } else {
        sheet.appendRow(rowVals);
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'UPDATE', row: foundRow, pk: pkValue }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // DELETE
    if (type === 'DELETE') {
      if (lastRow > 1) {
        var pkRange = sheet.getRange(2, pkColIdx, lastRow - 1, 1).getValues();
        for (var i = 0; i < pkRange.length; i++) {
          if (String(pkRange[i][0]).trim() === pkValue.trim()) {
            sheet.deleteRow(i + 2);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'DELETE', pk: pkValue }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'Hacker\'s Unity Google Sheets Sync Active' }))
    .setMimeType(ContentService.MimeType.JSON);
}
