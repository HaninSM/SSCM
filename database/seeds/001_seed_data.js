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

  const [adminUser] = await knex('users').insert([
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

    // Workshop Consumables
    { sku: 'PRT-W01', name: 'Oli Mesin Matic 10W-30 0.8L', business_type: 'WORKSHOP', type: 'CONSUMABLE', category: 'Pelumas & Kimia', unit: 'BOTOL', price: 65000, cost_price: 48000, duration_minutes: 0, commission_rate: 0, stock: 24 },
    { sku: 'PRT-W02', name: 'Busi Standar U27EPR9', business_type: 'WORKSHOP', type: 'CONSUMABLE', category: 'Suku Cadang', unit: 'PCS', price: 35000, cost_price: 24000, duration_minutes: 0, commission_rate: 0, stock: 15 },
    { sku: 'PRT-W03', name: 'Kampas Rem Cakram Depan', business_type: 'WORKSHOP', type: 'CONSUMABLE', category: 'Suku Cadang', unit: 'SET', price: 55000, cost_price: 38000, duration_minutes: 0, commission_rate: 0, stock: 10 },

    // Salon Services
    { sku: 'SRV-S01', name: 'Haircut Premium & Wash Styling', business_type: 'SALON', type: 'SERVICE', category: 'Jasa Salon', unit: 'JAM', price: 60000, cost_price: 0, duration_minutes: 40, commission_rate: 25, stock: 0 },
    { sku: 'SRV-S02', name: 'Creambath Tradisional + Pijat Leher', business_type: 'SALON', type: 'SERVICE', category: 'Jasa Salon', unit: 'JAM', price: 95000, cost_price: 0, duration_minutes: 60, commission_rate: 20, stock: 0 },
    { sku: 'SRV-S03', name: 'Facial Brightening & Totok Wajah', business_type: 'SALON', type: 'SERVICE', category: 'Jasa Perawatan', unit: 'JAM', price: 150000, cost_price: 0, duration_minutes: 75, commission_rate: 20, stock: 0 },

    // Salon Consumables
    { sku: 'CSM-S01', name: 'Serum Rambut Argan Oil 10ml', business_type: 'SALON', type: 'CONSUMABLE', category: 'Bahan Salon', unit: 'BOTOL', price: 35000, cost_price: 20000, duration_minutes: 0, commission_rate: 0, stock: 30 },
    { sku: 'CSM-S02', name: 'Krim Masker Creambath Lidah Buaya 250g', business_type: 'SALON', type: 'CONSUMABLE', category: 'Bahan Salon', unit: 'JAR', price: 40000, cost_price: 25000, duration_minutes: 0, commission_rate: 0, stock: 18 },
    { sku: 'CSM-S03', name: 'Ampul Serum Vitamin C Glow', business_type: 'SALON', type: 'CONSUMABLE', category: 'Bahan Estetika', unit: 'AMPUL', price: 50000, cost_price: 32000, duration_minutes: 0, commission_rate: 0, stock: 20 }
  ]).returning('*');

  // Helper mapping
  const itemMap = {};
  items.forEach(i => { itemMap[i.sku] = i; });
  const resMap = {};
  resources.forEach(r => { resMap[r.code] = r; });
  const staffMap = {};
  staff.forEach(s => { staffMap[s.staff_code] = s; });

  // 5. Customer Assets (Kendaraan & Rekam Medis Salon)
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

  // 7. Inventory Batches (FIFO)
  await knex('inventory_batches').insert([
    { item_id: itemMap['PRT-W01'].id, batch_number: 'BATCH-OLI-202611-01', initial_quantity: 12, remaining_quantity: 12, cost_per_unit: 47000, received_date: '2026-11-01' },
    { item_id: itemMap['PRT-W01'].id, batch_number: 'BATCH-OLI-202611-02', initial_quantity: 12, remaining_quantity: 12, cost_per_unit: 49000, received_date: '2026-11-10' },
    { item_id: itemMap['PRT-W02'].id, batch_number: 'BATCH-BUSI-01', initial_quantity: 15, remaining_quantity: 15, cost_per_unit: 24000, received_date: '2026-11-05' },
    { item_id: itemMap['PRT-W03'].id, batch_number: 'BATCH-REM-01', initial_quantity: 10, remaining_quantity: 10, cost_per_unit: 38000, received_date: '2026-11-05' },
    { item_id: itemMap['CSM-S01'].id, batch_number: 'BATCH-SRM-01', initial_quantity: 30, remaining_quantity: 30, cost_per_unit: 20000, received_date: '2026-11-02' },
    { item_id: itemMap['CSM-S02'].id, batch_number: 'BATCH-CRM-01', initial_quantity: 18, remaining_quantity: 18, cost_per_unit: 25000, received_date: '2026-11-04' },
    { item_id: itemMap['CSM-S03'].id, batch_number: 'BATCH-AMP-01', initial_quantity: 20, remaining_quantity: 20, cost_per_unit: 32000, received_date: '2026-11-08' }
  ]);

  // 8. Seed Service Orders
  const now = new Date();
  const start1 = new Date(now.getTime() - 30 * 60000).toISOString();
  const end1 = new Date(now.getTime() + 30 * 60000).toISOString();
  const expDate14 = new Date(now.getTime() + 14 * 86400000).toISOString();

  // Order 1: Workshop - IN_PROGRESS
  const [order1] = await knex('service_orders').insert({
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
    { service_order_id: order1.id, item_id: itemMap['SRV-W01'].id, item_type: 'SERVICE', item_name: 'Servis Ringan & Tune Up Injeksi', qty: 1, unit_price: 75000, subtotal: 75000, staff_id: staffMap['MEC-01'].id },
    { service_order_id: order1.id, item_id: itemMap['PRT-W01'].id, item_type: 'CONSUMABLE', item_name: 'Oli Mesin Matic 10W-30 0.8L', qty: 1, unit_price: 65000, subtotal: 65000, staff_id: staffMap['MEC-01'].id }
  ]);

  // Order 2: Salon - READY_TO_PAY (with Allergy Note verified)
  const expDate7 = new Date(now.getTime() + 7 * 86400000).toISOString();
  const [order2] = await knex('service_orders').insert({
    order_number: 'SPK-S202611-002',
    business_type: 'SALON',
    customer_name: 'Jessica Melina',
    customer_phone: '085712349988',
    asset_identifier: 'Rambut Bob Pendek (Kulit Sensitif)',
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
    { service_order_id: order2.id, item_id: itemMap['SRV-S01'].id, item_type: 'SERVICE', item_name: 'Haircut Premium & Wash Styling', qty: 1, unit_price: 60000, subtotal: 60000, staff_id: staffMap['STY-01'].id },
    { service_order_id: order2.id, item_id: itemMap['SRV-S02'].id, item_type: 'SERVICE', item_name: 'Creambath Tradisional + Pijat Leher', qty: 1, unit_price: 95000, subtotal: 95000, staff_id: staffMap['STY-01'].id },
    { service_order_id: order2.id, item_id: itemMap['CSM-S01'].id, item_type: 'CONSUMABLE', item_name: 'Serum Rambut Argan Oil 10ml', qty: 1, unit_price: 35000, subtotal: 35000, staff_id: staffMap['STY-01'].id },
    { service_order_id: order2.id, item_id: itemMap['CSM-S02'].id, item_type: 'CONSUMABLE', item_name: 'Krim Masker Creambath Lidah Buaya 250g', qty: 1, unit_price: 40000, subtotal: 40000, staff_id: staffMap['STY-01'].id }
  ]);

  // Order 3: Completed Order with Active Warranty (Order Bambang Sudiro 3 days ago)
  const pastDate = new Date(now.getTime() - 3 * 86400000).toISOString();
  const [order3] = await knex('service_orders').insert({
    order_number: 'SPK-W202611-000',
    business_type: 'WORKSHOP',
    customer_name: 'Bambang Sudiro',
    customer_phone: '081399887766',
    asset_identifier: 'D 1944 AD (Yamaha NMAX)',
    customer_asset_id: assetMap['D 1944 AD'].id,
    odometer_km: 18200.00,
    warranty_exp_date: new Date(now.getTime() + 11 * 86400000).toISOString(),
    warranty_exp_km: 19200.00,
    scheduled_start: pastDate,
    scheduled_end: pastDate,
    actual_start: pastDate,
    actual_end: pastDate,
    resource_id: resMap['BAY-02'].id,
    staff_id: staffMap['MEC-02'].id,
    status: 'COMPLETED',
    notes: 'Ganti kampas rem cakram depan dan servis berkala',
    total_service_amount: 75000,
    total_consumable_amount: 55000,
    grand_total: 130000
  }).returning('*');

  await knex('service_order_items').insert([
    { service_order_id: order3.id, item_id: itemMap['SRV-W01'].id, item_type: 'SERVICE', item_name: 'Servis Ringan & Tune Up Injeksi', qty: 1, unit_price: 75000, subtotal: 75000, staff_id: staffMap['MEC-02'].id },
    { service_order_id: order3.id, item_id: itemMap['PRT-W03'].id, item_type: 'CONSUMABLE', item_name: 'Kampas Rem Cakram Depan', qty: 1, unit_price: 55000, subtotal: 55000, staff_id: staffMap['MEC-02'].id }
  ]);

  // 9. Seed Sample Warranty Claim for Order 3 (Bambang Sudiro - Kampas rem bunyi)
  const [claim1] = await knex('warranty_claims').insert({
    claim_number: 'CLM-202611-001',
    original_service_order_id: order3.id,
    customer_asset_id: assetMap['D 1944 AD'].id,
    claim_date: now.toISOString(),
    claim_odometer: 18350.00, // Menambah 150 KM (Masih dalam garansi 1.000 KM)
    complaint_reason: 'Rem depan berdecit kencang saat deselerasi setelah 3 hari servis',
    inspection_result: 'Kaliper rem agak longgar pada pin pengunci kampas rem',
    root_cause: 'WORKMANSHIP_ERROR',
    status: 'SUBMITTED',
    total_claim_cost: 0.00
  }).returning('*');

  console.log('✅ Seed data with Assets & Warranty Claims successfully populated!');
};
