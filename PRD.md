# Product Requirement Document (PRD)
## SSCM — Service Supply Chain Management (Custom Stack)

* **Nama Proyek:** SSCM (Service Supply Chain Management)
* **Basis Ideasi:** Transformasi dari Odoo SSCM ke Custom Stack & UI TokoJendral
* **Target Lingkungan:** Single Outlet / Satu Toko Fisik (Offline-First / Local Network)
* **Sektor Bisnis Terpadu:** 
  1. **Bengkel & Carwash** (Automotive Workshop & Detailing)
  2. **Salon, Barbershop, & Klinik Kecantikan** (Beauty & Wellness Clinic)
* **Fokus Rilis Fase 1:** **Booking + Antrean + Kasir + Komisi Teknisi**
* **Status:** Inisiatif Desain Disetujui

---

## 1. Problem Statement & Latar Belakang

Pada bisnis berbasis jasa (seperti bengkel dan salon), kapasitas operasional bersifat **perishable (hangus bila tak terpakai)**. Berbeda dengan toko ritel biasa, penjualan jasa sangat terikat pada dua dimensi rantai pasok (*Dual Supply Chain*):
1. **Rantai Kapasitas (Capacity Chain):** Waktu kerja tenaga ahli (mekanik/terapis) dan ketersediaan fasilitas fisik (pit bengkel / kursi salon). Jika mekanik atau pit menganggur, potensi omzet hilang selamanya.
2. **Rantai Material Habis Pakai (Consumables Chain):** Kebutuhan suku cadang, pelumas mesin, atau serum perawatan yang wajib tersedia tepat saat tindakan pengerjaan dilakukan.

Sistem Odoo sebelumnya berhasil memodelkan logika ini, namun memiliki kendala berupa kompleksitas runtime, beban memori tinggi, UI berbasis form-reload yang lambat di kasir/lantai pengerjaan, dan lisensi/ketergantungan framework.

**Tujuan Proyek Ini:** Mengadopsi arsitektur ringan dan gaya UI proyek **TokoJendral** (Node.js Express, Knex.js, SQLite, Vanilla JS SPA) untuk menghadirkan sistem SSCM yang cepat, mandiri, responsif, dan mudah dijalankan di satu outlet fisik tanpa server cloud mahal.

---

## 2. User Personas & Peran Pengguna

| Persona | Peran & Tanggung Jawab | Kebutuhan Utama Sistem |
| :--- | :--- | :--- |
| **Front Desk / Resepsionis / Service Advisor (SA)** | Menerima pelanggan datang (*walk-in*) atau reservasi via telepon/chat. | Form booking cepat, deteksi tabrakan jadwal otomatis, pemilihan pit/kursi dan teknisi/terapis, pencatatan no. plat / profil pelanggan. |
| **Teknisi / Mekanik / Terapis** | Eksekutor tindakan servis/treatment di lapangan. | Tampilan papan antrean yang jelas, tombol ubah status kerja, fitur mudah untuk mencatat bahan/sparepart yang dipakai dari gudang. |
| **Kasir (Cashier)** | Penyelesaian pembayaran & transaksi toko. | Panggil nomor order servis dalam 1 klik ke keranjang belanja, split payment (tunai, QRIS, transfer), cetak nota, otomatis potong stok FIFO. |
| **Owner / Manajemen Toko** | Pengawasan operasional & penggajian. | Dashboard utilisasi fasilitas, laporan pendapatan jasa vs barang, dan rekapitulasi perhitungan komisi staf yang transparan. |

---

## 3. Ruang Lingkup Kebutuhan Fungsional (Functional Requirements)

### FR-1: Manajemen Sumber Daya Terpadu (Unified Resource & Staff Management)
* **FR-1.1:** Sistem harus mendukung pencatatan **Fasilitas Fisik** (`service_resources`) dengan identifikasi jenis:
  * Bengkel: `BAY`, `LIFT`, `PIT_SERVIS`.
  * Salon: `CHAIR`, `BED`, `ROOM_FACIAL`.
* **FR-1.2:** Sistem harus mencatat **Tenaga Ahli** (`service_staff`) yang terhubung dengan akun login atau profil karyawan:
  * Dilengkapi atribut keahlian (`MECHANIC`, `THERAPIST`, `STYLIST`) dan persentase komisi standar atau nominal insentif flat.
* **FR-1.3:** Setiap fasilitas dan staf memiliki status ketersediaan *real-time* (`AVAILABLE`, `OCCUPIED`, `OFF_DUTY`, `MAINTENANCE`).

### FR-2: Modul Booking & Collision Engine (Reservasi Bebas Bentrok)
* **FR-2.1:** Front desk dapat menginput jadwal reservasi mencakup: Nama pelanggan, kontak, identitas aset (No. Plat / Catatan Treatment), jenis layanan, estimasi durasi waktu, fasilitas terpilih, dan staf terpilih.
* **FR-2.2 (Collision Engine):** Backend wajib mengeksekusi validasi tumpang tindih waktu (*overlap query constraint*) sebelum jadwal disimpan:
  $$\text{Waktu Mulai Baru} < \text{Waktu Selesai Terdaftar} \quad \land \quad \text{Waktu Selesai Baru} > \text{Waktu Mulai Terdaftar}$$
  Pencegahan bentrok berlaku secara independen baik untuk fasilitas fisik maupun staf pelaksana.
* **FR-2.3:** Jika terjadi bentrok, sistem menolak penyimpanan dan memberikan notifikasi visual slot alternatif.

### FR-3: Papan Antrean Visual & Eksekusi SPK (Service Queue & Work Order)
* **FR-3.1:** Tampilan antarmuka berupa papan kartu antrean (*Queue Board*) bergaya kartu TokoJendral dengan tahapan status:
  1. `BOOKED` (Terjadwal / Reservasi)
  2. `QUEUED` (Pelanggan tiba di lokasi, menunggu fasilitas/staf)
  3. `IN_PROGRESS` (Sedang dikerjakan oleh mekanik/terapis)
  4. `READY_TO_PAY` (Pengerjaan selesai, siap ditagih di kasir)
  5. `COMPLETED` (Sudah lunas dibayar di kasir)
  6. `CANCELLED` (Dibatalkan)
* **FR-3.2:** Pada status `IN_PROGRESS`, teknisi/staf dapat membuka detail SPK dan menambahkan barang habis pakai (*consumables*) atau sparepart yang diambil dari stok toko (misal: Oli Mesin 1L, Busi, Krim Creambath 200gr).
* **FR-3.3:** Sistem memeriksa ketersediaan stok fisik barang tersebut secara *real-time*.

### FR-4: Integrasi Kasir POS & Split Payment (FIFO Inventory Depletion)
* **FR-4.1:** Di layar POS kasir, tersedia tombol **"Panggil Antrean Servis (Load Service)"**.
* **FR-4.2:** Kasir memilih order yang berstatus `READY_TO_PAY`. Keranjang belanja kasir seketika terisi:
  * Komponen tarif jasa servis.
  * Komponen barang habis pakai / sparepart yang terpakai pada order tersebut.
  * Kasir dapat menambahkan barang belanjaan tambahan (*cross-selling* barang ritel biasa).
* **FR-4.3:** Kasir dapat memilih metode pembayaran tunggal maupun gabungan (**Split Payment**): Tunai, Transfer Bank, atau QRIS.
* **FR-4.4 (Atomic Execution):** Saat tombol pembayaran ditekan:
  * Transaksi tersimpan ke tabel `transactions` dan `transaction_payments`.
  * Stok barang habis pakai otomatis terpotong berdasarkan lapisan **FIFO Batch** terlama (mengadopsi modul inventori TokoJendral).
  * Status order servis otomatis beralih menjadi `COMPLETED`.
  * Pencatatan hak komisi untuk staf pelaksana otomatis dibuat.

### FR-5: Rekapitulasi & Kalkulasi Komisi Teknisi/Terapis
* **FR-5.1:** Setiap transaksi servis yang lunas otomatis menghitung komisi staf dengan formula:
  $$\text{Total Komisi} = \sum (\text{Tarif Jasa} \times \% \text{Komisi Staf}) + \sum (\text{Insentif Jual Part})$$
* **FR-5.2:** Data tersimpan ke tabel `commission_logs` dengan status awal `PENDING`.
* **FR-5.3:** Disediakan halaman **Rekap Komisi Staf**:
  * Filter berdasarkan rentang tanggal dan nama karyawan.
  * Rincian SPK apa saja yang dikerjakan dan komisi yang didapat.
  * Tombol **"Bayarkan Komisi (Settle/Payout)"** yang mengubah status menjadi `PAID_OUT` sebagai bukti serah terima hak gaji/insentif.

---

## 4. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Kecepatan & Responsivitas Antarmuka:** Waktu respon perpindahan tab antrean dan penarikan order ke kasir $< 200\text{ ms}$.
2. **Kemandirian Lokal (Offline-First):** Seluruh sistem dapat beroperasi tanpa ketergantungan koneksi internet publik menggunakan database SQLite lokal (`better-sqlite3`).
3. **Integritas Transaksi Data:** Pemotongan stok FIFO, perubahan status order, dan penerbitan komisi harus dibungkus dalam Knex Database Transaction (`knex.transaction()`) untuk mencegah data korup atau tidak sinkron.
4. **Role-Based Access Control (RBAC):**
   * Role `cashier`: Akses ke POS, Antrean, dan Booking.
   * Role `technician`: Hanya melihat Papan Antrean dan input pemakaian sparepart/bahan.
   * Role `admin` / `owner`: Akses penuh mencakup Rekap Komisi, Pengaturan Fasilitas/Staf, dan Laporan Keuangan.

---

## 5. Kriteria Penerimaan (Acceptance Criteria)

* [ ] Front desk dapat membuat reservasi tanpa risiko tabrakan jadwal (*zero collision*).
* [ ] Status antrean dapat diperbarui secara visual dari mulai dikerjakan hingga siap bayar.
* [ ] Kasir dapat memuat seluruh tagihan jasa & sparepart ke dalam POS dalam 1 klik.
* [ ] Stok suku cadang/bahan habis pakai berkurang secara akurat sesuai alokasi batch FIFO.
* [ ] Komisi teknisi terhitung otomatis dan muncul di laporan komisi dengan akurat tanpa kalkulasi manual.
