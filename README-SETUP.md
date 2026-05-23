# File Pelengkap Dashboard Pengeluaran BOGO CAFE

Dashboard kamu sudah online di:

https://bogocafe.github.io/dashboard-pengeluaran/

File yang paling penting agar data pengisian bisa update online adalah:

- `apps-script.gs` = backend Google Apps Script untuk simpan/ambil data dari Google Sheets.
- `sheet-template.csv` = contoh header Google Sheets.

## Cara pasang cepat

### 1. Buat Google Sheets
Buat Spreadsheet baru, misalnya:

`BOGO CAFE - Database Pengeluaran`

Salin ID spreadsheet dari URL:

`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### 2. Buat Apps Script
Di Google Sheets:

`Extensions > Apps Script`

Hapus kode bawaan, lalu paste isi file:

`apps-script.gs`

Ganti baris ini:

```js
const SPREADSHEET_ID = 'ISI_ID_SPREADSHEET_KAMU_DI_SINI';
```

menjadi ID spreadsheet kamu.

### 3. Jalankan setup
Di Apps Script, pilih function:

`setup`

Lalu klik Run dan izinkan akses.

### 4. Deploy sebagai Web App
Klik:

`Deploy > New deployment > Select type > Web app`

Isi:

- Execute as: `Me`
- Who has access: `Anyone`

Klik Deploy, lalu copy URL yang berakhiran `/exec`.

### 5. Tempel URL ke Dashboard
Buka:

https://bogocafe.github.io/dashboard-pengeluaran/

Tempel URL Apps Script di kolom:

`Google Apps Script Web App URL`

Klik:

`Simpan URL`

Setelah itu tombol `Simpan ke Google Sheets` dan `Ambil Data` akan memakai Google Sheets sebagai database online.

## Tes API

Buka URL Apps Script kamu dengan tambahan:

```txt
?action=ping
```

Contoh:

```txt
https://script.google.com/macros/s/xxxx/exec?action=ping
```

Kalau berhasil, akan muncul:

```json
{"ok":true,"message":"BOGO CAFE API online"}
```

## Format kolom default

- Tanggal
- Beras
- Ayam
- Sayur
- Bumbu
- Minuman
- Gas
- Listrik
- Gaji
- Lainnya
- Keterangan
- UpdatedAt

Script ini fleksibel. Kalau dashboard mengirim kategori baru, kolom baru akan ditambahkan otomatis.
