# SSCM — Service Supply Chain Management System
### Custom POS, Service Scheduling, & Commission Engine (TokoJendral Stack & UI Style)

Sistem manajemen rantai pasok jasa (**Service Supply Chain Management**) mandiri (*custom development*) untuk operasional **satu outlet fisik** yang menggabungkan dua lini bisnis: **Bengkel & Carwash (Automotive Workshop)** serta **Salon, Barbershop, & Klinik Kecantikan (Beauty & Wellness)**.

Sistem ini mentransformasikan konsep bisnis **odoo-SSCM** ke dalam arsitektur ringan, cepat, dan modular dengan *tech stack* dan *style UI* yang diadopsi dari proyek **TokoJendral** (Node.js Express, Knex.js, SQLite, dan Vanilla JS Component-based SPA).

---

## 📌 Dokumen Referensi & Tutorial
* 📖 **Buku Panduan & Tutorial Interaktif (HTML):** [docs/tutorial.html](file:///c:/Users/ZYREX/Documents/SSCM/docs/tutorial.html)
* 📕 **Dokumen Tutorial Lengkap Siap Cetak (PDF):** [docs/Tutorial_SSCM_System.pdf](file:///c:/Users/ZYREX/Documents/SSCM/docs/Tutorial_SSCM_System.pdf)
* 📋 **Product Requirement Document:** [PRD.md](file:///c:/Users/ZYREX/Documents/SSCM/PRD.md)
* 🏗️ **Arsitektur Teknis & Skema Database:** [ARCHITECTURE.md](file:///c:/Users/ZYREX/Documents/SSCM/ARCHITECTURE.md)

---

## 🚀 4 Pilar Utama (Fase 1)

1. **Booking & Collision Guard (Reservasi Bebas Bentrok):**
   * Penjadwalan reservasi pelanggan secara presisi.
   * *Dual-Resource Collision Engine* yang memvalidasi ketersediaan waktu fasilitas fisik (Bay/Lift/Kursi) dan tenaga ahli (Mekanik/Terapis) secara bersamaan.
2. **Papan Antrean Visual (Service Queue Board):**
   * Visualisasi status pengerjaan SPK (Surat Perintah Kerja) dengan alur status: `Booking` $\rightarrow$ `Antrean Masuk` $\rightarrow$ `Sedang Dikerjakan` $\rightarrow$ `Selesai (Siap Bayar)`.
   * Pencatatan konsumsi bahan habis pakai (*sparepart*, oli, sampo, serum) secara langsung selama pengerjaan berlangsung.
3. **Kasir POS & Split Payment (Terintegrasi FIFO Batch):**
   * Fitur *One-Click Load Service Order* di kasir: keranjang otomatis terisi gabungan biaya jasa pengerjaan dan barang/bahan yang digunakan.
   * Mendukung pembayaran fleksibel (*Split Payment*: Tunai, Transfer Bank, QRIS).
   * Pemotongan stok bahan baku/sparepart otomatis menggunakan metode **FIFO (First-In, First-Out)** mengadopsi modul inventori TokoJendral.
4. **Rekap & Kalkulasi Komisi Teknisi/Terapis:**
   * Otomasi pencatatan komisi karyawan secara *real-time* begitu transaksi ditandai lunas di kasir.
   * Dashboard rekapitulasi hak komisi dan pencairan (*settlement/payout*).

---

## 🛠️ Tech Stack & Filosofi Desain

Mengikuti kesuksesan arsitektur **TokoJendral**, sistem ini dibangun tanpa ketergantungan framework yang berat:

* **Backend:**
  * **Runtime:** Node.js (v20+)
  * **Framework:** Express.js (v5.x)
  * **Database & Query Builder:** SQLite3 (`better-sqlite3`) + Knex.js (Migrations & Seeding)
  * **Autentikasi & Keamanan:** JWT (JSON Web Token), bcryptjs, Helmet, CORS, Express-Validator
* **Frontend:**
  * **Arsitektur:** Single Page Application (SPA) berbasis Vanilla JavaScript Modern (ES6 Modules)
  * **Komponen:** Komponen mandiri (`app.js`, `Sidebar.js`, `Services.js`, `POS.js`, `Commissions.js`)
  * **Desain UI:** *Design System* ala TokoJendral (`style.css`), tipografi rapi, palet warna elegan, kartu antrean interaktif, modal dinamis, dan responsif untuk layar POS kasir maupun tablet kerja teknisi.
* **Karakteristik Operasional:**
  * **Offline-First / Local Deployment:** Berjalan optimal di satu PC lokal toko tanpa membutuhkan koneksi internet stabil atau server cloud berspesifikasi tinggi.
  * **Zero License Fee:** Bebas dari biaya lisensi per-pengguna/bulan.

---

## 🗂️ Struktur Direktori

```text
SSCM/
├── database/
│   ├── migrations/               # Skema tabel Knex (resources, orders, commissions)
│   ├── seeds/                    # Data awal (bay bengkel, kursi salon, staf, paket jasa)
│   └── sscm.db                   # Database SQLite lokal
├── src/
│   ├── config/                   # Konfigurasi database & environment
│   ├── controllers/              # Handler HTTP request (Service, Booking, Commission)
│   ├── middleware/               # Auth, RBAC, dan validasi schema
│   ├── models/                   # Layer abstraksi query database Knex
│   ├── routes/                   # Routing API (/api/services, /api/commissions, dll)
│   └── services/                 # Business logic: Collision Engine, FIFO, Commission Calc
├── public/
│   ├── css/
│   │   └── style.css             # Desain UI TokoJendral (Dark/Light card, buttons, modals)
│   ├── js/
│   │   ├── components/           # Komponen UI SPA (Services.js, POS.js, Commissions.js)
│   │   ├── utils/                # Helper formatter mata uang, waktu, status badge
│   │   ├── api.js                # Wrapper fetch HTTP API
│   │   └── app.js                # Router dan state manager
│   ├── pages/
│   │   └── dashboard.html        # Shell HTML dashboard utama
│   └── index.html                # Halaman login
├── ARCHITECTURE.md               # Spesifikasi arsitektur teknis & ERD
├── PRD.md                        # Product Requirement Document
└── README.md                     # Dokumentasi utama proyek
```
