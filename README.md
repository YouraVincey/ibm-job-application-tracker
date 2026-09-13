#  Job Application Tracker App

Aplikasi pelacak dan pengelola lamaran kerja modern berbasis web yang responsif, intuitif, dan *lightweight*. Dibuat murni menggunakan HTML5, Tailwind CSS, dan Vanilla JavaScript tanpa framework eksternal untuk pemenuhan penugasan IBM BOB / IBM SkillsBuild.

---

##  Fitur Utama

- **CRUD Operations**: Tambah, tampilkan, edit, dan hapus data lamaran kerja secara *real-time*.
- **Dashboard Metrics**: Kalkulasi otomatis *Success Rate (%)*, *Total Applications*, dan status *In-Progress*.
- **Live Search & Dynamic Filter**: Filter data berdasarkan status lamaran (*Applied*, *Interview*, *Offer*, *Rejected*) serta pencarian instan nama perusahaan tanpa me-refresh halaman.
- **Data Persistence**: Seluruh data tersimpan aman secara lokal menggunakan `localStorage` browser.
- **Responsive & Modern UI**: Tampilan antarmuka profesional berbasis *mobile-first* dengan skema warna Biru, Putih, dan aksen Oranye.

---

##  Teknologi yang Digunakan

- **HTML5**: Struktur halaman semantik.
- **Tailwind CSS (v3 CDN)**: Styling antarmuka utama.
- **Vanilla JavaScript (ES6+)**: Logika aplikasi modular (`AppState`, `StorageManager`, `UIRenderer`, `AppController`).