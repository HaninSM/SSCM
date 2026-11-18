/**
 * Knex Migration: 001_initial_schema.js
 * SSCM - Service Supply Chain Management Initial Schema
 */

exports.up = async function(knex) {
  // 1. Users Table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username', 50).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('name', 100).notNullable();
    table.string('role', 30).notNullable().defaultTo('cashier'); // 'admin', 'cashier', 'technician'
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Service Resources (Bay, Lift, Chair, Bed, Room)
  await knex.schema.createTable('service_resources', (table) => {
    table.increments('id').primary();
    table.string('code', 30).unique().notNullable();
    table.string('name', 100).notNullable();
    table.string('business_type', 30).notNullable(); // 'WORKSHOP', 'SALON'
    table.string('resource_type', 30).notNullable(); // 'BAY', 'LIFT', 'CHAIR', 'BED', 'ROOM'
    table.string('status', 30).notNullable().defaultTo('AVAILABLE'); // 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. Service Staff (Mechanics, Stylists, Therapists)
  await knex.schema.createTable('service_staff', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.string('staff_code', 30).unique().notNullable();
    table.string('name', 100).notNullable();
    table.string('business_type', 30).notNullable(); // 'WORKSHOP', 'SALON'
    table.string('role_title', 50).notNullable(); // 'MEKANIK', 'STYLIST', 'TERAPIS', 'DOKTER'
    table.decimal('default_commission_rate', 5, 2).defaultTo(15.00); // 15.00%
    table.decimal('flat_incentive_amount', 12, 2).defaultTo(0.00);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 4. Items (Services, Consumables, and Products)
  await knex.schema.createTable('items', (table) => {
    table.increments('id').primary();
    table.string('sku', 50).unique().notNullable();
    table.string('name', 150).notNullable();
    table.string('business_type', 30).notNullable().defaultTo('ALL'); // 'WORKSHOP', 'SALON', 'ALL'
    table.string('type', 30).notNullable(); // 'SERVICE', 'CONSUMABLE', 'PRODUCT'
    table.string('category', 50).notNullable(); // 'Jasa Servis', 'Pelumas & Part', 'Perawatan Rambut', dll
    table.string('unit', 30).defaultTo('PCS'); // 'PCS', 'JAM', 'LITER', 'BOTTLE'
    table.decimal('price', 12, 2).notNullable().defaultTo(0.00); // Selling price / Tariff
    table.decimal('cost_price', 12, 2).defaultTo(0.00); // Base cost (HPP)
    table.integer('duration_minutes').defaultTo(30); // Estimated duration if type == 'SERVICE'
    table.decimal('commission_rate', 5, 2).defaultTo(15.00); // Commission % for this service
    table.decimal('stock', 10, 2).defaultTo(0.00); // Total on-hand stock for consumables/products
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 5. Inventory Batches (FIFO tracking for consumables & products)
  await knex.schema.createTable('inventory_batches', (table) => {
    table.increments('id').primary();
    table.integer('item_id').unsigned().notNullable().references('id').inTable('items').onDelete('CASCADE');
    table.string('batch_number', 50).notNullable();
    table.decimal('initial_quantity', 10, 2).notNullable();
    table.decimal('remaining_quantity', 10, 2).notNullable();
    table.decimal('cost_per_unit', 12, 2).notNullable();
    table.date('received_date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 6. Service Orders (SPK / Booking / Antrean)
  await knex.schema.createTable('service_orders', (table) => {
    table.increments('id').primary();
    table.string('order_number', 50).unique().notNullable();
    table.string('business_type', 30).notNullable(); // 'WORKSHOP', 'SALON'
    table.string('customer_name', 100).notNullable();
    table.string('customer_phone', 30);
    table.string('asset_identifier', 100).notNullable(); // Plat Nomor (Workshop) atau Jenis Rambut/Kulit (Salon)
    table.datetime('scheduled_start').notNullable();
    table.datetime('scheduled_end').notNullable();
    table.datetime('actual_start');
    table.datetime('actual_end');
    table.integer('resource_id').unsigned().notNullable().references('id').inTable('service_resources');
    table.integer('staff_id').unsigned().notNullable().references('id').inTable('service_staff');
    table.string('status', 30).notNullable().defaultTo('BOOKED'); // 'BOOKED', 'QUEUED', 'IN_PROGRESS', 'READY_TO_PAY', 'COMPLETED', 'CANCELLED'
    table.text('notes');
    table.decimal('total_service_amount', 12, 2).defaultTo(0.00);
    table.decimal('total_consumable_amount', 12, 2).defaultTo(0.00);
    table.decimal('grand_total', 12, 2).defaultTo(0.00);
    table.integer('transaction_id').unsigned(); // Relasi ke POS transactions saat lunas
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 7. Service Order Items (Lines of Services and Consumed Materials)
  await knex.schema.createTable('service_order_items', (table) => {
    table.increments('id').primary();
    table.integer('service_order_id').unsigned().notNullable().references('id').inTable('service_orders').onDelete('CASCADE');
    table.integer('item_id').unsigned().notNullable().references('id').inTable('items');
    table.string('item_type', 30).notNullable(); // 'SERVICE', 'CONSUMABLE'
    table.string('item_name', 150).notNullable();
    table.decimal('qty', 10, 2).notNullable().defaultTo(1.00);
    table.decimal('unit_price', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('subtotal', 12, 2).notNullable().defaultTo(0.00);
    table.integer('staff_id').unsigned().references('id').inTable('service_staff');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 8. Transactions (POS Sales Checkout)
  await knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table.string('invoice_number', 50).unique().notNullable();
    table.integer('service_order_id').unsigned().references('id').inTable('service_orders');
    table.string('customer_name', 100);
    table.decimal('subtotal', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('discount', 12, 2).defaultTo(0.00);
    table.decimal('tax', 12, 2).defaultTo(0.00);
    table.decimal('grand_total', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('total_paid', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('change_amount', 12, 2).defaultTo(0.00);
    table.string('payment_status', 30).notNullable().defaultTo('PAID'); // 'PAID', 'PARTIAL'
    table.integer('cashier_id').unsigned().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 9. Transaction Payments (Split Payments: CASH, TRANSFER, QRIS)
  await knex.schema.createTable('transaction_payments', (table) => {
    table.increments('id').primary();
    table.integer('transaction_id').unsigned().notNullable().references('id').inTable('transactions').onDelete('CASCADE');
    table.string('payment_method', 30).notNullable(); // 'CASH', 'TRANSFER', 'QRIS'
    table.decimal('amount', 12, 2).notNullable();
    table.string('reference_number', 100);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 10. Commission Logs (Staff Insentif / Gaji Komisi)
  await knex.schema.createTable('commission_logs', (table) => {
    table.increments('id').primary();
    table.integer('service_order_id').unsigned().notNullable().references('id').inTable('service_orders');
    table.integer('staff_id').unsigned().notNullable().references('id').inTable('service_staff');
    table.integer('service_order_item_id').unsigned().references('id').inTable('service_order_items');
    table.decimal('base_amount', 12, 2).notNullable();
    table.decimal('commission_rate', 5, 2).notNullable();
    table.decimal('commission_amount', 12, 2).notNullable();
    table.string('status', 30).notNullable().defaultTo('PENDING'); // 'PENDING', 'PAID_OUT'
    table.datetime('paid_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('commission_logs');
  await knex.schema.dropTableIfExists('transaction_payments');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('service_order_items');
  await knex.schema.dropTableIfExists('service_orders');
  await knex.schema.dropTableIfExists('inventory_batches');
  await knex.schema.dropTableIfExists('items');
  await knex.schema.dropTableIfExists('service_staff');
  await knex.schema.dropTableIfExists('service_resources');
  await knex.schema.dropTableIfExists('users');
};
