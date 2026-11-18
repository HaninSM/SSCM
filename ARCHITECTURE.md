# Arsitektur Teknis & Skema Data (ARCHITECTURE.md)
## SSCM — Service Supply Chain Management System

Dokumen ini mendefinisikan arsitektur sistem, skema database relasional (Knex / SQLite), algoritma validasi bisnis, dan arsitektur antarmuka frontend berbasis gaya dan stack **TokoJendral**.

---

## 1. Diagram Arsitektur Tingkat Tinggi (High-Level Architecture)

```
+---------------------------------------------------------------------------------+
|                       FRONTEND: Modular Vanilla JS SPA                          |
|  - public/index.html (Login) & public/pages/dashboard.html                      |
|  - Components: Sidebar.js, Services.js (Booking & Queue Board), POS.js,         |
|                Commissions.js, Reports.js                                       |
|  - Utilities: api.js (Fetch/JWT), format.js (Rupiah & Tanggal)                  |
|  - CSS: style.css (TokoJendral UI System: Dark/Light Card, Modals, Badges)      |
+----------------------------------------+----------------------------------------+
                                         | REST API (JSON + Bearer JWT)
+----------------------------------------v----------------------------------------+
|                          BACKEND: Express.js (v5.x)                             |
|  - Middleware: auth.js, rbac.js, validate.js                                    |
|  - Controllers: ServiceController, BookingController, CommissionController     |
|  - Services:                                                                    |
|    * CollisionEngineService (Overlap checking Fasilitas x Staf x Waktu)         |
|    * ServiceOrderService (Lifecycle SPK: BOOKED -> QUEUED -> IN_PROG -> READY)  |
|    * FIFOInventoryService (Auto deduct batch stok sparepart/oli/serum)          |
|    * CommissionCalculationService (Auto logging komisi per staf)                |
+----------------------------------------+----------------------------------------+
                                         | Knex.js Query Builder
+----------------------------------------v----------------------------------------+
|                      DATABASE: SQLite3 (better-sqlite3)                         |
|  - Tabel Inti TokoJendral: users, items, inventory_batches, transactions        |
|  - Tabel Domain SSCM: service_resources, service_staff, service_orders,         |
|                       service_order_items, commission_logs                      |
+---------------------------------------------------------------------------------+
```

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o| SERVICE_STAFF : links_to
    SERVICE_RESOURCES ||--o{ SERVICE_ORDERS : accommodates
    SERVICE_STAFF ||--o{ SERVICE_ORDERS : executes
    SERVICE_ORDERS ||--o{ SERVICE_ORDER_ITEMS : includes
    ITEMS ||--o{ SERVICE_ORDER_ITEMS : references
    ITEMS ||--o{ INVENTORY_BATCHES : tracks_batches
    SERVICE_ORDERS ||--o| TRANSACTIONS : billed_to
    TRANSACTIONS ||--o{ TRANSACTION_PAYMENTS : paid_via
    SERVICE_ORDERS ||--o{ COMMISSION_LOGS : generates
    SERVICE_STAFF ||--o{ COMMISSION_LOGS : receives

    SERVICE_RESOURCES {
        int id PK
        string code "BAY-01 / CHAIR-02"
        string name "Pit Servis Motor 1 / Kursi Styling 2"
        string business_type "WORKSHOP / SALON"
        string resource_type "BAY / LIFT / CHAIR / BED / ROOM"
        string status "AVAILABLE / OCCUPIED / MAINTENANCE"
        boolean is_active
    }

    SERVICE_STAFF {
        int id PK
        int user_id FK "Nullable: relasi ke users jika punya akses login"
        string staff_code "MEC-01 / THR-02"
        string name "Nama Teknisi / Terapis"
        string business_type "WORKSHOP / SALON"
        string role_title "MEKANIK / STYLIST / TERAPIS"
        decimal default_commission_rate "Persentase komisi jasa (misal: 15.00)"
        decimal flat_incentive_amount "Insentif flat per order (opsional)"
        boolean is_active
    }

    ITEMS {
        int id PK
        string sku
        string name
        string type "PRODUCT / CONSUMABLE / SERVICE"
        decimal price "Tarif Jasa / Harga Jual"
        decimal cost_price "HPP"
        int default_duration_minutes "Durasi standar jika type=SERVICE"
    }

    SERVICE_ORDERS {
        int id PK
        string order_number "SPK-202611-0001"
        string business_type "WORKSHOP / SALON"
        string customer_name
        string customer_phone
        string asset_identifier "No. Plat Kendaraan / Profil Rambut-Kulit"
        datetime scheduled_start "Jadwal Mulai"
        datetime scheduled_end "Jadwal Selesai"
        datetime actual_start
        datetime actual_end
        int resource_id FK "Fasilitas fisik"
        int staff_id FK "Mekanik/Terapis utama"
        string status "BOOKED / QUEUED / IN_PROGRESS / READY_TO_PAY / COMPLETED / CANCELLED"
        text notes "Catatan keluhan / diagnosa awal"
        decimal total_service_amount "Total tarif jasa"
        decimal total_consumable_amount "Total bahan/sparepart"
        decimal grand_total
        int transaction_id FK "Terisi saat sudah dibayar di kasir"
    }

    SERVICE_ORDER_ITEMS {
        int id PK
        int service_order_id FK
        int item_id FK "Bisa Jasa atau Barang Habis Pakai"
        string item_type "SERVICE / CONSUMABLE"
        string item_name
        decimal qty
        decimal unit_price
        decimal subtotal
        int staff_id FK "Pelaksana item ini (bisa delegasi bantuan)"
    }

    COMMISSION_LOGS {
        int id PK
        int service_order_id FK
        int staff_id FK
        int service_order_item_id FK "Item jasa/part yang menghasilkan komisi"
        decimal base_amount "Dasar perhitungan omzet jasa"
        decimal commission_rate "Persen diterapkan"
        decimal commission_amount "Nominal hak komisi bersih"
        string status "PENDING / PAID_OUT"
        datetime paid_at "Waktu pencairan gaji/insentif"
    }

    TRANSACTIONS {
        int id PK
        string invoice_number
        decimal subtotal
        decimal grand_total
        string payment_status "PAID / PARTIAL"
    }

    TRANSACTION_PAYMENTS {
        int id PK
        int transaction_id FK
        string payment_method "CASH / TRANSFER / QRIS"
        decimal amount
    }
```

---

## 3. Spesifikasi Skema & Kamus Data Teknis

### A. Tabel `service_resources` (Fasilitas Fisik)
Menyimpan data stasiun kerja berkapasitas 1 pengerjaan pada satu waktu:
* `id`: INTEGER PRIMARY KEY AUTOINCREMENT
* `code`: VARCHAR(20) UNIQUE NOT NULL (Contoh: `'BAY-01'`, `'BED-SPA-03'`)
* `name`: VARCHAR(100) NOT NULL
* `business_type`: VARCHAR(20) NOT NULL CHECK (`business_type` IN (`'WORKSHOP'`, `'SALON'`))
* `resource_type`: VARCHAR(20) NOT NULL (`'BAY'`, `'LIFT'`, `'CHAIR'`, `'BED'`, `'ROOM'`)
* `status`: VARCHAR(20) DEFAULT `'AVAILABLE'`
* `is_active`: BOOLEAN DEFAULT 1

### B. Tabel `service_staff` (Tenaga Ahli)
Menyimpan profil teknisi atau terapis pelaksana:
* `id`: INTEGER PRIMARY KEY AUTOINCREMENT
* `user_id`: INTEGER NULL REFERENCES `users(id)` ON DELETE SET NULL
* `staff_code`: VARCHAR(20) UNIQUE NOT NULL
* `name`: VARCHAR(100) NOT NULL
* `business_type`: VARCHAR(20) NOT NULL CHECK (`business_type` IN (`'WORKSHOP'`, `'SALON'`))
* `role_title`: VARCHAR(50) NOT NULL (`'MEKANIK'`, `'STYLIST'`, `'TERAPIS'`, `'DOKTER'`)
* `default_commission_rate`: DECIMAL(5,2) DEFAULT 0.00 (Contoh: 15.00 berarti 15%)
* `flat_incentive_amount`: DECIMAL(12,2) DEFAULT 0.00
* `is_active`: BOOLEAN DEFAULT 1

### C. Tabel `service_orders` (SPK & Booking)
Pusat pencatatan siklus pengerjaan layanan:
* `id`: INTEGER PRIMARY KEY AUTOINCREMENT
* `order_number`: VARCHAR(30) UNIQUE NOT NULL (Contoh: `'SPK-202611-0001'`)
* `business_type`: VARCHAR(20) NOT NULL
* `customer_name`: VARCHAR(100) NOT NULL
* `customer_phone`: VARCHAR(30)
* `asset_identifier`: VARCHAR(100) NOT NULL (No. Polisi Kendaraan untuk Bengkel, atau Tipe Perawatan Rambut/Kulit untuk Salon)
* `scheduled_start`: DATETIME NOT NULL
* `scheduled_end`: DATETIME NOT NULL
* `actual_start`: DATETIME NULL
* `actual_end`: DATETIME NULL
* `resource_id`: INTEGER NOT NULL REFERENCES `service_resources(id)`
* `staff_id`: INTEGER NOT NULL REFERENCES `service_staff(id)`
* `status`: VARCHAR(20) DEFAULT `'BOOKED'` CHECK (`status` IN (`'BOOKED'`, `'QUEUED'`, `'IN_PROGRESS'`, `'READY_TO_PAY'`, `'COMPLETED'`, `'CANCELLED'`))
* `notes`: TEXT
* `total_service_amount`: DECIMAL(12,2) DEFAULT 0.00
* `total_consumable_amount`: DECIMAL(12,2) DEFAULT 0.00
* `grand_total`: DECIMAL(12,2) DEFAULT 0.00
* `transaction_id`: INTEGER NULL REFERENCES `transactions(id)`

### D. Tabel `service_order_items`
Rincian item tindakan jasa dan bahan habis pakai:
* `id`: INTEGER PRIMARY KEY AUTOINCREMENT
* `service_order_id`: INTEGER NOT NULL REFERENCES `service_orders(id)` ON DELETE CASCADE
* `item_id`: INTEGER NOT NULL REFERENCES `items(id)`
* `item_type`: VARCHAR(20) NOT NULL CHECK (`item_type` IN (`'SERVICE'`, `'CONSUMABLE'`))
* `item_name`: VARCHAR(150) NOT NULL
* `qty`: DECIMAL(10,2) DEFAULT 1.00
* `unit_price`: DECIMAL(12,2) NOT NULL
* `subtotal`: DECIMAL(12,2) NOT NULL
* `staff_id`: INTEGER NULL REFERENCES `service_staff(id)`

### E. Tabel `commission_logs`
Pencatatan hak insentif dan komisi karyawan:
* `id`: INTEGER PRIMARY KEY AUTOINCREMENT
* `service_order_id`: INTEGER NOT NULL REFERENCES `service_orders(id)`
* `staff_id`: INTEGER NOT NULL REFERENCES `service_staff(id)`
* `service_order_item_id`: INTEGER NULL REFERENCES `service_order_items(id)`
* `base_amount`: DECIMAL(12,2) NOT NULL
* `commission_rate`: DECIMAL(5,2) NOT NULL
* `commission_amount`: DECIMAL(12,2) NOT NULL
* `status`: VARCHAR(20) DEFAULT `'PENDING'` CHECK (`status` IN (`'PENDING'`, `'PAID_OUT'`))
* `paid_at`: DATETIME NULL
* `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

---

## 4. Logika Bisnis & Algoritma Utama

### 4.1. Collision Detection Engine (Anti-Tabrakan Jadwal)
Untuk setiap order baru atau perubahan jadwal dengan rentang $[T_{\text{start}}, T_{\text{end}}]$, backend mengeksekusi validasi bebas bentrok:

```sql
SELECT id, order_number, scheduled_start, scheduled_end 
FROM service_orders 
WHERE status NOT IN ('COMPLETED', 'CANCELLED')
  AND id != :current_order_id
  AND (resource_id = :target_resource_id OR staff_id = :target_staff_id)
  AND (scheduled_start < :target_end AND scheduled_end > :target_start);
```

* **Aturan:** Jika query mengembalikan minimal 1 baris, sistem **menolak** penyimpanan dan mengirim pesan error deskriptif (apakah fasilitas yang bentrok atau staf yang sedang bertugas).

### 4.2. State Machine Siklus Order Servis

```mermaid
stateDiagram-v2
    [*] --> BOOKED : Input Reservasi Baru
    [*] --> QUEUED : Pelanggan Langsung Datang (Walk-In)
    BOOKED --> QUEUED : Pelanggan Tiba di Outlet
    BOOKED --> CANCELLED : Batal Datang
    QUEUED --> IN_PROGRESS : Mekanik/Terapis Mulai Pengerjaan
    IN_PROGRESS --> IN_PROGRESS : Tambah Part/Bahan Habis Pakai (Auto-Check Stok)
    IN_PROGRESS --> READY_TO_PAY : Pengerjaan Fisik Selesai
    READY_TO_PAY --> COMPLETED : Kasir Checkout & Lunas (Split/Multi-Payment)
    READY_TO_PAY --> IN_PROGRESS : Tambahan Servis / Retur Pengerjaan
```

### 4.3. Atomic Checkout & Pemotongan Stok FIFO di Kasir
Saat kasir menekan tombol bayar untuk order servis:
1. **Buka Database Transaction (`knex.transaction`)**:
2. **Rekam Transaksi Penjualan:**
   * Buat baris baru di `transactions`.
   * Simpan detail rincian pembayaran di `transaction_payments` (misal Rp 100.000 Cash + Rp 250.000 QRIS).
3. **Potong Stok FIFO Bahan Habis Pakai:**
   * Ambil setiap baris `service_order_items` yang bertipe `'CONSUMABLE'`.
   * Potong kuantitas dari `inventory_batches` dengan urutan batch terlama (`ORDER BY received_date ASC, id ASC`).
   * Catat snapshot HPP riil pada transaksi kasir.
4. **Hitung & Terbitkan Komisi Karyawan:**
   * Hitung komisi dari tarif jasa pengerjaan:
     $$\text{Komisi} = \text{Tarif Jasa} \times \left(\frac{\text{commission\_rate}}{100}\right)$$
   * Simpan ke tabel `commission_logs` berstatus `'PENDING'`.
5. **Finalisasi Status Order:**
   * Update status `service_orders` menjadi `'COMPLETED'` dan pasang relasi `transaction_id`.
6. **Commit Transaction.**

---

## 5. Arsitektur Antarmuka Pengguna (UI TokoJendral Style)

Frontend mengadopsi struktur komponen modular yang selaras dengan `TokoJendral/public/`:

```
public/js/
├── app.js                      # Router & Active Page State Manager
├── api.js                      # Centralized Fetch Client dengan Auth Token
├── components/
│   ├── Sidebar.js              # Navigasi: Dashboard, Services (SSCM), POS, Commissions, Reports
│   ├── Services.js             # Komponen Utama SSCM:
│   │   ├── Tab Booking & Reservasi (Form Booking + Cek Slot Kosong)
│   │   └── Tab Papan Antrean (Queue Board 4 Kolom: Queued, In Progress, Ready, Done)
│   ├── POS.js                  # Modul Kasir TokoJendral yang di-extend:
│   │   └── Modal "Panggil Antrean Servis" (Load Order SPK ke Cart)
│   └── Commissions.js          # Rekapitulasi Hak Komisi Staf & Tombol Settlement Gaji
└── utils/
    └── format.js               # Formatter IDR (Rupiah), Badges Status, Date-Time
```

---

## 6. Rencana Endpoint REST API

| Method | Endpoint | Fungsi | Akses Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/services/resources` | Daftar fasilitas fisik & ketersediaan | `all` |
| `GET` | `/api/services/staff` | Daftar staf teknisi & terapis aktif | `all` |
| `GET` | `/api/services/orders` | Ambil data antrean & reservasi (filter status/tanggal) | `all` |
| `POST` | `/api/services/orders` | Buat order/booking baru (dengan collision guard) | `cashier`, `admin` |
| `PUT` | `/api/services/orders/:id/status` | Ubah status pengerjaan (`QUEUED` $\to$ `IN_PROGRESS` $\to$ `READY`) | `technician`, `cashier`, `admin` |
| `POST` | `/api/services/orders/:id/items` | Tambah konsumsi sparepart/bahan habis pakai | `technician`, `cashier`, `admin` |
| `GET` | `/api/services/orders/ready-to-pay` | Ambil daftar order siap bayar untuk kasir | `cashier`, `admin` |
| `POST` | `/api/services/orders/:id/checkout` | Eksekusi checkout POS, potong FIFO, dan buat komisi | `cashier`, `admin` |
| `GET` | `/api/commissions` | Laporan rekapitulasi komisi teknisi | `admin`, `owner` |
| `POST` | `/api/commissions/payout` | Pembayaran/settlement komisi staf terpilih | `admin`, `owner` |
