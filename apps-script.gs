// ======================================================
// BOGO CAFE - GOOGLE APPS SCRIPT API
// Letakkan file ini di Google Apps Script
// Ganti SPREADSHEET_ID dengan ID Google Sheets kamu
// ======================================================

const SPREADSHEET_ID = 'GANTI_DENGAN_ID_GOOGLE_SHEETS_KAMU';
const SHEET_NAME = 'Pengeluaran';

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';

  if (action === 'read') {
    return readData();
  }

  return output({
    ok: true,
    message: 'BOGO CAFE API online'
  });
}

function doPost(e) {
  try {
    const bodyText = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const body = JSON.parse(bodyText);

    if (body.action === 'save') {
      return saveData(body.data || []);
    }

    return output({
      ok: false,
      error: 'Action tidak dikenali'
    });

  } catch (err) {
    return output({
      ok: false,
      error: err.message
    });
  }
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function setup() {
  const sheet = getSheet();
  sheet.clearContents();
  sheet.appendRow(['id', 'date', 'nama', 'kat', 'qty', 'satuan', 'harga', 'note']);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  return output({
    ok: true,
    message: 'Sheet berhasil disiapkan'
  });
}

function saveData(data) {
  const sheet = getSheet();

  sheet.clearContents();
  sheet.appendRow(['id', 'date', 'nama', 'kat', 'qty', 'satuan', 'harga', 'note']);

  if (Array.isArray(data) && data.length > 0) {
    const rows = data.map(item => [
      item.id || '',
      item.date || '',
      item.nama || '',
      item.kat || '',
      Number(item.qty || 0),
      item.satuan || '',
      Number(item.harga || 0),
      item.note || ''
    ]);

    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold');

  return output({
    ok: true,
    message: 'Data berhasil disimpan',
    count: Array.isArray(data) ? data.length : 0
  });
}

function readData() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return output({
      ok: true,
      data: []
    });
  }

  const headers = values[0].map(String);
  const rows = values.slice(1);

  const data = rows
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        if (h === 'date' && row[i] instanceof Date) {
          obj[h] = Utilities.formatDate(row[i], Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          obj[h] = row[i];
        }
      });
      return obj;
    });

  return output({
    ok: true,
    data: data
  });
}

function output(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
