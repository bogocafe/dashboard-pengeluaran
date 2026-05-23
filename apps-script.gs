/**
 * BOGO CAFE - Backend Google Sheets untuk Dashboard Pengeluaran
 * Cara pakai:
 * 1) Buat Google Spreadsheet baru.
 * 2) Extensions > Apps Script.
 * 3) Paste seluruh isi file ini.
 * 4) Ganti SPREADSHEET_ID dengan ID Spreadsheet kamu.
 * 5) Run function setup() sekali, beri izin akses.
 * 6) Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 7) Copy Web App URL /exec lalu tempel di dashboard.
 */

const SPREADSHEET_ID = 'https://docs.google.com/spreadsheets/d/1kV-qSv6Qv5LTYzc66kojNKGaihq-C0rW5tKRvT6A_sc';
const SHEET_NAME = 'Sheet1';

const DEFAULT_HEADERS = [
  'Tanggal',
  'Beras',
  'Ayam',
  'Sayur',
  'Bumbu',
  'Minuman',
  'Gas',
  'Listrik',
  'Gaji',
  'Lainnya',
  'Keterangan',
  'UpdatedAt'
];

function setup() {
  const sheet = getSheet_();
  ensureHeaders_(sheet, DEFAULT_HEADERS);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, sheet.getLastColumn());
  return json_({ ok: true, message: 'Setup selesai', sheetName: SHEET_NAME });
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = (params.action || 'read').toLowerCase();

    if (action === 'setup') {
      const result = setup();
      return withCallback_(result, params.callback);
    }

    if (action === 'ping') {
      return withCallback_({ ok: true, message: 'BOGO CAFE API online', time: new Date().toISOString() }, params.callback);
    }

    const sheet = getSheet_();
    ensureHeaders_(sheet, DEFAULT_HEADERS);

    if (action === 'headers') {
      return withCallback_({ ok: true, headers: getHeaders_(sheet) }, params.callback);
    }

    const data = readRows_(sheet);
    return withCallback_({ ok: true, data, count: data.length }, params.callback);
  } catch (err) {
    return withCallback_({ ok: false, error: String(err && err.message ? err.message : err) }, (e && e.parameter && e.parameter.callback) || '');
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const body = parseBody_(e);
    const action = String(body.action || 'save').toLowerCase();

    const sheet = getSheet_();
    ensureHeaders_(sheet, DEFAULT_HEADERS);

    if (action === 'setup') {
      const result = setup();
      return json_(result);
    }

    if (action === 'clear') {
      clearData_(sheet);
      return json_({ ok: true, message: 'Semua data pengeluaran sudah dikosongkan' });
    }

    if (action === 'bulksave' || action === 'replace') {
      const rows = Array.isArray(body.data) ? body.data : [];
      replaceRows_(sheet, rows);
      return json_({ ok: true, message: 'Data berhasil diganti semua', count: rows.length });
    }

    if (action === 'delete') {
      const tanggal = body.tanggal || body.Tanggal || body.date || body.Date;
      if (!tanggal) throw new Error('Tanggal wajib diisi untuk delete');
      const deleted = deleteByTanggal_(sheet, tanggal);
      return json_({ ok: true, message: deleted ? 'Data berhasil dihapus' : 'Tanggal tidak ditemukan', deleted });
    }

    // Default: save/upsert 1 baris berdasarkan tanggal.
    const row = body.data && !Array.isArray(body.data) ? body.data : body;
    const saved = upsertRow_(sheet, row);
    return json_({ ok: true, message: 'Data berhasil disimpan ke Google Sheets', saved });

  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Fungsi ini berguna kalau frontend dashboard memakai GET + callback JSONP.
 * Contoh:
 * /exec?action=read&callback=namaFunction
 */
function withCallback_(payload, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(String(callback) + '(' + JSON.stringify(payload) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(payload);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'ISI_ID_SPREADSHEET_KAMU_DI_SINI') {
    throw new Error('SPREADSHEET_ID belum diisi. Ambil ID dari URL Google Sheets kamu.');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeaders_(sheet, requiredHeaders) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  let headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].filter(String);

  if (headers.length === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    return requiredHeaders;
  }

  let changed = false;
  requiredHeaders.forEach(h => {
    if (!headers.includes(h)) {
      headers.push(h);
      changed = true;
    }
  });

  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return headers;
}

function getHeaders_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].filter(String);
}

function readRows_(sheet) {
  const headers = getHeaders_(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  return values
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const value = row[i];
        obj[h] = value instanceof Date
          ? Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
          : value;
      });
      return obj;
    });
}

function upsertRow_(sheet, input) {
  const cleaned = cleanRow_(input);
  const tanggal = cleaned.Tanggal || cleaned.tanggal || cleaned.date || cleaned.Date;

  if (!tanggal) {
    throw new Error('Tanggal wajib diisi');
  }

  cleaned.Tanggal = normalizeDate_(tanggal);
  cleaned.UpdatedAt = new Date().toISOString();

  let headers = getHeaders_(sheet);
  Object.keys(cleaned).forEach(key => {
    const header = normalizeHeader_(key);
    if (!headers.includes(header)) headers.push(header);
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const targetRow = findRowByTanggal_(sheet, cleaned.Tanggal, headers);
  const values = headers.map(h => cleaned[h] !== undefined ? cleaned[h] : '');

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([values]);
    return { mode: 'update', tanggal: cleaned.Tanggal };
  }

  sheet.appendRow(values);
  return { mode: 'insert', tanggal: cleaned.Tanggal };
}

function replaceRows_(sheet, rows) {
  if (!Array.isArray(rows)) throw new Error('data harus berbentuk array');

  clearData_(sheet);

  rows.forEach(row => {
    if (row && Object.keys(row).length) upsertRow_(sheet, row);
  });
}

function clearData_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = Math.max(sheet.getLastColumn(), DEFAULT_HEADERS.length);

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
}

function deleteByTanggal_(sheet, tanggal) {
  const headers = getHeaders_(sheet);
  const normalized = normalizeDate_(tanggal);
  const rowIndex = findRowByTanggal_(sheet, normalized, headers);

  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex);
    return true;
  }

  return false;
}

function findRowByTanggal_(sheet, tanggal, headers) {
  const idx = headers.indexOf('Tanggal');
  if (idx === -1 || sheet.getLastRow() < 2) return -1;

  const values = sheet.getRange(2, idx + 1, sheet.getLastRow() - 1, 1).getValues();
  const target = normalizeDate_(tanggal);

  for (let i = 0; i < values.length; i++) {
    const current = normalizeDate_(values[i][0]);
    if (current === target) return i + 2;
  }

  return -1;
}

function parseBody_(e) {
  if (!e) return {};

  if (e.postData && e.postData.contents) {
    const raw = e.postData.contents;
    const type = String(e.postData.type || '').toLowerCase();

    if (type.includes('application/json')) {
      return JSON.parse(raw || '{}');
    }

    // Form encoded atau fallback JSON string.
    try {
      return JSON.parse(raw || '{}');
    } catch (err) {
      const params = {};
      raw.split('&').forEach(pair => {
        const parts = pair.split('=');
        const key = decodeURIComponent(parts[0] || '');
        const value = decodeURIComponent((parts[1] || '').replace(/\+/g, ' '));
        if (key) params[key] = value;
      });
      return params;
    }
  }

  return (e.parameter || {});
}

function cleanRow_(input) {
  const result = {};
  Object.keys(input || {}).forEach(key => {
    if (['action', 'callback'].includes(key)) return;

    const header = normalizeHeader_(key);
    let value = input[key];

    if (typeof value === 'string') {
      value = value.trim();

      // Nominal seperti Rp10.000 atau 10,000 dibuat angka.
      if (header !== 'Tanggal' && header !== 'Keterangan') {
        const numeric = value.replace(/[^\d,-]/g, '').replace(',', '.');
        if (numeric !== '' && !isNaN(Number(numeric))) value = Number(numeric);
      }
    }

    result[header] = value;
  });

  return result;
}

function normalizeHeader_(key) {
  const map = {
    tanggal: 'Tanggal',
    date: 'Tanggal',
    beras: 'Beras',
    ayam: 'Ayam',
    sayur: 'Sayur',
    bumbu: 'Bumbu',
    minuman: 'Minuman',
    gas: 'Gas',
    listrik: 'Listrik',
    gaji: 'Gaji',
    lainnya: 'Lainnya',
    keterangan: 'Keterangan',
    catatan: 'Keterangan',
    updatedat: 'UpdatedAt'
  };

  const raw = String(key || '').trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, '');
  return map[normalized] || raw.charAt(0).toUpperCase() + raw.slice(1);
}

function normalizeDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  const text = String(value || '').trim();

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  // dd/mm/yyyy atau dd-mm-yyyy
  const match = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const d = match[1].padStart(2, '0');
    const m = match[2].padStart(2, '0');
    const y = match[3];
    return `${y}-${m}-${d}`;
  }

  return text;
}
