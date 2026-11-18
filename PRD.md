# Product Requirement Document (PRD)
## SSCM — Service Supply Chain Management (Custom Stack)

* **Nama Proyek:** SSCM (Service Supply Chain Management)
* **Basis Ideasi:** Transformasi dari Odoo SSCM ke Custom Stack & UI TokoJendral
* **Target Lingkungan:** Single Outlet / Satu Toko Fisik (Offline-First / Local Network)
* **Sektor Bisnis Terpadu:** 
  1. **Bengkel & Carwash** (Automotive Workshop & Detailing)
  2. **Salon, Barbershop, & Klinik Kecantikan** (Beauty & Wellness Clinic)
* **Ruang Lingkup Sistem:**
  * **Fase 1 (Live & Tested):** Booking, Papan Antrean, Kasir POS Split Payment, dan Komisi Staf.
  * **Fase 2 (Approved Architecture):** Riwayat Servis Lengkap (Asset Lifecycle) & Klaim Garansi Servis (Warranty Claim Management).
* **Status:** Inisiatif Desain & Spesifikasi Disetujui

---

## 1. Problem Statement & Latar Belakang

Pada bisnis berbasis jasa (seperti bengkel dan salon), kapasitas operasional bersifat **perishable (hangus bila tak terpakai)**. Berbeda dengan toko ritel biasa, penjualan jasa sangat terikat pada dua dimensi rantai pasok (*Dual Supply Chain*):
1. **Rantai Kapasitas (Capacity Chain):** Waktu kerja tenaga ahli (mekanik/terapis) dan ketersediaan fasilitas fisik (pit bengkel / kursi salon). Jika mekanik atau pit menganggur, potensi omzet hilang selamanya.
2. **Rantai Material Habis Pakai (Consumables Chain):** Kebutuhan suku cadang, pelumas mesin, atau serum perawatan yang wajib tersedia tepat saat tindakan pengerjaan dilakukan.

Selain eksekusi pengerjaan awal, bisnis jasa memiliki titik krusial dalam retensi konsumen: **Klaim Garansi (Jaminan Mutu)** dan **Riwayat Servis Berkelanjutan**. Jika pengerjaan servis tidak tuntas atau menimbulkan keluhan, toko wajib memiliki mekanisme klaim garansi yang adil tanpa merugikan teknisi, tanpa merusak pencatatan inventori, dan tanpa menimbulkan kebocoran kas.

**Tujuan Proyek Ini:** Mengadopsi arsitektur ringan dan gaya UI proyek **TokoJendral** (Node.js Express, Knex.js, SQLite, Vanilla JS SPA) untuk menghadirkan sistem SSCM yang cepat, mandiri, responsif, dan mudah dijalankan di satu outlet fisik tanpa server cloud mahal.

---

## 2. User Personas & Peran Pengguna

| Persona | Peran & Tanggung Jawab | Kebutuhan Utama Sistem |
| :--- | :--- | :--- |
| **Front Desk / Resepsionis / Service Advisor (SA)** | Menerima pelanggan datang (*walk-in*) atau reservasi via telepon/chat. | Form booking cepat, deteksi tabrakan jadwal otomatis, lookup riwayat servis via plat nomor/nama, cek status masa berlaku garansi. |
| **Teknisi / Mekanik / Terapis** | Eksekutor tindakan servis/treatment di lapangan. | Tampilan papan antrean yang jelas, tombol ubah status kerja, fitur input bahan/sparepart FIFO, instruksi pengerjaan ulang garansi. |
| **Supervisor / Kepala Bengkel / QC** | Pengendali mutu pengerjaan & verifikator klaim. | Melakukan inspeksi fisik unit komplain, mendiagnosa akar masalah (*workmanship error* vs *part defect* vs *misuse*), menyetujui klaim garansi. |
| **Kasir (Cashier)** | Penyelesaian pembayaran & transaksi toko. | Panggil nomor order servis dalam 1 klik ke keranjang belanja, split payment (tunai, QRIS, transfer), eksekusi penagihan SPK Garansi Rp 0 (*Free of Charge*). |
| **Owner / Manajemen Toko** | Pengawasan operasional & penggajian. | Dashboard utilisasi fasilitas, laporan beban klaim garansi (*quality expense*), dan rekapitulasi perhitungan komisi staf yang transparan dan adil. |

---

## 3. Ruang Lingkup Kebutuhan Fungsional (Functional Requirements)

### FR-1: Manajemen Sumber Daya Terpadu (Unified Resource & Staff Management)
* **FR-1.1:** Sistem mendukung pencatatan **Fasilitas Fisik** (`service_resources`) dengan identifikasi jenis:
  * Bengkel: `BAY`, `LIFT`, `PIT_SERVIS`.
  * Salon: `CHAIR`, `BED`, `ROOM_FACIAL`.
* **FR-1.2:** Sistem mencatat **Tenaga Ahli** (`service_staff`) yang terhubung dengan akun login atau profil karyawan:
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
* **FR-4.2:** Kasir memilih order yang berstatus `READY_TO_PAY`. Keranjang belanja kasir seketika terisi komponen tarif jasa dan sparepart/bahan habis pakai.
* **FR-4.3:** Kasir dapat memilih metode pembayaran tunggal maupun gabungan (**Split Payment**): Tunai, Transfer Bank, atau QRIS.
* **FR-4.4 (Atomic Execution):** Saat tombol pembayaran ditekan:
  * Transaksi tersimpan ke tabel `transactions` dan `transaction_payments`.
  * Stok barang habis pakai otomatis terpotong berdasarkan lapisan **FIFO Batch** terlama.
  * Status order servis otomatis beralih menjadi `COMPLETED`.
  * Pencatatan hak komisi untuk staf pelaksana otomatis dibuat.

### FR-5: Rekapitulasi & Kalkulasi Komisi Teknisi/Terapis
* **FR-5.1:** Setiap transaksi servis yang lunas otomatis menghitung komisi staf dengan formula:
  $$\text{Total Komisi} = \sum (\text{Tarif Jasa} \times \% \text{Komisi Staf}) + \sum (\text{Insentif Jual Part})$$
* **FR-5.2:** Data tersimpan ke tabel `commission_logs` dengan status awal `PENDING`.
* **FR-5.3:** Disediakan halaman **Rekap Komisi Staf** dengan filter rentang tanggal dan tombol **"Bayarkan Komisi (Settle/Payout)"** yang mengubah status menjadi `PAID_OUT`.

---

### FR-6: Riwayat Servis Lengkap & Siklus Hidup Aset Pelanggan (Asset Lifecycle)
* **FR-6.1 (Manajemen Aset Terpadu):** Sistem mencatat entitas `customer_assets` yang terhubung dengan pelanggan:
  * **Sektor Bengkel:** Nomor Polisi, Tipe Kendaraan, Nomor Rangka/Mesin, dan pembacaan **Odometer (Kilometer/KM)** terakhir.
  * **Sektor Salon:** Profil Rambut/Kulit, riwayat warna sebelumnya, dan **Catatan Khusus Alergi Kimiawi**.
* **FR-6.2 (Quick Lookup Front Desk):** SA cukup mengetik nomor plat atau nama pelanggan di *Global Search* untuk menampilkan kartu rangkuman:
  * Tanggal dan jenis servis terakhir.
  * Komponen sparepart apa saja yang pernah diganti dan tanggal kadaluwarsa garansinya.
  * Rekomendasi servis berkala berikutnya (misal: ganti oli tiap 2.000 KM atau retouch warna tiap 30 hari).
* **FR-6.3 (Allergy Warning Alert):** Khusus sektor salon, jika profil pelanggan memiliki riwayat alergi zat kimia (misal: *Amonia, Bleaching Powder, Paraben*), form booking dan kartu antrean wajib menampilkan **Peringatan Menyala Kuning/Merah** agar terapis tidak salah menggunakan produk.

---

### FR-7: Manajemen Garansi Servis & Penanganan Klaim (Warranty Claims)
* **FR-7.1 (Kebijakan Garansi Otomatis):** Setiap penyelesaian order servis lunas secara otomatis mengaktifkan hak garansi berdasarkan aturan tabel `warranty_policies`:
  * *Garansi Jasa Bengkel:* 14 Hari kalender **ATAU** 1.000 KM (mana yang tercapai lebih dulu).
  * *Garansi Suku Cadang Bengkel:* 30 hari s/d 12 bulan (misal: Aki/Battery dengan pelacakan nomor seri pabrik).
  * *Garansi Retouch Salon:* 3 s/d 7 Hari kalender pasca tindakan pewarnaan atau perawatan kuku.
* **FR-7.2 (Pendaftaran Klaim & Validasi Dual-Constraint):** Saat pelanggan mengajukan keluhan purna-jual:
  * SA menginput klaim yang mereferensikan nomor SPK asal (`original_service_order_id`).
  * Backend memvalidasi apakah tanggal klaim dan KM saat ini masih berada dalam rentang proteksi aktif.
* **FR-7.3 (Inspeksi & Diagnosa Akar Masalah / Root Cause):** Supervisor/QC melakukan inspeksi fisik dan menentukan klasifikasi:
  1. `WORKMANSHIP_ERROR`: Kesalahan setelan teknisi $\to$ Disetujui servis ulang gratis.
  2. `DEFECTIVE_PART`: Suku cadang pecah/cacat pabrik $\to$ Disetujui ganti part gratis + retur vendor.
  3. `CUSTOMER_MISUSE`: Kerusakan akibat kelalaian pemakaian (misal: motor menabrak trotoar atau rambut dicuci air panas ekstrem) $\to$ Klaim ditolak secara formal dengan penjelasan teknis.
* **FR-7.4 (Penerbitan SPK Garansi Rp 0 / Free of Charge):**
  * Klaim yang disetujui otomatis menerbitkan SPK Pengerjaan Ulang dengan tagihan jasa ke pelanggan sebesar **Rp 0**.
  * Suku cadang pengganti tetap dipotong dari gudang menggunakan metode **FIFO Batch**.
  * HPP riil part pengganti dibukukan sebagai beban operasional toko (`expenses`) dengan kategori **"Biaya Penjaminan Mutu & Garansi Toko"**.

---

## 4. Tantangan Operasional di Lapangan, Problem Riil, & Solusi Rekayasa Sistem (Field Challenges & Engineering Solutions)

Berdasarkan pengalaman implementasi rantai pasok jasa di lapangan, terdapat 5 tantangan kritis yang sering menyebabkan sistem manual gagal dan menimbulkan kerugian bagi pemilik usaha:

---

### ⚠️ Tantangan 1: Validasi Dual-Limit Garansi (Tanggal vs Jarak Tempuh Odometer)

* **Problem Lapangan yang Terjadi:**
  Di bengkel, pelanggan sering datang menuntut garansi servis gratis pada hari ke-13 (masih di bawah batas 14 hari). Namun saat dicek odometernya, motor tersebut telah dipakai bekerja ojek online sejauh 3.200 KM (melebihi batas aman 1.000 KM). Dalam pencatatan manual, kasir sering lalai mengecek KM sehingga toko menanggung kerugian pengerjaan ulang yang sebetulnya bukan kesalahan bengkel.
* **Akar Masalah:**
  Sistem kasir biasa hanya mencatat tanggal transaksi, tanpa mengaitkan batas toleransi pemakaian mekanis (*usage-based deterioration*).
* **Solusi Rekayasa Sistem (SSCM Solution):**
  1. Pada form pendaftaran klaim, field `Odometer Saat Ini (KM)` berstatus **Wajib Diisi (Mandatory)**.
  2. Algoritma backend Express memvalidasi rumus gabungan secara instan:
     $$\text{Garansi Berlaku} \iff (\text{Hari Berlalu} \le \text{Max Days}) \quad \land \quad (\text{KM Saat Ini} - \text{KM Servis Asal} \le \text{Max KM})$$
  3. Jika salah satu kondisi dilanggar, status klaim seketika ditandai `EXPIRED` berwarna merah, dan tombol penerbitan SPK Rp 0 otomatis terkunci.
  4. Tersedia fitur *Manager Override* (hanya bisa diotorisasi oleh role `admin`) jika pemilik toko tetap ingin memberikan toleransi demi kepuasan pelanggan khusus.

---

### ⚠️ Tantangan 2: Dilema Pembagian Komisi Staf Saat Pengerjaan Servis Ulang Garansi (Rework Commission Policy)

* **Problem Lapangan yang Terjadi:**
  Pengerjaan servis ulang garansi gratis sering memicu konflik internal antar karyawan:
  * *Kasus A:* Mekanik A melakukan kesalahan pemasangan kampas rem. Jika Mekanik A memperbaiki, apakah dia berhak dapat komisi lagi? Jelas tidak adil jika toko membayar komisi dua kali untuk satu pekerjaan yang cacat.
  * *Kasus B:* Mekanik A sedang libur, dan pelanggan menuntut perbaikan hari itu juga sehingga dikerjakan oleh Mekanik B. Jika Mekanik B tidak diberi komisi sama sekali, Mekanik B akan merasa dirugikan dan mengerjakan dengan malas-malasan karena menanggung kesalahan orang lain.
* **Akar Masalah:**
  Tidak adanya aturan sistem yang membedakan antara teknisi asal (*primary faulty technician*) dengan teknisi penolong (*substitute technician*).
* **Solusi Rekayasa Sistem (Fair-Allocation Policy):**
  1. **Jika dikerjakan oleh Teknisi Asal:** Sistem otomatis mengunci tarif komisi pengerjaan SPK Garansi sebesar **Rp 0** (kewajiban garansi tanpa bayaran ganda).
  2. **Jika dikerjakan oleh Teknisi Pengganti:** Sistem secara otomatis menerbitkan **Insentif Garansi Bersubsidi** (nominal flat, misal Rp 15.000) yang dibayarkan oleh toko kepada Teknisi Pengganti sebagai penghargaan atas bantuan darurat.
  3. Di modul laporan komisi, tercatat metrik `Total SPK Garansi` per teknisi sebagai indikator penilaian kualitas kerja (*KPI Defect Rate*). Teknisi dengan tingkat cacat kerja tinggi dapat dievaluasi saat evaluasi bulanan.

---

### ⚠️ Tantangan 3: Dampak Pembukuan Finansial & HPP Part Pengganti (Faktur Rp 0 vs Biaya Nyata Persediaan)

* **Problem Lapangan yang Terjadi:**
  Saat klaim garansi membutuhkan penggantian part (misal aki baru atau serum rambut baru), pelanggan tidak boleh ditagih uang (Faktur kasir harus Rp 0). Namun di gudang fisik, barang modal keluar. Jika kasir hanya mengeluarkan barang tanpa transaksi kasir resmi, terjadi selisih stok fisik (*ghost inventory*). Sebaliknya, jika diinput sebagai diskon 100%, omzet kotor toko tampak menggembung semu (*inflated gross revenue*).
* **Akar Masalah:**
  Tidak adanya pemisahan antara transaksi pendapatan kasir (*Cash Sales*) dengan transaksi biaya jaminan mutu (*Quality Assurance Expense*).
* **Solusi Rekayasa Sistem (Automated QA Expense Allocation):**
  1. SPK Garansi tetap diproses di POS dengan grand total pembayaran ke pelanggan sebesar **Rp 0**.
  2. Saat tombol checkout ditekan, sistem backend secara atomic:
     * Memotong stok barang dari batch FIFO terlama di tabel `inventory_batches`.
     * Mengambil nilai HPP modal riil dari batch tersebut.
     * Secara otomatis membuat entri pengeluaran baru pada tabel `expenses` TokoJendral dengan deskripsi: `Beban Klaim Garansi SPK #[Nomor SPK] - [Nama Barang]`.
  3. **Dampak Finansial:** Laporan Laba Rugi toko tetap 100% akurat: Saldo kas tidak terganggu, persediaan stok tetap klop tanpa selisih, dan biaya kerugian akibat garansi tercatat transparan sebagai pengurang laba bersih bulanan.

---

### ⚠️ Tantangan 4: Privasi Rekam Medis & Riwayat Alergi Bahan Kimiawi Salon

* **Problem Lapangan yang Terjadi:**
  Di salon dan klinik kecantikan, seorang pelanggan sering kali memiliki alergi terhadap zat kimia tertentu (misal: zat pewarna PPD atau alkohol tinggi). Jika pelanggan ditangani oleh stylist baru yang tidak tahu riwayatnya, terjadi risiko iritasi kulit kepala serius (*chemical burn*) yang berujung pada tuntutan hukum dan rusaknya reputasi salon.
* **Akar Masalah:**
  Catatan profil pelanggan tersimpan di kartu kertas manual yang sering terselip atau tidak dibaca oleh stylist sebelum pengerjaan.
* **Solusi Rekayasa Sistem (Treatment Profile & Visual Safety Lock):**
  1. Entitas `customer_assets` pada sektor salon menyimpan atribut `allergy_notes` dan `formula_notes`.
  2. Begitu nama pelanggan dipilih di form booking atau SPK dipanggil ke papan antrean, sistem menampilkan **Banner Peringatan Alergi Menyala Merah**:
     `⚠️ PERHATIAN MEDIS: Pelanggan memiliki riwayat alergi zat Amonia. Gunakan formula non-ammonia / herbal!`
  3. Stylist wajib mencentang konfirmasi *"Saya telah membaca catatan alergi pelanggan"* sebelum tombol `Mulai Servis ⚙️` dapat diaktifkan.
  4. Stylist dapat mencatat formula racikan khusus (misal: *Bleaching Level 8 + Tone Ash Grey 50ml*) agar pada kunjungan 2 bulan mendatang, warna rambut dapat dibuat 100% konsisten.

---

### ⚠️ Tantangan 5: Nomor Seri Suku Cadang Bernilai Tinggi & Klaim Retur Vendor (Vendor Claim)

* **Problem Lapangan yang Terjadi:**
  Suku cadang tertentu (seperti Aki Motor, Dinamo Starter, Ban, Mesin Pompa Air) memiliki masa garansi resmi 6 s/d 12 bulan langsung dari pabrik/vendor. Jika aki yang baru dipasang 2 bulan rusak, toko tidak boleh menanggung kerugian sendiri karena aki tersebut dapat ditukarkan ke supplier (*Vendor Warranty Return*). Jika nomor seri (*serial number*) tidak dicatat saat penjualan pertama, supplier akan menolak klaim retur toko.
* **Akar Masalah:**
  Barang bergaransi pabrik diperlakukan sama dengan barang habis pakai umum tanpa pencatatan serial number per unit.
* **Solusi Rekayasa Sistem (Serial Tracking & Supplier Claim Gateway):**
  1. Pada tabel `service_order_items`, tersedia field opsional `serial_number`.
  2. Saat mekanik memasang aki/part bergaransi pabrik, mekanik wajib memindai atau menginput nomor seri yang tertera pada kardus/body barang.
  3. Jika pelanggan mengajukan klaim, sistem mengecek nomor seri tersebut. Jika diverifikasi cacat pabrik, sistem menandai barang sebagai `RETURNED_TO_VENDOR`.
  4. Disediakan menu **Klaim Retur Supplier** di TokoJendral untuk menagih nota kredit (*Credit Note*) atau penggantian unit baru dari vendor grosir.

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Kecepatan & Responsivitas Antarmuka:** Waktu respon pencarian riwayat plat nomor dan validasi dual-limit garansi $< 150\text{ ms}$.
2. **Kemandirian Lokal (Offline-First):** Seluruh riwayat servis dan aturan garansi tersimpan di database SQLite lokal (`better-sqlite3`).
3. **Integritas Transaksi Data:** Pemotongan stok FIFO gratis, pencatatan beban biaya garansi di `expenses`, dan update status klaim dibungkus dalam Knex Database Transaction (`knex.transaction()`).
4. **Audit Trail & Keamanan Role:**
   * Role `cashier` & `technician`: Hanya dapat melihat status garansi dan mendaftarkan keluhan klaim.
   * Role `admin` / `supervisor`: Memiliki kewenangan eksklusif untuk menyetujui (*Approve*) atau menolak (*Reject*) klaim garansi dan melakukan *Manager Override*.

---

## 6. Kriteria Penerimaan & Evaluasi (Acceptance Criteria)

* [ ] Front desk dapat mencari nomor plat kendaraan dalam 1 detik dan melihat seluruh riwayat SPK terdahulu beserta status garansinya.
* [ ] Sistem menolak klaim garansi secara otomatis jika tanggal klaim atau pembacaan odometer melebihi batas kebijakan yang berlaku.
* [ ] SPK Garansi yang disetujui memiliki nilai tagihan kasir Rp 0 tanpa memungut uang dari konsumen.
* [ ] Penggantian suku cadang garansi tetap memotong stok FIFO gudang dan otomatis mencatat biaya HPP modal ke laporan beban operasional (*expenses*).
* [ ] Mekanik asal tidak mendapatkan komisi ganda saat pengerjaan ulang garansi, sedangkan mekanik pengganti mendapatkan insentif subsidi yang adil.
* [ ] Kartu perawatan salon menampilkan peringatan alergi yang wajib dikonfirmasi oleh terapis sebelum tindakan dimulai.
