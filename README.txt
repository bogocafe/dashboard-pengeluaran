CARA MEMBUAT DASHBOARD BOGO CAFE ONLINE + GOOGLE SHEETS

1. Buat Google Sheets baru.
   Nama bebas, contoh: BOGO CAFE Pengeluaran.

2. Di Google Sheets:
   Klik Extensions / Ekstensi > Apps Script.

3. Hapus kode bawaan, lalu paste isi file:
   apps-script.gs

4. Klik Save.

5. Deploy Apps Script:
   Klik Deploy > New Deployment.
   Pilih type: Web app.
   Execute as: Me / Saya.
   Who has access: Anyone / Siapa saja.
   Klik Deploy.

6. Copy URL Web App yang diberikan Google.

7. Buka file index.html di browser atau upload folder ini ke hosting.
   Hosting gratis yang bisa dipakai:
   - Netlify
   - Vercel
   - cPanel hosting biasa

8. Tempel URL Web App di kolom:
   Google Apps Script Web App URL

9. Klik "Simpan URL".

10. Untuk mengambil data dari Google Sheets:
   Klik "Ambil Data".

11. Untuk menyimpan data ke Google Sheets:
   Isi nominal pengeluaran, lalu klik "Simpan ke Google Sheets".

CATATAN:
- Data sementara juga tersimpan di browser lewat localStorage.
- Data utama tersimpan di Google Sheets setelah klik Simpan.
- Jangan bagikan URL Apps Script ke orang yang tidak boleh mengedit data.
