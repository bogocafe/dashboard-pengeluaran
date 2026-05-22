const SHEET_NAME = 'Pengeluaran';

const CATEGORIES = [
  'Ayam / KG', 'Cabe Merah', 'Cabe Hijau', 'Cabe Rawit', 'Bawang', 'Sawi', 'Sop/pre', 'Terong',
  'Timun', 'Tempe', 'Kol', 'Tomat', 'Lemon', 'Krupuk', 'Rokok', 'Listrik', 'Minuman',
  'Bawang Goreng', 'Telur', 'Rempah', 'Gula Aren'
];

function doGet(e) {
  const action = e.parameter.action || 'read';

  if (action === 'read') {
    return jsonResponse({
      success: true,
      rows: readRows()
    });
  }

  return jsonResponse({ success: false, message: 'Action tidak dikenal.' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');

    if (body.action === 'write') {
      writeRows(body.rows || []);
      return jsonResponse({ success: true, message: 'Data berhasil disimpan.' });
    }

    return jsonResponse({ success: false, message: 'Action tidak dikenal.' });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  const header = ['Tanggal'].concat(CATEGORIES).concat(['Total']);
  const currentHeader = sheet.getRange(1, 1, 1, header.length).getValues()[0];

  if (currentHeader[0] !== 'Tanggal') {
    sheet.clear();
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function readRows() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = CATEGORIES.length + 2;

  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return values.map(row => {
    const obj = {
      date: row[0],
      values: {}
    };

    CATEGORIES.forEach((cat, i) => {
      obj.values[cat] = Number(row[i + 1]) || 0;
    });

    return obj;
  }).filter(row => row.date);
}

function writeRows(rows) {
  const sheet = getSheet();
  const lastCol = CATEGORIES.length + 2;

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).clearContent();
  }

  if (!rows.length) return;

  const data = rows.map(row => {
    const values = CATEGORIES.map(cat => Number(row.values && row.values[cat]) || 0);
    const total = values.reduce((a, b) => a + b, 0);
    return [row.date].concat(values).concat([total]);
  });

  sheet.getRange(2, 1, data.length, lastCol).setValues(data);
  sheet.getRange(2, 2, data.length, lastCol - 1).setNumberFormat('"Rp"#,##0');
  sheet.autoResizeColumns(1, lastCol);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
