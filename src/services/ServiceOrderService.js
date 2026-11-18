const db = require('../config/database');
const CollisionEngineService = require('./CollisionEngineService');

class ServiceOrderService {
  /**
   * Create a new booking / work order with collision prevention
   */
  static async createOrder(data) {
    const {
      business_type,
      customer_name,
      customer_phone,
      asset_identifier,
      scheduled_start,
      scheduled_end,
      resource_id,
      staff_id,
      notes,
      service_items = []
    } = data;

    // 1. Collision check
    const collisionCheck = await CollisionEngineService.checkCollision({
      resourceId: resource_id,
      staffId: staff_id,
      targetStart: scheduled_start,
      targetEnd: scheduled_end
    });

    if (collisionCheck.hasCollision) {
      const err = new Error(collisionCheck.reason);
      err.status = 409; // Conflict
      throw err;
    }

    // Generate unique order number (e.g. SPK-W202611-0004)
    const prefix = business_type === 'SALON' ? 'SPK-S' : 'SPK-W';
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await db('service_orders').count('id as cnt').first();
    const orderNum = `${prefix}${dateStr}-${String(Number(countResult.cnt) + 1).padStart(4, '0')}`;

    return await db.transaction(async (trx) => {
      // Calculate initial service amounts
      let totalService = 0;
      let totalConsumable = 0;

      for (const item of service_items) {
        if (item.item_type === 'SERVICE') {
          totalService += Number(item.unit_price || 0) * Number(item.qty || 1);
        } else {
          totalConsumable += Number(item.unit_price || 0) * Number(item.qty || 1);
        }
      }

      const grandTotal = totalService + totalConsumable;

      const [order] = await trx('service_orders').insert({
        order_number: orderNum,
        business_type,
        customer_name,
        customer_phone,
        asset_identifier,
        scheduled_start,
        scheduled_end,
        resource_id,
        staff_id,
        status: data.status || 'BOOKED',
        notes,
        total_service_amount: totalService,
        total_consumable_amount: totalConsumable,
        grand_total: grandTotal
      }).returning('*');

      // Insert service order items
      for (const item of service_items) {
        await trx('service_order_items').insert({
          service_order_id: order.id,
          item_id: item.item_id,
          item_type: item.item_type || 'SERVICE',
          item_name: item.item_name,
          qty: item.qty || 1,
          unit_price: item.unit_price,
          subtotal: Number(item.unit_price) * Number(item.qty || 1),
          staff_id: item.staff_id || staff_id
        });
      }

      // If status is IN_PROGRESS, mark resource as OCCUPIED
      if (order.status === 'IN_PROGRESS') {
        await trx('service_resources').where({ id: resource_id }).update({ status: 'OCCUPIED' });
        await trx('service_orders').where({ id: order.id }).update({ actual_start: db.fn.now() });
      }

      return order;
    });
  }

  /**
   * Update order status with lifecycle checks
   */
  static async updateStatus(orderId, newStatus) {
    const validStatuses = ['BOOKED', 'QUEUED', 'IN_PROGRESS', 'READY_TO_PAY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      const err = new Error(`Status tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}`);
      err.status = 400;
      throw err;
    }

    const order = await db('service_orders').where({ id: orderId }).first();
    if (!order) {
      const err = new Error('Order servis tidak ditemukan');
      err.status = 404;
      throw err;
    }

    return await db.transaction(async (trx) => {
      const updates = { status: newStatus, updated_at: db.fn.now() };

      if (newStatus === 'IN_PROGRESS') {
        if (!order.actual_start) {
          updates.actual_start = db.fn.now();
        }
        await trx('service_resources').where({ id: order.resource_id }).update({ status: 'OCCUPIED' });
      } else if (newStatus === 'READY_TO_PAY' || newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
        if (!order.actual_end && (newStatus === 'READY_TO_PAY' || newStatus === 'COMPLETED')) {
          updates.actual_end = db.fn.now();
        }
        // Free the physical resource
        await trx('service_resources').where({ id: order.resource_id }).update({ status: 'AVAILABLE' });
      }

      await trx('service_orders').where({ id: orderId }).update(updates);
      return await trx('service_orders').where({ id: orderId }).first();
    });
  }

  /**
   * Add a consumed part / chemical or extra service to an ongoing order
   */
  static async addItemToOrder(orderId, itemData) {
    const { item_id, qty = 1, staff_id } = itemData;

    const order = await db('service_orders').where({ id: orderId }).first();
    if (!order) {
      const err = new Error('Order servis tidak ditemukan');
      err.status = 404;
      throw err;
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      const err = new Error('Tidak dapat menambah item ke order yang telah selesai atau dibatalkan');
      err.status = 400;
      throw err;
    }

    const item = await db('items').where({ id: item_id }).first();
    if (!item) {
      const err = new Error('Item atau sparepart tidak ditemukan di katalog');
      err.status = 404;
      throw err;
    }

    return await db.transaction(async (trx) => {
      const subtotal = Number(item.price) * Number(qty);

      await trx('service_order_items').insert({
        service_order_id: orderId,
        item_id: item.id,
        item_type: item.type === 'SERVICE' ? 'SERVICE' : 'CONSUMABLE',
        item_name: item.name,
        qty: Number(qty),
        unit_price: Number(item.price),
        subtotal: subtotal,
        staff_id: staff_id || order.staff_id
      });

      // Recalculate totals
      const allItems = await trx('service_order_items').where({ service_order_id: orderId });
      let totalService = 0;
      let totalConsumable = 0;

      for (const line of allItems) {
        if (line.item_type === 'SERVICE') {
          totalService += Number(line.subtotal);
        } else {
          totalConsumable += Number(line.subtotal);
        }
      }

      const grandTotal = totalService + totalConsumable;

      await trx('service_orders').where({ id: orderId }).update({
        total_service_amount: totalService,
        total_consumable_amount: totalConsumable,
        grand_total: grandTotal,
        updated_at: db.fn.now()
      });

      return await trx('service_orders').where({ id: orderId }).first();
    });
  }
}

module.exports = ServiceOrderService;
