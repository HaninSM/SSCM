const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Clear existing tables in reverse order of FKs
  await knex('warranty_claim_items').del();
  await knex('warranty_claims').del();
  await knex('expenses').del();
  await knex('warranty_policies').del();
  await knex('commission_logs').del();
  await knex('transaction_payments').del();
  await knex('transactions').del();
  await knex('service_order_items').del();
  await knex('service_orders').del();
  await knex('customer_assets').del();
  await knex('inventory_batches').del();
  await knex('items').del();
  await knex('service_staff').del();
  await knex('service_resources').del();
  await knex('users').del();

  // 1. Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const cashierHash = await bcrypt.hash('kasir123', 10);

  const [adminUser, cashierUser] = await knex('users').insert([
    { username: 'admin', password_hash: passwordHash, name: 'Super Admin', role: 'admin' },
    { username: 'kasir', password_hash: cashierHash, name: 'Siti Kasir', role: 'cashier' }
  ]).returning('*');

  // 2. Service Resources
  const resources = await knex('service_resources').insert([
    // Workshop Resources
    { code: 'BAY-01', name: 'Pit Servis Motor 1', business_type: 'WORKSHOP', resource_type: 'BAY', status: 'OCCUPIED' },
    { code: 'BAY-02', name: 'Pit Servis Motor 2', business_type: 'WORKSHOP', resource_type: 'BAY', status: 'AVAILABLE' },
    { code: 'LIFT-01', name: 'Hidrolik Cuci / Carwash 1', business_type: 'WORKSHOP', resource_type: 'LIFT', status: 'AVAILABLE' },
    // Salon Resources
    { code: 'CHR-01', name: 'Kursi Styling & Potong 1', business_type: 'SALON', resource_type: 'CHAIR', status: 'OCCUPIED' },
    { code: 'CHR-02', name: 'Kursi Styling & Potong 2', business_type: 'SALON', resource_type: 'CHAIR', status: 'AVAILABLE' },
    { code: 'BED-01', name: 'Bed Facial & Spa 1', business_type: 'SALON', resource_type: 'BED', status: 'AVAILABLE' }
  ]).returning('*');

  // 3. Service Staff
  const staff = await knex('service_staff').insert([
    // Workshop Staff
    { staff_code: 'MEC-01', name: 'Budi Hartono', business_type: 'WORKSHOP', role_title: 'MEKANIK', default_commission_rate: 20.00, flat_incentive_amount: 5000 },
    { staff_code: 'MEC-02', name: 'Agus Pratama', business_type: 'WORKSHOP', role_title: 'MEKANIK', default_commission_rate: 15.00, flat_incentive_amount: 3000 },
    // Salon Staff
    { staff_code: 'STY-01', name: 'Dewi Lestari', business_type: 'SALON', role_title: 'STYLIST', default_commission_rate: 25.00, flat_incentive_amount: 5000 },
    { staff_code: 'THR-01', name: 'Rina Anggraini', business_type: 'SALON', role_title: 'TERAPIS', default_commission_rate: 20.00, flat_incentive_amount: 5000 }
  ]).returning('*');

  // 4. Items (Services & Consumables)
  const items = await knex('items').insert([
    // Workshop Services
    { sku: 'SRV-W01', name: 'Servis Ringan & Tune Up Injeksi', business_type: 'WORKSHOP', type: 'SERVICE', category: 'Jasa Bengkel', unit: 'JAM', price: 75000, cost_price: 0, duration_minutes: 45, commission_rate: 20, stock: 0 },
    { sku: 'SRV-W02', name: 'Jasa Ganti Oli & Pengecekan Rem', business_type: 'WORKSHOP', type: 'SERVICE', category: 'Jasa Bengkel', unit: 'JAM', price: 25000, cost_price: 0, duration_minutes: 20, commission_rate: 15, stock: 0 },
    { sku: 'SRV-W03', name: 'Cuci Motor Detailing & Semir Ban', business_type: 'WORKSHOP', type: 'SERVICE', category: 'Jasa Cuci', unit: 'JAM', price: 35000, cost_price: 0, duration_minutes: 30, commission_rate: 20, stock: 0 },
    { sku: 'SRV-W04', name: 'Servis CVT & Pembersihan Roller', business_type: 'WORKSHOP', type: 'SERVICE', category: 'Jasa Bengkel', unit: 'JAM', price: 60000, cost_price: 0, duration_minutes: 40, commission_rate: 20, stock: 0 },

    // Workshop Consumables
    { sku: 'PRT-W01', name: 'Oli Mesin Matic 10W-30 0.8L', business_type: 'WORKSHOP', type: 'CONSUMABLE', category: 'Pelumas & Kimia', unit: 'BOTOL', price: 65000, cost_price: 48000, duration_minutes: 0, commission_rate: 0, stock: 50 },
    { sku: 'PRT-W02', name: 'Busi Standar U27EPR9', business_type: 'WORKSHOP', type: 'CONSUMABLE', category: 'Suku Cadang', unit: 'PCS', price: 35000, cost_price: 24000, duration_minutes: 0, commission_rate: 0, stock: 30 },
    { sku: 'PRT-W03', name: 'Kampas Rem Cakram Depan', business_type: 'WORKSHOP', type: 'CONSUMABLE', category: 'Suku Cadang', unit: 'SET', price: 55000, cost_price: 38000, duration_minutes: 0, commission_rate: 0, stock: 25 },
    { sku: 'PRT-W04', name: 'Oli Gardan Matic 120ml', business_type: 'WORKSHOP', type: 'CONSUMABLE', category: 'Pelumas & Kimia', unit: 'BOTOL', price: 18000, cost_price: 12000, duration_minutes: 0, commission_rate: 0, stock: 40 },

    // Salon Services
    { sku: 'SRV-S01', name: 'Haircut Premium & Wash Styling', business_type: 'SALON', type: 'SERVICE', category: 'Jasa Salon', unit: 'JAM', price: 60000, cost_price: 0, duration_minutes: 40, commission_rate: 25, stock: 0 },
    { sku: 'SRV-S02', name: 'Creambath Tradisional + Pijat Leher', business_type: 'SALON', type: 'SERVICE', category: 'Jasa Salon', unit: 'JAM', price: 95000, cost_price: 0, duration_minutes: 60, commission_rate: 20, stock: 0 },
    { sku: 'SRV-S03', name: 'Facial Brightening & Totok Wajah', business_type: 'SALON', type: 'SERVICE', category: 'Jasa Perawatan', unit: 'JAM', price: 150000, cost_price: 0, duration_minutes: 75, commission_rate: 20, stock: 0 },
    { sku: 'SRV-S04', name: 'Hair Spa Keratin & Blow Dry', business_type: 'SALON', type: 'SERVICE', category: 'Jasa Salon', unit: 'JAM', price: 125000, cost_price: 0, duration_minutes: 60, commission_rate: 25, stock: 0 },

    // Salon Consumables
    { sku: 'CSM-S01', name: 'Serum Rambut Argan Oil 10ml', business_type: 'SALON', type: 'CONSUMABLE', category: 'Bahan Salon', unit: 'BOTOL', price: 35000, cost_price: 20000, duration_minutes: 0, commission_rate: 0, stock: 40 },
    { sku: 'CSM-S02', name: 'Krim Masker Creambath Lidah Buaya 250g', business_type: 'SALON', type: 'CONSUMABLE', category: 'Bahan Salon', unit: 'JAR', price: 40000, cost_price: 25000, duration_minutes: 0, commission_rate: 0, stock: 35 },
    { sku: 'CSM-S03', name: 'Ampul Serum Vitamin C Glow', business_type: 'SALON', type: 'CONSUMABLE', category: 'Bahan Estetika', unit: 'AMPUL', price: 50000, cost_price: 32000, duration_minutes: 0, commission_rate: 0, stock: 30 },
    { sku: 'CSM-S04', name: 'Masker Keratin Collagen Infusion', business_type: 'SALON', type: 'CONSUMABLE', category: 'Bahan Salon', unit: 'JAR', price: 45000, cost_price: 28000, duration_minutes: 0, commission_rate: 0, stock: 25 }
  ]).returning('*');

  // Helper mappings
  const itemMap = {};
  items.forEach(i => { itemMap[i.sku] = i; });
  const resMap = {};
  resources.forEach(r => { resMap[r.code] = r; });
  const staffMap = {};
  staff.forEach(s => { staffMap[s.staff_code] = s; });

  // 5. Customer Assets (Kendaraan & Profil Rekam Medis Salon)
  const assets = await knex('customer_assets').insert([
    {
      asset_type: 'VEHICLE',
      identifier: 'B 4128 SZZ',
      customer_name: 'Hendra Gunawan',
      customer_phone: '081234567890',
      brand_model: 'Honda Vario 160 (Hitam Doff)',
      current_odometer: 12450.00,
      last_service_date: new Date().toISOString()
    },
    {
      asset_type: 'BEAUTY_PROFILE',
      identifier: 'CUST-SLN-001',
      customer_name: 'Jessica Melina',
      customer_phone: '085712349988',
      brand_model: 'Rambut Bob Pendek (Kulit Sensitif)',
      allergy_notes: 'PERHATIAN: Riwayat alergi terhadap zat amonia tinggi & sulfur! Gunakan produk organik/herbal.',
      formula_notes: 'Formula Terakhir: Creambath Aloe Vera 150g + 1 Ampul Serum Argan.',
      last_service_date: new Date().toISOString()
    },
    {
      asset_type: 'VEHICLE',
      identifier: 'D 1944 AD',
      customer_name: 'Bambang Sudiro',
      customer_phone: '081399887766',
      brand_model: 'Yamaha NMAX 155 (Biru Metalik)',
      current_odometer: 18200.00,
      last_service_date: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      asset_type: 'VEHICLE',
      identifier: 'B 8899 KLS',
      customer_name: 'Ahmad Fauzi',
      customer_phone: '081288990011',
      brand_model: 'Toyota Avanza 1.5G (Silver)',
      current_odometer: 45200.00,
      last_service_date: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      asset_type: 'VEHICLE',
      identifier: 'B 2341 TYA',
      customer_name: 'Rian Santoso',
      customer_phone: '087811223344',
      brand_model: 'Honda PCX 160 (Putih Mutiara)',
      current_odometer: 8400.00,
      last_service_date: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      asset_type: 'BEAUTY_PROFILE',
      identifier: 'CUST-SLN-002',
      customer_name: 'Clarissa Putri',
      customer_phone: '081900112233',
      brand_model: 'Rambut Panjang Bergelombang',
      allergy_notes: 'Tidak ada alergi kosmetik tercatat. Lebih cocok dengan wewangian floral lavender.',
      formula_notes: 'Treatment Keratin + Creambath.',
      last_service_date: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      asset_type: 'BEAUTY_PROFILE',
      identifier: 'CUST-SLN-003',
      customer_name: 'Nadia Safitri',
      customer_phone: '082199884433',
      brand_model: 'Rambut Lurus Sebahu',
      allergy_notes: 'Alergi ringan terhadap minyak zaitun murni pada kulit kepala.',
      formula_notes: 'Serum Argan 10ml + Masker Lidah Buaya.',
      last_service_date: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      asset_type: 'BEAUTY_PROFILE',
      identifier: 'CUST-SLN-004',
      customer_name: 'Siti Nurhaliza',
      customer_phone: '081255667788',
      brand_model: 'Kulit Wajah Kering & Kusam',
      allergy_notes: 'Kulit sensitif terhadap scrub butiran kasar. Gunakan enzim peeling lembut.',
      formula_notes: 'Facial Brightening Vit C Glow + Totok Wajah.',
      last_service_date: new Date(Date.now() - 3 * 86400000).toISOString()
    }
  ]).returning('*');

  const assetMap = {};
  assets.forEach(a => { assetMap[a.identifier] = a; });

  // 6. Warranty Policies
  await knex('warranty_policies').insert([
    { item_id: itemMap['SRV-W01'].id, policy_name: 'Garansi Servis Ringan & Tune-Up 14 Hari', warranty_days: 14, warranty_km: 1000.00, claim_action: 'FREE_REWORK' },
    { item_id: itemMap['SRV-W02'].id, policy_name: 'Garansi Ganti Oli & Rem 7 Hari', warranty_days: 7, warranty_km: 500.00, claim_action: 'FREE_REWORK' },
    { item_id: itemMap['SRV-S01'].id, policy_name: 'Garansi Revisi Potong Rambut 3 Hari', warranty_days: 3, warranty_km: 0.00, claim_action: 'FREE_REWORK' },
    { item_id: itemMap['SRV-S02'].id, policy_name: 'Garansi Retouch Rambut & Treatment 7 Hari', warranty_days: 7, warranty_km: 0.00, claim_action: 'FREE_REWORK' },
    { item_id: itemMap['PRT-W03'].id, policy_name: 'Garansi Suku Cadang Kampas Rem 30 Hari', warranty_days: 30, warranty_km: 2000.00, claim_action: 'PART_REPLACEMENT' }
  ]);

  // 7. Inventory Batches (FIFO Batches with Ample Quantities)
  await knex('inventory_batches').insert([
    { item_id: itemMap['PRT-W01'].id, batch_number: 'BATCH-OLI-202611-01', initial_quantity: 25, remaining_quantity: 25, cost_per_unit: 47000, received_date: '2026-11-01' },
    { item_id: itemMap['PRT-W01'].id, batch_number: 'BATCH-OLI-202611-02', initial_quantity: 25, remaining_quantity: 25, cost_per_unit: 49000, received_date: '2026-11-10' },
    { item_id: itemMap['PRT-W02'].id, batch_number: 'BATCH-BUSI-01', initial_quantity: 30, remaining_quantity: 30, cost_per_unit: 24000, received_date: '2026-11-05' },
    { item_id: itemMap['PRT-W03'].id, batch_number: 'BATCH-REM-01', initial_quantity: 25, remaining_quantity: 25, cost_per_unit: 38000, received_date: '2026-11-05' },
    { item_id: itemMap['PRT-W04'].id, batch_number: 'BATCH-GRD-01', initial_quantity: 40, remaining_quantity: 40, cost_per_unit: 12000, received_date: '2026-11-06' },
    { item_id: itemMap['CSM-S01'].id, batch_number: 'BATCH-SRM-01', initial_quantity: 40, remaining_quantity: 40, cost_per_unit: 20000, received_date: '2026-11-02' },
    { item_id: itemMap['CSM-S02'].id, batch_number: 'BATCH-CRM-01', initial_quantity: 35, remaining_quantity: 35, cost_per_unit: 25000, received_date: '2026-11-04' },
    { item_id: itemMap['CSM-S03'].id, batch_number: 'BATCH-AMP-01', initial_quantity: 30, remaining_quantity: 30, cost_per_unit: 32000, received_date: '2026-11-08' },
    { item_id: itemMap['CSM-S04'].id, batch_number: 'BATCH-KRT-01', initial_quantity: 25, remaining_quantity: 25, cost_per_unit: 28000, received_date: '2026-11-08' }
  ]);

  const now = new Date();

  // Helper date offset generator
  const getOffsetDate = (daysAgo, hoursAgo = 0) => {
    return new Date(now.getTime() - (daysAgo * 86400000) - (hoursAgo * 3600000)).toISOString();
  };

  // =========================================================================
  // 8. SEED COMPLETED ORDERS + INVOICE TRANSACTIONS + COMMISSIONS (OMZET & PAYROLL)
  // =========================================================================

  // --- COMPLETED ORDER 1: Workshop - Budi Hartono (MEC-01) ---
  // Servis Tune-up + Ganti Oli + Busi = Rp 175.000 (Jasa Rp 75.000, Part Rp 100.000)
  const [co1] = await knex('service_orders').insert({
    order_number: 'SPK-W202611-101',
    business_type: 'WORKSHOP',
    customer_name: 'Ahmad Fauzi',
    customer_phone: '081288990011',
    asset_identifier: 'B 8899 KLS (Toyota Avanza)',
    customer_asset_id: assetMap['B 8899 KLS'].id,
    odometer_km: 45200.00,
    warranty_exp_date: new Date(now.getTime() + 13 * 86400000).toISOString(),
    warranty_exp_km: 46200.00,
    scheduled_start: getOffsetDate(1, 4),
    scheduled_end: getOffsetDate(1, 3),
    actual_start: getOffsetDate(1, 4),
    actual_end: getOffsetDate(1, 3),
    resource_id: resMap['BAY-01'].id,
    staff_id: staffMap['MEC-01'].id,
    status: 'COMPLETED',
    notes: 'Servis tune up mesin, ganti oli mesin dan busi baru.',
    total_service_amount: 75000,
    total_consumable_amount: 100000,
    grand_total: 175000
  }).returning('*');

  const [co1_item1] = await knex('service_order_items').insert([
    { service_order_id: co1.id, item_id: itemMap['SRV-W01'].id, item_type: 'SERVICE', item_name: 'Servis Ringan & Tune Up Injeksi', qty: 1, unit_price: 75000, subtotal: 75000, staff_id: staffMap['MEC-01'].id },
    { service_order_id: co1.id, item_id: itemMap['PRT-W01'].id, item_type: 'CONSUMABLE', item_name: 'Oli Mesin Matic 10W-30 0.8L', qty: 1, unit_price: 65000, subtotal: 65000, staff_id: staffMap['MEC-01'].id },
    { service_order_id: co1.id, item_id: itemMap['PRT-W02'].id, item_type: 'CONSUMABLE', item_name: 'Busi Standar U27EPR9', qty: 1, unit_price: 35000, subtotal: 35000, staff_id: staffMap['MEC-01'].id }
  ]).returning('*');

  // Invoice 1: Split Payment (Cash + QRIS)
  const [t1] = await knex('transactions').insert({
    invoice_number: 'INV-202611-0001',
    service_order_id: co1.id,
    customer_name: 'Ahmad Fauzi',
    subtotal: 175000,
    discount: 0,
    tax: 0,
    grand_total: 175000,
    total_paid: 175000,
    change_amount: 0,
    payment_status: 'PAID',
    cashier_id: cashierUser.id,
    created_at: getOffsetDate(1, 3)
  }).returning('*');

  await knex('transaction_payments').insert([
    { transaction_id: t1.id, payment_method: 'CASH', amount: 75000, created_at: getOffsetDate(1, 3) },
    { transaction_id: t1.id, payment_method: 'QRIS', amount: 100000, reference_number: 'QRIS-GOPAY-88219', created_at: getOffsetDate(1, 3) }
  ]);
  await knex('service_orders').where({ id: co1.id }).update({ transaction_id: t1.id });

  // Commission 1: Budi Hartono (20% of 75.000 + 5.000 flat = Rp 20.000)
  await knex('commission_logs').insert({
    service_order_id: co1.id,
    staff_id: staffMap['MEC-01'].id,
    service_order_item_id: co1_item1.id,
    base_amount: 75000,
    commission_rate: 20.00,
    commission_amount: 20000, // (75000 * 20%) + 5000
    status: 'PENDING',
    created_at: getOffsetDate(1, 3)
  });

  // --- COMPLETED ORDER 2: Workshop - Budi Hartono (MEC-01) ---
  // Servis CVT + Ganti Oli & Rem = Rp 175.000 (Jasa Rp 85.000, Part Rp 90.000)
  const [co2] = await knex('service_orders').insert({
    order_number: 'SPK-W202611-102',
    business_type: 'WORKSHOP',
    customer_name: 'Rian Santoso',
    customer_phone: '087811223344',
    asset_identifier: 'B 2341 TYA (Honda PCX 160)',
    customer_asset_id: assetMap['B 2341 TYA'].id,
    odometer_km: 8400.00,
    warranty_exp_date: new Date(now.getTime() + 12 * 86400000).toISOString(),
    warranty_exp_km: 9400.00,
    scheduled_start: getOffsetDate(2, 5),
    scheduled_end: getOffsetDate(2, 4),
    actual_start: getOffsetDate(2, 5),
    actual_end: getOffsetDate(2, 4),
    resource_id: resMap['BAY-01'].id,
    staff_id: staffMap['MEC-01'].id,
    status: 'COMPLETED',
    notes: 'Servis CVT gredek, ganti oli mesin dan oli gardan.',
    total_service_amount: 85000,
    total_consumable_amount: 83000,
    grand_total: 168000
  }).returning('*');

  const [co2_item1] = await knex('service_order_items').insert([
    { service_order_id: co2.id, item_id: itemMap['SRV-W04'].id, item_type: 'SERVICE', item_name: 'Servis CVT & Pembersihan Roller', qty: 1, unit_price: 60000, subtotal: 60000, staff_id: staffMap['MEC-01'].id },
    { service_order_id: co2.id, item_id: itemMap['SRV-W02'].id, item_type: 'SERVICE', item_name: 'Jasa Ganti Oli & Pengecekan Rem', qty: 1, unit_price: 25000, subtotal: 25000, staff_id: staffMap['MEC-01'].id },
    { service_order_id: co2.id, item_id: itemMap['PRT-W01'].id, item_type: 'CONSUMABLE', item_name: 'Oli Mesin Matic 10W-30 0.8L', qty: 1, unit_price: 65000, subtotal: 65000, staff_id: staffMap['MEC-01'].id },
    { service_order_id: co2.id, item_id: itemMap['PRT-W04'].id, item_type: 'CONSUMABLE', item_name: 'Oli Gardan Matic 120ml', qty: 1, unit_price: 18000, subtotal: 18000, staff_id: staffMap['MEC-01'].id }
  ]).returning('*');

  const [t2] = await knex('transactions').insert({
    invoice_number: 'INV-202611-0002',
    service_order_id: co2.id,
    customer_name: 'Rian Santoso',
    subtotal: 168000,
    discount: 0,
    tax: 0,
    grand_total: 168000,
    total_paid: 170000,
    change_amount: 2000,
    payment_status: 'PAID',
    cashier_id: cashierUser.id,
    created_at: getOffsetDate(2, 4)
  }).returning('*');

  await knex('transaction_payments').insert([
    { transaction_id: t2.id, payment_method: 'CASH', amount: 170000, created_at: getOffsetDate(2, 4) }
  ]);
  await knex('service_orders').where({ id: co2.id }).update({ transaction_id: t2.id });

  // Commission 2: Budi Hartono (20% of 60.000 + 5.000 flat + 15% of 25.000 = Rp 20.750)
  await knex('commission_logs').insert({
    service_order_id: co2.id,
    staff_id: staffMap['MEC-01'].id,
    service_order_item_id: co2_item1.id,
    base_amount: 85000,
    commission_rate: 20.00,
    commission_amount: 22000, // Rp 22.000
    status: 'PENDING',
    created_at: getOffsetDate(2, 4)
  });

  // --- COMPLETED ORDER 3: Workshop - Agus Pratama (MEC-02) ---
  // Ganti Kampas Rem + Servis Ringan = Rp 130.000
  const [co3] = await knex('service_orders').insert({
    order_number: 'SPK-W202611-000',
    business_type: 'WORKSHOP',
    customer_name: 'Bambang Sudiro',
    customer_phone: '081399887766',
    asset_identifier: 'D 1944 AD (Yamaha NMAX)',
    customer_asset_id: assetMap['D 1944 AD'].id,
    odometer_km: 18200.00,
    warranty_exp_date: new Date(now.getTime() + 11 * 86400000).toISOString(),
    warranty_exp_km: 19200.00,
    scheduled_start: getOffsetDate(3, 3),
    scheduled_end: getOffsetDate(3, 2),
    actual_start: getOffsetDate(3, 3),
    actual_end: getOffsetDate(3, 2),
    resource_id: resMap['BAY-02'].id,
    staff_id: staffMap['MEC-02'].id,
    status: 'COMPLETED',
    notes: 'Ganti kampas rem cakram depan dan servis berkala.',
    total_service_amount: 75000,
    total_consumable_amount: 55000,
    grand_total: 130000
  }).returning('*');

  const [co3_item1] = await knex('service_order_items').insert([
    { service_order_id: co3.id, item_id: itemMap['SRV-W01'].id, item_type: 'SERVICE', item_name: 'Servis Ringan & Tune Up Injeksi', qty: 1, unit_price: 75000, subtotal: 75000, staff_id: staffMap['MEC-02'].id },
    { service_order_id: co3.id, item_id: itemMap['PRT-W03'].id, item_type: 'CONSUMABLE', item_name: 'Kampas Rem Cakram Depan', qty: 1, unit_price: 55000, subtotal: 55000, staff_id: staffMap['MEC-02'].id }
  ]).returning('*');

  const [t3] = await knex('transactions').insert({
    invoice_number: 'INV-202611-0003',
    service_order_id: co3.id,
    customer_name: 'Bambang Sudiro',
    subtotal: 130000,
    discount: 0,
    tax: 0,
    grand_total: 130000,
    total_paid: 130000,
    change_amount: 0,
    payment_status: 'PAID',
    cashier_id: cashierUser.id,
    created_at: getOffsetDate(3, 2)
  }).returning('*');

  await knex('transaction_payments').insert([
    { transaction_id: t3.id, payment_method: 'TRANSFER', amount: 130000, reference_number: 'BCA-TRF-90211', created_at: getOffsetDate(3, 2) }
  ]);
  await knex('service_orders').where({ id: co3.id }).update({ transaction_id: t3.id });

  // Commission 3: Agus Pratama (15% of 75.000 + 3.000 flat = Rp 14.250)
  await knex('commission_logs').insert({
    service_order_id: co3.id,
    staff_id: staffMap['MEC-02'].id,
    service_order_item_id: co3_item1.id,
    base_amount: 75000,
    commission_rate: 15.00,
    commission_amount: 14250,
    status: 'PENDING',
    created_at: getOffsetDate(3, 2)
  });

  // --- COMPLETED ORDER 4: Workshop - Agus Pratama (MEC-02) ---
  // Jasa Ganti Oli + Cuci Motor Detailing = Rp 60.000 Jasa, Rp 65.000 Part = Rp 125.000
  const [co4] = await knex('service_orders').insert({
    order_number: 'SPK-W202611-104',
    business_type: 'WORKSHOP',
    customer_name: 'Hendra Gunawan',
    customer_phone: '081234567890',
    asset_identifier: 'B 4128 SZZ (Honda Vario 160)',
    customer_asset_id: assetMap['B 4128 SZZ'].id,
    odometer_km: 12400.00,
    warranty_exp_date: new Date(now.getTime() + 6 * 86400000).toISOString(),
    warranty_exp_km: 12900.00,
    scheduled_start: getOffsetDate(4, 3),
    scheduled_end: getOffsetDate(4, 2),
    actual_start: getOffsetDate(4, 3),
    actual_end: getOffsetDate(4, 2),
    resource_id: resMap['LIFT-01'].id,
    staff_id: staffMap['MEC-02'].id,
    status: 'COMPLETED',
    notes: 'Ganti oli rutin dan cuci motor detailing semir ban.',
    total_service_amount: 60000,
    total_consumable_amount: 65000,
    grand_total: 125000
  }).returning('*');

  const [co4_item1] = await knex('service_order_items').insert([
    { service_order_id: co4.id, item_id: itemMap['SRV-W02'].id, item_type: 'SERVICE', item_name: 'Jasa Ganti Oli & Pengecekan Rem', qty: 1, unit_price: 25000, subtotal: 25000, staff_id: staffMap['MEC-02'].id },
    { service_order_id: co4.id, item_id: itemMap['SRV-W03'].id, item_type: 'SERVICE', item_name: 'Cuci Motor Detailing & Semir Ban', qty: 1, unit_price: 35000, subtotal: 35000, staff_id: staffMap['MEC-02'].id },
    { service_order_id: co4.id, item_id: itemMap['PRT-W01'].id, item_type: 'CONSUMABLE', item_name: 'Oli Mesin Matic 10W-30 0.8L', qty: 1, unit_price: 65000, subtotal: 65000, staff_id: staffMap['MEC-02'].id }
  ]).returning('*');

  const [t4] = await knex('transactions').insert({
    invoice_number: 'INV-202611-0004',
    service_order_id: co4.id,
    customer_name: 'Hendra Gunawan',
    subtotal: 125000,
    discount: 0,
    tax: 0,
    grand_total: 125000,
    total_paid: 125000,
    change_amount: 0,
    payment_status: 'PAID',
    cashier_id: cashierUser.id,
    created_at: getOffsetDate(4, 2)
  }).returning('*');

  await knex('transaction_payments').insert([
    { transaction_id: t4.id, payment_method: 'QRIS', amount: 125000, reference_number: 'QRIS-SHOPEE-44102', created_at: getOffsetDate(4, 2) }
  ]);
  await knex('service_orders').where({ id: co4.id }).update({ transaction_id: t4.id });

  // Commission 4: Agus Pratama (15% of 60.000 + 3.000 flat = Rp 12.000)
  await knex('commission_logs').insert({
    service_order_id: co4.id,
    staff_id: staffMap['MEC-02'].id,
    service_order_item_id: co4_item1.id,
    base_amount: 60000,
    commission_rate: 15.00,
    commission_amount: 12000,
    status: 'PENDING',
    created_at: getOffsetDate(4, 2)
  });

  // --- COMPLETED ORDER 5: Salon - Dewi Lestari (STY-01) ---
  // Haircut + Hair Spa Keratin + Serum = Rp 220.000 (Jasa Rp 185.000, Part Rp 35.000)
  const [co5] = await knex('service_orders').insert({
    order_number: 'SPK-S202611-105',
    business_type: 'SALON',
    customer_name: 'Clarissa Putri',
    customer_phone: '081900112233',
    asset_identifier: 'CUST-SLN-002 (Clarissa Putri)',
    customer_asset_id: assetMap['CUST-SLN-002'].id,
    warranty_exp_date: new Date(now.getTime() + 6 * 86400000).toISOString(),
    scheduled_start: getOffsetDate(1, 6),
    scheduled_end: getOffsetDate(1, 5),
    actual_start: getOffsetDate(1, 6),
    actual_end: getOffsetDate(1, 5),
    resource_id: resMap['CHR-01'].id,
    staff_id: staffMap['STY-01'].id,
    status: 'COMPLETED',
    notes: 'Potong model layer dan perawatan keratin blow dry.',
    total_service_amount: 185000,
    total_consumable_amount: 35000,
    grand_total: 220000
  }).returning('*');

  const [co5_item1] = await knex('service_order_items').insert([
    { service_order_id: co5.id, item_id: itemMap['SRV-S01'].id, item_type: 'SERVICE', item_name: 'Haircut Premium & Wash Styling', qty: 1, unit_price: 60000, subtotal: 60000, staff_id: staffMap['STY-01'].id },
    { service_order_id: co5.id, item_id: itemMap['SRV-S04'].id, item_type: 'SERVICE', item_name: 'Hair Spa Keratin & Blow Dry', qty: 1, unit_price: 125000, subtotal: 125000, staff_id: staffMap['STY-01'].id },
    { service_order_id: co5.id, item_id: itemMap['CSM-S01'].id, item_type: 'CONSUMABLE', item_name: 'Serum Rambut Argan Oil 10ml', qty: 1, unit_price: 35000, subtotal: 35000, staff_id: staffMap['STY-01'].id }
  ]).returning('*');

  const [t5] = await knex('transactions').insert({
    invoice_number: 'INV-202611-0005',
    service_order_id: co5.id,
    customer_name: 'Clarissa Putri',
    subtotal: 220000,
    discount: 0,
    tax: 0,
    grand_total: 220000,
    total_paid: 220000,
    change_amount: 0,
    payment_status: 'PAID',
    cashier_id: cashierUser.id,
    created_at: getOffsetDate(1, 5)
  }).returning('*');

  await knex('transaction_payments').insert([
    { transaction_id: t5.id, payment_method: 'TRANSFER', amount: 220000, reference_number: 'MANDIRI-883391', created_at: getOffsetDate(1, 5) }
  ]);
  await knex('service_orders').where({ id: co5.id }).update({ transaction_id: t5.id });

  // Commission 5: Dewi Lestari (25% of 185.000 + 5.000 flat = Rp 51.250)
  await knex('commission_logs').insert({
    service_order_id: co5.id,
    staff_id: staffMap['STY-01'].id,
    service_order_item_id: co5_item1.id,
    base_amount: 185000,
    commission_rate: 25.00,
    commission_amount: 51250,
    status: 'PENDING',
    created_at: getOffsetDate(1, 5)
  });

  // --- COMPLETED ORDER 6: Salon - Dewi Lestari (STY-01) ---
  // Haircut Saja = Rp 60.000
  const [co6] = await knex('service_orders').insert({
    order_number: 'SPK-S202611-106',
    business_type: 'SALON',
    customer_name: 'Nadia Safitri',
    customer_phone: '082199884433',
    asset_identifier: 'CUST-SLN-003 (Nadia Safitri)',
    customer_asset_id: assetMap['CUST-SLN-003'].id,
    warranty_exp_date: new Date(now.getTime() + 2 * 86400000).toISOString(),
    scheduled_start: getOffsetDate(2, 3),
    scheduled_end: getOffsetDate(2, 2),
    actual_start: getOffsetDate(2, 3),
    actual_end: getOffsetDate(2, 2),
    resource_id: resMap['CHR-02'].id,
    staff_id: staffMap['STY-01'].id,
    status: 'COMPLETED',
    notes: 'Potong poni dan rapikan ujung rambut bercabang.',
    total_service_amount: 60000,
    total_consumable_amount: 0,
    grand_total: 60000
  }).returning('*');

  const [co6_item1] = await knex('service_order_items').insert([
    { service_order_id: co6.id, item_id: itemMap['SRV-S01'].id, item_type: 'SERVICE', item_name: 'Haircut Premium & Wash Styling', qty: 1, unit_price: 60000, subtotal: 60000, staff_id: staffMap['STY-01'].id }
  ]).returning('*');

  const [t6] = await knex('transactions').insert({
    invoice_number: 'INV-202611-0006',
    service_order_id: co6.id,
    customer_name: 'Nadia Safitri',
    subtotal: 60000,
    discount: 0,
    tax: 0,
    grand_total: 60000,
    total_paid: 100000,
    change_amount: 40000,
    payment_status: 'PAID',
    cashier_id: cashierUser.id,
    created_at: getOffsetDate(2, 2)
  }).returning('*');

  await knex('transaction_payments').insert([
    { transaction_id: t6.id, payment_method: 'CASH', amount: 100000, created_at: getOffsetDate(2, 2) }
  ]);
  await knex('service_orders').where({ id: co6.id }).update({ transaction_id: t6.id });

  // Commission 6: Dewi Lestari (25% of 60.000 + 5.000 flat = Rp 20.000)
  await knex('commission_logs').insert({
    service_order_id: co6.id,
    staff_id: staffMap['STY-01'].id,
    service_order_item_id: co6_item1.id,
    base_amount: 60000,
    commission_rate: 25.00,
    commission_amount: 20000,
    status: 'PENDING',
    created_at: getOffsetDate(2, 2)
  });

  // --- COMPLETED ORDER 7: Salon - Rina Anggraini (THR-01) ---
  // Facial Brightening + Vit C Glow = Rp 200.000 (Jasa Rp 150.000, Part Rp 50.000)
  const [co7] = await knex('service_orders').insert({
    order_number: 'SPK-S202611-107',
    business_type: 'SALON',
    customer_name: 'Siti Nurhaliza',
    customer_phone: '081255667788',
    asset_identifier: 'CUST-SLN-004 (Siti Nurhaliza)',
    customer_asset_id: assetMap['CUST-SLN-004'].id,
    warranty_exp_date: new Date(now.getTime() + 5 * 86400000).toISOString(),
    scheduled_start: getOffsetDate(3, 4),
    scheduled_end: getOffsetDate(3, 3),
    actual_start: getOffsetDate(3, 4),
    actual_end: getOffsetDate(3, 3),
    resource_id: resMap['BED-01'].id,
    staff_id: staffMap['THR-01'].id,
    status: 'COMPLETED',
    notes: 'Perawatan facial wajah kusam, ekstraksi komedo halus & serum glowing.',
    total_service_amount: 150000,
    total_consumable_amount: 50000,
    grand_total: 200000
  }).returning('*');

  const [co7_item1] = await knex('service_order_items').insert([
    { service_order_id: co7.id, item_id: itemMap['SRV-S03'].id, item_type: 'SERVICE', item_name: 'Facial Brightening & Totok Wajah', qty: 1, unit_price: 150000, subtotal: 150000, staff_id: staffMap['THR-01'].id },
    { service_order_id: co7.id, item_id: itemMap['CSM-S03'].id, item_type: 'CONSUMABLE', item_name: 'Ampul Serum Vitamin C Glow', qty: 1, unit_price: 50000, subtotal: 50000, staff_id: staffMap['THR-01'].id }
  ]).returning('*');

  const [t7] = await knex('transactions').insert({
    invoice_number: 'INV-202611-0007',
    service_order_id: co7.id,
    customer_name: 'Siti Nurhaliza',
    subtotal: 200000,
    discount: 0,
    tax: 0,
    grand_total: 200000,
    total_paid: 200000,
    change_amount: 0,
    payment_status: 'PAID',
    cashier_id: cashierUser.id,
    created_at: getOffsetDate(3, 3)
  }).returning('*');

  await knex('transaction_payments').insert([
    { transaction_id: t7.id, payment_method: 'QRIS', amount: 200000, reference_number: 'QRIS-BCA-55198', created_at: getOffsetDate(3, 3) }
  ]);
  await knex('service_orders').where({ id: co7.id }).update({ transaction_id: t7.id });

  // Commission 7: Rina Anggraini (20% of 150.000 + 5.000 flat = Rp 35.000)
  await knex('commission_logs').insert({
    service_order_id: co7.id,
    staff_id: staffMap['THR-01'].id,
    service_order_item_id: co7_item1.id,
    base_amount: 150000,
    commission_rate: 20.00,
    commission_amount: 35000,
    status: 'PENDING',
    created_at: getOffsetDate(3, 3)
  });

  // --- HISTORICAL PAID OUT COMMISSION (Order 8 minggu lalu) ---
  // To demonstrate both PAID_OUT and PENDING in reports
  const [co8] = await knex('service_orders').insert({
    order_number: 'SPK-S202611-100',
    business_type: 'SALON',
    customer_name: 'Jessica Melina',
    customer_phone: '085712349988',
    asset_identifier: 'CUST-SLN-001 (Jessica Melina)',
    customer_asset_id: assetMap['CUST-SLN-001'].id,
    warranty_exp_date: getOffsetDate(1),
    scheduled_start: getOffsetDate(8, 4),
    scheduled_end: getOffsetDate(8, 3),
    actual_start: getOffsetDate(8, 4),
    actual_end: getOffsetDate(8, 3),
    resource_id: resMap['CHR-01'].id,
    staff_id: staffMap['STY-01'].id,
    status: 'COMPLETED',
    notes: 'Creambath perawatan rutin minggu lalu.',
    total_service_amount: 95000,
    total_consumable_amount: 40000,
    grand_total: 135000
  }).returning('*');

  const [co8_item1] = await knex('service_order_items').insert([
    { service_order_id: co8.id, item_id: itemMap['SRV-S02'].id, item_type: 'SERVICE', item_name: 'Creambath Tradisional + Pijat Leher', qty: 1, unit_price: 95000, subtotal: 95000, staff_id: staffMap['STY-01'].id },
    { service_order_id: co8.id, item_id: itemMap['CSM-S02'].id, item_type: 'CONSUMABLE', item_name: 'Krim Masker Creambath Lidah Buaya 250g', qty: 1, unit_price: 40000, subtotal: 40000, staff_id: staffMap['STY-01'].id }
  ]).returning('*');

  const [t8] = await knex('transactions').insert({
    invoice_number: 'INV-202611-0000',
    service_order_id: co8.id,
    customer_name: 'Jessica Melina',
    subtotal: 135000,
    discount: 0,
    tax: 0,
    grand_total: 135000,
    total_paid: 135000,
    change_amount: 0,
    payment_status: 'PAID',
    cashier_id: cashierUser.id,
    created_at: getOffsetDate(8, 3)
  }).returning('*');

  await knex('transaction_payments').insert([
    { transaction_id: t8.id, payment_method: 'CASH', amount: 135000, created_at: getOffsetDate(8, 3) }
  ]);
  await knex('service_orders').where({ id: co8.id }).update({ transaction_id: t8.id });

  // Commission 8: Dewi Lestari - PAID OUT
  await knex('commission_logs').insert({
    service_order_id: co8.id,
    staff_id: staffMap['STY-01'].id,
    service_order_item_id: co8_item1.id,
    base_amount: 95000,
    commission_rate: 20.00,
    commission_amount: 24000,
    status: 'PAID_OUT',
    paid_at: getOffsetDate(5),
    created_at: getOffsetDate(8, 3)
  });

  // =========================================================================
  // 9. SEED ACTIVE SERVICE ORDERS (KANBAN QUEUE BOARD)
  // =========================================================================

  // Order Active 1: Workshop - IN_PROGRESS
  const start1 = new Date(now.getTime() - 25 * 60000).toISOString();
  const end1 = new Date(now.getTime() + 25 * 60000).toISOString();
  const expDate14 = new Date(now.getTime() + 14 * 86400000).toISOString();

  const [orderActive1] = await knex('service_orders').insert({
    order_number: 'SPK-W202611-001',
    business_type: 'WORKSHOP',
    customer_name: 'Hendra Gunawan',
    customer_phone: '081234567890',
    asset_identifier: 'B 4128 SZZ (Honda Vario 160)',
    customer_asset_id: assetMap['B 4128 SZZ'].id,
    odometer_km: 12450.00,
    warranty_exp_date: expDate14,
    warranty_exp_km: 13450.00,
    scheduled_start: start1,
    scheduled_end: end1,
    actual_start: start1,
    resource_id: resMap['BAY-01'].id,
    staff_id: staffMap['MEC-01'].id,
    status: 'IN_PROGRESS',
    notes: 'Tarikan motor brebet pada rpm rendah, ganti oli dan cek busi',
    total_service_amount: 75000,
    total_consumable_amount: 65000,
    grand_total: 140000
  }).returning('*');

  await knex('service_order_items').insert([
    { service_order_id: orderActive1.id, item_id: itemMap['SRV-W01'].id, item_type: 'SERVICE', item_name: 'Servis Ringan & Tune Up Injeksi', qty: 1, unit_price: 75000, subtotal: 75000, staff_id: staffMap['MEC-01'].id },
    { service_order_id: orderActive1.id, item_id: itemMap['PRT-W01'].id, item_type: 'CONSUMABLE', item_name: 'Oli Mesin Matic 10W-30 0.8L', qty: 1, unit_price: 65000, subtotal: 65000, staff_id: staffMap['MEC-01'].id }
  ]);

  // Order Active 2: Salon - READY_TO_PAY (with Allergy Note verified)
  const expDate7 = new Date(now.getTime() + 7 * 86400000).toISOString();
  const [orderActive2] = await knex('service_orders').insert({
    order_number: 'SPK-S202611-002',
    business_type: 'SALON',
    customer_name: 'Jessica Melina',
    customer_phone: '085712349988',
    asset_identifier: 'CUST-SLN-001 (Rambut Bob Pendek)',
    customer_asset_id: assetMap['CUST-SLN-001'].id,
    warranty_exp_date: expDate7,
    scheduled_start: start1,
    scheduled_end: end1,
    actual_start: start1,
    actual_end: now.toISOString(),
    resource_id: resMap['CHR-01'].id,
    staff_id: staffMap['STY-01'].id,
    status: 'READY_TO_PAY',
    notes: 'Creambath + Serum Argan. Terkonfirmasi bebas bahan amonia.',
    total_service_amount: 155000,
    total_consumable_amount: 75000,
    grand_total: 230000
  }).returning('*');

  await knex('service_order_items').insert([
    { service_order_id: orderActive2.id, item_id: itemMap['SRV-S01'].id, item_type: 'SERVICE', item_name: 'Haircut Premium & Wash Styling', qty: 1, unit_price: 60000, subtotal: 60000, staff_id: staffMap['STY-01'].id },
    { service_order_id: orderActive2.id, item_id: itemMap['SRV-S02'].id, item_type: 'SERVICE', item_name: 'Creambath Tradisional + Pijat Leher', qty: 1, unit_price: 95000, subtotal: 95000, staff_id: staffMap['STY-01'].id },
    { service_order_id: orderActive2.id, item_id: itemMap['CSM-S01'].id, item_type: 'CONSUMABLE', item_name: 'Serum Rambut Argan Oil 10ml', qty: 1, unit_price: 35000, subtotal: 35000, staff_id: staffMap['STY-01'].id },
    { service_order_id: orderActive2.id, item_id: itemMap['CSM-S02'].id, item_type: 'CONSUMABLE', item_name: 'Krim Masker Creambath Lidah Buaya 250g', qty: 1, unit_price: 40000, subtotal: 40000, staff_id: staffMap['STY-01'].id }
  ]);

  // Order Active 3: Workshop - QUEUED (Walk-in sedang menunggu giliran)
  const [orderActive3] = await knex('service_orders').insert({
    order_number: 'SPK-W202611-003',
    business_type: 'WORKSHOP',
    customer_name: 'Rian Santoso',
    customer_phone: '087811223344',
    asset_identifier: 'B 2341 TYA (Honda PCX 160)',
    customer_asset_id: assetMap['B 2341 TYA'].id,
    odometer_km: 8450.00,
    scheduled_start: now.toISOString(),
    scheduled_end: new Date(now.getTime() + 45 * 60000).toISOString(),
    resource_id: resMap['BAY-02'].id,
    staff_id: staffMap['MEC-02'].id,
    status: 'QUEUED',
    notes: 'Pengecekan rem belakang bunyi mendecit saat hujan.',
    total_service_amount: 35000,
    total_consumable_amount: 0,
    grand_total: 35000
  }).returning('*');

  await knex('service_order_items').insert([
    { service_order_id: orderActive3.id, item_id: itemMap['SRV-W02'].id, item_type: 'SERVICE', item_name: 'Jasa Ganti Oli & Pengecekan Rem', qty: 1, unit_price: 35000, subtotal: 35000, staff_id: staffMap['MEC-02'].id }
  ]);

  // Order Active 4: Salon - BOOKED (Reservasi Jadwal Besok)
  const tomorrowStart = new Date(now.getTime() + 24 * 3600000).toISOString();
  const tomorrowEnd = new Date(now.getTime() + 25.5 * 3600000).toISOString();
  const [orderActive4] = await knex('service_orders').insert({
    order_number: 'SPK-S202611-004',
    business_type: 'SALON',
    customer_name: 'Clarissa Putri',
    customer_phone: '081900112233',
    asset_identifier: 'CUST-SLN-002 (Clarissa Putri)',
    customer_asset_id: assetMap['CUST-SLN-002'].id,
    scheduled_start: tomorrowStart,
    scheduled_end: tomorrowEnd,
    resource_id: resMap['BED-01'].id,
    staff_id: staffMap['THR-01'].id,
    status: 'BOOKED',
    notes: 'Booking spa relaksasi & facial pencerah wajah weekend.',
    total_service_amount: 150000,
    total_consumable_amount: 50000,
    grand_total: 200000
  }).returning('*');

  await knex('service_order_items').insert([
    { service_order_id: orderActive4.id, item_id: itemMap['SRV-S03'].id, item_type: 'SERVICE', item_name: 'Facial Brightening & Totok Wajah', qty: 1, unit_price: 150000, subtotal: 150000, staff_id: staffMap['THR-01'].id },
    { service_order_id: orderActive4.id, item_id: itemMap['CSM-S03'].id, item_type: 'CONSUMABLE', item_name: 'Ampul Serum Vitamin C Glow', qty: 1, unit_price: 50000, subtotal: 50000, staff_id: staffMap['THR-01'].id }
  ]);

  // =========================================================================
  // 10. SEED SAMPLE WARRANTY CLAIMS
  // =========================================================================

  // Claim 1: Order 3 (Bambang Sudiro - Kampas rem bunyi) - SUBMITTED
  await knex('warranty_claims').insert({
    claim_number: 'CLM-202611-001',
    original_service_order_id: co3.id,
    customer_asset_id: assetMap['D 1944 AD'].id,
    claim_date: now.toISOString(),
    claim_odometer: 18350.00, // +150 KM (Masih dalam garansi 1.000 KM)
    complaint_reason: 'Rem depan berdecit kencang saat deselerasi setelah 3 hari servis',
    inspection_result: 'Kaliper rem agak longgar pada pin pengunci kampas rem',
    root_cause: 'WORKMANSHIP_ERROR',
    status: 'SUBMITTED',
    total_claim_cost: 0.00
  });

  // Claim 2: Order 5 (Clarissa Putri - Revisi Potong Poni Salon) - APPROVED (Zero-Cost SPK)
  const [reworkSalonOrder] = await knex('service_orders').insert({
    order_number: 'SPK-GAR-S202611-0001',
    business_type: 'SALON',
    customer_name: 'Clarissa Putri',
    customer_phone: '081900112233',
    asset_identifier: 'CUST-SLN-002 (Clarissa Putri)',
    customer_asset_id: assetMap['CUST-SLN-002'].id,
    scheduled_start: now.toISOString(),
    scheduled_end: new Date(now.getTime() + 30 * 60000).toISOString(),
    resource_id: resMap['CHR-02'].id,
    staff_id: staffMap['STY-01'].id,
    status: 'QUEUED',
    notes: '[GARANSI KLAIM CLM-202611-002]: Rapikan potongan poni samping tanpa biaya',
    total_service_amount: 0,
    total_consumable_amount: 0,
    grand_total: 0,
    is_warranty_rework: true
  }).returning('*');

  await knex('service_order_items').insert({
    service_order_id: reworkSalonOrder.id,
    item_id: itemMap['SRV-S01'].id,
    item_type: 'SERVICE',
    item_name: 'Pengerjaan Ulang Garansi (CLM-202611-002)',
    qty: 1,
    unit_price: 0,
    subtotal: 0,
    staff_id: staffMap['STY-01'].id
  });

  await knex('warranty_claims').insert({
    claim_number: 'CLM-202611-002',
    original_service_order_id: co5.id,
    customer_asset_id: assetMap['CUST-SLN-002'].id,
    claim_date: getOffsetDate(0, 2),
    claim_odometer: 0.00,
    complaint_reason: 'Potongan poni sisi kanan sedikit lebih panjang dibanding kiri',
    inspection_result: 'Stylist telah memeriksa dan setuju menyamakan panjang poni secara gratis',
    root_cause: 'WORKMANSHIP_ERROR',
    status: 'APPROVED',
    total_claim_cost: 0.00,
    zero_cost_service_order_id: reworkSalonOrder.id,
    approved_by_user_id: adminUser.id
  });

  console.log('================================================================');
  console.log('✅ SEED BERHASIL DIPERBANYAK:');
  console.log('   - 8 Faktur Penjualan (Transactions) senilai > Rp 1.250.000 omzet');
  console.log('   - Multi/Split Payment (CASH, QRIS, TRANSFER)');
  console.log('   - 7 Catatan Komisi PENDING siap dipayout untuk 4 staf:');
  console.log('     * Budi Hartono  (MEC-01) : Rp 42.000 PENDING');
  console.log('     * Agus Pratama  (MEC-02) : Rp 26.250 PENDING');
  console.log('     * Dewi Lestari  (STY-01) : Rp 71.250 PENDING (+ Rp 24.000 PAID_OUT)');
  console.log('     * Rina Anggraini(THR-01) : Rp 35.000 PENDING');
  console.log('   - 4 Antrean Aktif di Kanban (BOOKED, QUEUED, IN_PROGRESS, READY_TO_PAY)');
  console.log('   - 2 Klaim Garansi Aktif (1 SUBMITTED, 1 APPROVED SPK Rp 0)');
  console.log('================================================================');
};
