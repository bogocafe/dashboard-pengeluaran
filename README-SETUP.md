# BOGO CAFE Dashboard Pengeluaran

Paket ini berisi file baru dari awal:

- `index.html` → upload/ganti ke GitHub Pages.
- `apps-script.gs` → tempel ke Google Apps Script.
- `sheet-template.csv` → contoh header Google Sheets.

## 1. Buat Google Sheets

1. Buat Google Sheets baru.
2. Rename nama tab/sheet menjadi:

```txt
Pengeluaran
```

3. Buat header baris pertama:

```txt
id | date | nama | kat | qty | satuan | harga | note
```

Atau import `sheet-template.csv`.

## 2. Ambil ID Google Sheets

Contoh URL Google Sheets:

```txt
https://docs.google.com/spreadsheets/d/1ABCDEF1234567890/edit
```

Yang disebut ID adalah bagian ini:

```txt
1ABCDEF1234567890
```

## 3. Buat Apps Script

1. Di Google Sheets klik `Extensions / Ekstensi`.
2. Klik `Apps Script`.
3. Hapus kode lama.
4. Copy semua isi file `apps-script.gs`.
5. Ganti bagian ini:

```js
const SPREADSHEET_ID = 'GANTI_DENGAN_ID_GOOGLE_SHEETS_KAMU';
```

menjadi ID Google Sheets kamu.

Contoh:

```js
const SPREADSHEET_ID = '1ABCDEF1234567890';
```

6. Pastikan:

```js
const SHEET_NAME = 'Pengeluaran';
```

sama dengan nama tab Google Sheets.

## 4. Jalankan setup

Di Apps Script:

1. Pilih function `setup`.
2. Klik `Run`.
3. Berikan izin/authorization.

## 5. Deploy Apps Script

1. Klik `Deploy`.
2. Klik `New deployment`.
3. Pilih type: `Web app`.
4. Isi:
   - Execute as: `Me`
   - Who has access: `Anyone`
5. Klik `Deploy`.
6. Copy URL yang berakhiran `/exec`.

Contoh:

```txt
https://script.google.com/macros/s/AKfycbxxxxx/exec
```

Itulah URL Apps Script.

## 6. Upload index.html ke GitHub

1. Buka repo GitHub kamu.
2. Ganti file `index.html` lama dengan file `index.html` baru dari paket ini.
3. Commit changes.
4. Buka GitHub Pages dashboard kamu.

## 7. Sambungkan dashboard ke Google Sheets

1. Di bagian atas dashboard, tempel URL Apps Script.
2. Klik `Simpan URL`.
3. Klik `Tes API`.
4. Kalau berhasil, klik `Simpan ke Sheets` atau tambah data baru.
5. Klik `Ambil Data` untuk cek data dari Google Sheets.

## Catatan penting

- `SPREADSHEET_ID` harus ID Google Sheets, bukan URL Apps Script.
- URL Apps Script adalah link deploy yang berakhiran `/exec`.
- Kalau ubah kode Apps Script, wajib deploy ulang:
  `Deploy > Manage deployments > Edit > New version > Deploy`.
