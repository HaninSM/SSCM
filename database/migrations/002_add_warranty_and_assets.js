/**
 * Knex Migration: 002_add_warranty_and_assets.js
 * Comprehensive Service History, Customer Assets, and Warranty Claims Management
 */

exports.up = async function(knex) {
  // 1. Customer Assets (Kendaraan Bermotor & Profil Kecantikan Salon)
  await knex.schema.createTable('customer_assets', (table) => {
    table.increments('id').primary();
    table.string('asset_type', 30).notNullable(); // 'VEHICLE', 'BEAUTY_PROFILE'
    table.string('identifier', 100).unique().notNullable(); // No. Plat atau ID Konsumen
    table.string('customer_name', 100).notNullable();
    table.string('customer_phone', 30);
    table.string('brand_model', 100); // Misal: Honda Vario 160 / Kulit Kering Sensitif
    table.decimal('current_odometer', 10, 2).defaultTo(0.00); // Khusus Bengkel (KM)
    table.text('allergy_notes'); // Khusus Salon: Riwayat Alergi Zat Kimiawi
    table.text('formula_notes'); // Khusus Salon: Formula racikan cat/treatment terdahulu
    table.datetime('last_service_date');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Warranty Policies (Kebijakan Garansi Per Layanan / Suku Cadang)
  await knex.schema.createTable('warranty_policies', (table) => {
    table.increments('id').primary();
    table.integer('item_id').unsigned().references('id').inTable('items').onDelete('CASCADE');
    table.string('policy_name', 100).notNullable();
    table.integer('warranty_days').defaultTo(14); // Batas garansi dalam hari
    table.decimal('warranty_km', 10, 2).defaultTo(1000.00); // Batas garansi dalam KM (Khusus Bengkel)
    table.string('claim_action', 30).defaultTo('FREE_REWORK'); // 'FREE_REWORK', 'PART_REPLACEMENT'
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. Expenses (Pencatatan Beban Biaya Toko - TokoJendral Compatible)
  await knex.schema.createTable('expenses', (table) => {
    table.increments('id').primary();
    table.string('expense_number', 50).unique().notNullable();
    table.string('category', 50).notNullable().defaultTo('Beban Klaim Garansi & Mutu');
    table.decimal('amount', 12, 2).notNullable();
    table.string('payment_method', 30).defaultTo('NON_CASH_EXPENSE');
    table.text('notes');
    table.string('ref_type', 50); // 'WARRANTY_CLAIM', 'GENERAL'
    table.integer('ref_id').unsigned();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 4. Update service_orders to support asset reference, odometer, and warranty expiration
  await knex.schema.alterTable('service_orders', (table) => {
    table.integer('customer_asset_id').unsigned().references('id').inTable('customer_assets').onDelete('SET NULL');
    table.decimal('odometer_km', 10, 2).defaultTo(0.00);
    table.datetime('warranty_exp_date');
    table.decimal('warranty_exp_km', 10, 2).defaultTo(0.00);
    table.boolean('is_warranty_rework').defaultTo(false);
  });

  // 5. Warranty Claims (Pengajuan & Persetujuan Klaim Garansi)
  await knex.schema.createTable('warranty_claims', (table) => {
    table.increments('id').primary();
    table.string('claim_number', 50).unique().notNullable();
    table.integer('original_service_order_id').unsigned().notNullable().references('id').inTable('service_orders');
    table.integer('customer_asset_id').unsigned().references('id').inTable('customer_assets');
    table.datetime('claim_date').defaultTo(knex.fn.now());
    table.decimal('claim_odometer', 10, 2).defaultTo(0.00);
    table.text('complaint_reason').notNullable();
    table.text('inspection_result');
    table.string('root_cause', 50).defaultTo('PENDING'); // 'WORKMANSHIP_ERROR', 'DEFECTIVE_PART', 'CUSTOMER_MISUSE', 'PENDING'
    table.string('status', 30).notNullable().defaultTo('SUBMITTED'); // 'SUBMITTED', 'INSPECTING', 'APPROVED', 'REJECTED', 'COMPLETED'
    table.decimal('total_claim_cost', 12, 2).defaultTo(0.00);
    table.integer('zero_cost_service_order_id').unsigned().references('id').inTable('service_orders');
    table.integer('approved_by_user_id').unsigned().references('id').inTable('users');
    table.text('rejection_reason');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 6. Warranty Claim Items (Part Pengganti Gratis & Pelacakan Retur Vendor)
  await knex.schema.createTable('warranty_claim_items', (table) => {
    table.increments('id').primary();
    table.integer('warranty_claim_id').unsigned().notNullable().references('id').inTable('warranty_claims').onDelete('CASCADE');
    table.integer('item_id').unsigned().notNullable().references('id').inTable('items');
    table.decimal('qty', 10, 2).defaultTo(1.00);
    table.decimal('cost_price', 12, 2).defaultTo(0.00);
    table.string('supplier_claim_status', 30).defaultTo('NONE'); // 'NONE', 'RETURNED_TO_VENDOR', 'CREDIT_NOTE_RECEIVED'
    table.string('serial_number', 100);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('warranty_claim_items');
  await knex.schema.dropTableIfExists('warranty_claims');
  await knex.schema.alterTable('service_orders', (table) => {
    table.dropColumn('customer_asset_id');
    table.dropColumn('odometer_km');
    table.dropColumn('warranty_exp_date');
    table.dropColumn('warranty_exp_km');
    table.dropColumn('is_warranty_rework');
  });
  await knex.schema.dropTableIfExists('expenses');
  await knex.schema.dropTableIfExists('warranty_policies');
  await knex.schema.dropTableIfExists('customer_assets');
};
