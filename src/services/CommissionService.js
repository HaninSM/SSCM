const db = require('../config/database');

class CommissionService {
  /**
   * Calculate and record commissions for a completed service order
   */
  static async recordCommissionsForOrder(serviceOrderId, trx) {
    const knexClient = trx || db;

    // Get order items and order info
    const order = await knexClient('service_orders').where({ id: serviceOrderId }).first();
    if (!order) return [];

    const items = await knexClient('service_order_items').where({ service_order_id: serviceOrderId });
    const commissionLogs = [];

    for (const item of items) {
      // Determine staff: either line staff or default order staff
      const staffId = item.staff_id || order.staff_id;
      if (!staffId) continue;

      const staff = await knexClient('service_staff').where({ id: staffId }).first();
      if (!staff) continue;

      let commissionRate = 0;
      let commissionAmount = 0;

      if (item.item_type === 'SERVICE') {
        // Find item's commission rate or fallback to staff's default rate
        const serviceItem = await knexClient('items').where({ id: item.item_id }).first();
        commissionRate = serviceItem && serviceItem.commission_rate > 0 
          ? Number(serviceItem.commission_rate) 
          : Number(staff.default_commission_rate);

        const baseAmount = Number(item.subtotal);
        commissionAmount = (baseAmount * commissionRate) / 100;

        // Add flat incentive if defined
        if (Number(staff.flat_incentive_amount) > 0) {
          commissionAmount += Number(staff.flat_incentive_amount);
        }

        const [log] = await knexClient('commission_logs').insert({
          service_order_id: serviceOrderId,
          staff_id: staffId,
          service_order_item_id: item.id,
          base_amount: baseAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          status: 'PENDING'
        }).returning('*');

        commissionLogs.push(log);
      }
    }

    return commissionLogs;
  }

  /**
   * Get commission summary grouped by staff with optional date filter
   */
  static async getSummary({ startDate, endDate, staffId = null }) {
    let query = db('commission_logs as cl')
      .join('service_staff as ss', 'cl.staff_id', 'ss.id')
      .join('service_orders as so', 'cl.service_order_id', 'so.id')
      .select(
        'ss.id as staff_id',
        'ss.staff_code',
        'ss.name as staff_name',
        'ss.role_title',
        'ss.business_type',
        db.raw('COUNT(cl.id) as total_jobs'),
        db.raw('SUM(cl.base_amount) as total_service_sales'),
        db.raw('SUM(cl.commission_amount) as total_commission'),
        db.raw("SUM(CASE WHEN cl.status = 'PENDING' THEN cl.commission_amount ELSE 0 END) as pending_commission"),
        db.raw("SUM(CASE WHEN cl.status = 'PAID_OUT' THEN cl.commission_amount ELSE 0 END) as paid_commission")
      )
      .groupBy('ss.id', 'ss.staff_code', 'ss.name', 'ss.role_title', 'ss.business_type');

    if (startDate) {
      query = query.where('cl.created_at', '>=', startDate);
    }
    if (endDate) {
      query = query.where('cl.created_at', '<=', endDate);
    }
    if (staffId) {
      query = query.where('cl.staff_id', staffId);
    }

    return await query;
  }

  /**
   * Payout / Settle pending commissions for a staff member
   */
  static async settlePayout(staffId, logIds = []) {
    let query = db('commission_logs')
      .where({ staff_id: staffId, status: 'PENDING' });

    if (logIds && logIds.length > 0) {
      query = query.whereIn('id', logIds);
    }

    const updated = await query.update({
      status: 'PAID_OUT',
      paid_at: db.fn.now()
    });

    return { success: true, count: updated };
  }
}

module.exports = CommissionService;
