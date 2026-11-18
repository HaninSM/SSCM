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
├── docs/
│   ├── tutorial.html             # Buku panduan & tutorial interaktif
│   └── Tutorial_SSCM_System.pdf  # Dokumentasi PDF siap cetak A4
├── generate-pdf.js               # Script generator PDF berbasis Puppeteer & Edge
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

---

## 🧪 Data Awal Bawaan (Seed Data Specification)

Setelah menjalankan `npm run seed` (atau `npm run setup`), database SQLite lokal secara otomatis terisi dengan data komprehensif untuk pengujian dan simulasi operasional:

### 1. Akun Pengguna (Demo Logins)
| Username | Password | Role / Peran | Nama Pengguna | Akses Modul |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `admin` | Super Admin | Akses penuh (Dashboard, Antrean, POS, Rekap Komisi, Master Data) |
| `kasir` | `kasir123` | `cashier` | Siti Kasir | Akses operasional harian (Dashboard, Antrean, Kasir POS) |

### 2. Fasilitas Fisik Terdaftar (Service Resources)
* **Divisi Bengkel & Carwash (`WORKSHOP`):**
  * `BAY-01` — Pit Servis Motor 1 (*Status: OCCUPIED*)
  * `BAY-02` — Pit Servis Motor 2 (*Status: AVAILABLE*)
  * `LIFT-01` — Hidrolik Cuci / Carwash 1 (*Status: AVAILABLE*)
* **Divisi Salon & Treatment (`SALON`):**
  * `CHR-01` — Kursi Styling & Potong 1 (*Status: OCCUPIED*)
  * `CHR-02` — Kursi Styling & Potong 2 (*Status: AVAILABLE*)
  * `BED-01` — Bed Facial & Spa 1 (*Status: AVAILABLE*)

### 3. Tenaga Ahli & Teknisi (Service Staff)
* `MEC-01` — **Budi Hartono** (Divisi Bengkel, Jabatan: Mekanik, Komisi: 20% + Insentif Flat Rp 5.000)
* `MEC-02` — **Agus Pratama** (Divisi Bengkel, Jabatan: Mekanik, Komisi: 15% + Insentif Flat Rp 3.000)
* `STY-01` — **Dewi Lestari** (Divisi Salon, Jabatan: Stylist, Komisi: 25% + Insentif Flat Rp 5.000)
* `THR-01` — **Rina Anggraini** (Divisi Salon, Jabatan: Terapis, Komisi: 20% + Insentif Flat Rp 5.000)

### 4. Katalog Layanan Jasa & Suku Cadang (Items Catalog)
* **Jasa Layanan (`SERVICE`):**
  * `SRV-W01` — Servis Ringan & Tune Up Injeksi (Tarif: Rp 75.000, Durasi: 45 mnt, Komisi: 20%)
  * `SRV-W02` — Jasa Ganti Oli & Pengecekan Rem (Tarif: Rp 25.000, Durasi: 20 mnt, Komisi: 15%)
  * `SRV-W03` — Cuci Motor Detailing & Semir Ban (Tarif: Rp 35.000, Durasi: 30 mnt, Komisi: 20%)
  * `SRV-S01` — Haircut Premium & Wash Styling (Tarif: Rp 60.000, Durasi: 40 mnt, Komisi: 25%)
  * `SRV-S02` — Creambath Tradisional + Pijat Leher (Tarif: Rp 95.000, Durasi: 60 mnt, Komisi: 20%)
  * `SRV-S03` — Facial Brightening & Totok Wajah (Tarif: Rp 150.000, Durasi: 75 mnt, Komisi: 20%)
* **Bahan Konsumsi / Sparepart (`CONSUMABLE`):**
  * `PRT-W01` — Oli Mesin Matic 10W-30 0.8L (Harga: Rp 65.000, Stok: 24 Botol)
  * `PRT-W02` — Busi Standar U27EPR9 (Harga: Rp 35.000, Stok: 15 Pcs)
  * `PRT-W03` — Kampas Rem Cakram Depan (Harga: Rp 55.000, Stok: 10 Set)
  * `CSM-S01` — Serum Rambut Argan Oil 10ml (Harga: Rp 35.000, Stok: 30 Botol)
  * `CSM-S02` — Krim Masker Creambath Lidah Buaya 250g (Harga: Rp 40.000, Stok: 18 Jar)
  * `CSM-S03` — Ampul Serum Vitamin C Glow (Harga: Rp 50.000, Stok: 20 Ampul)

### 5. Lapisan Persediaan FIFO (Inventory Batches)
Tercatat 7 batch masuk dengan tanggal penerimaan berbeda untuk menguji akurasi pemotongan HPP FIFO saat checkout kasir.

### 6. Surat Perintah Kerja (SPK) Aktif Bawaan
1. **`SPK-W202611-001` (Hendra Gunawan - Bengkel):**
   * *Status:* `IN_PROGRESS` (Sedang Dikerjakan)
   * *Aset:* `B 4128 SZZ (Honda Vario 160)`
   * *Alokasi:* Pit Servis 1 (`BAY-01`) • Mekanik Budi Hartono
   * *Rincian:* Servis Ringan + Oli Matic (Estimasi Total: Rp 140.000)
2. **`SPK-S202611-002` (Jessica Melina - Salon):**
   * *Status:* `READY_TO_PAY` (Pengerjaan Selesai & Siap Ditarik ke Kasir POS)
   * *Aset:* `Rambut Layer Pendek (Kulit Sensitif)`
   * *Alokasi:* Kursi Styling 1 (`CHR-01`) • Stylist Dewi Lestari
   * *Rincian:* Haircut + Creambath + Serum Argan + Krim Masker (Estimasi Total: Rp 230.000)
3. **`SPK-W202611-003` (Bambang Sudiro - Bengkel):**
   * *Status:* `BOOKED` (Reservasi Mendatang)
   * *Aset:* `D 1944 AD (Yamaha NMAX)`
   * *Alokasi:* Pit Servis 2 (`BAY-02`) • Mekanik Agus Pratama (Rencana: Servis Ringan + Kampas Rem)

---

## ⚡ Perintah Cepat (CLI Commands)

```bash
# Menjalankan server aplikasi
npm start

# Mode development (auto-reload)
npm run dev

# Reset dan isi ulang data awal (Clean Re-seed)
npm run seed

# Setup ulang database dari awal (Migrate + Seed)
npm run setup

# Kompilasi ulang tutorial HTML ke format PDF
node generate-pdf.js
```

