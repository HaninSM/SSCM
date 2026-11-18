const db = require('../config/database');
const CommissionService = require('../services/CommissionService');

class CommissionController {
  // 1. Get staff commission summary
  static async getSummary(req, res, next) {
    try {
      const { start_date, end_date, staff_id } = req.query;
      const summary = await CommissionService.getSummary({
        startDate: start_date,
        endDate: end_date,
        staffId: staff_id
      });
      res.json({ success: true, summary });
    } catch (err) {
      next(err);
    }
  }

  // 2. Get detailed commission logs
  static async getLogs(req, res, next) {
    try {
      const { staff_id, status, limit = 100 } = req.query;
      let query = db('commission_logs as cl')
        .join('service_staff as ss', 'cl.staff_id', 'ss.id')
        .join('service_orders as so', 'cl.service_order_id', 'so.id')
        .leftJoin('service_order_items as soi', 'cl.service_order_item_id', 'soi.id')
        .select(
          'cl.*',
          'ss.name as staff_name',
          'ss.staff_code',
          'ss.role_title',
          'so.order_number',
          'so.customer_name',
          'so.asset_identifier',
          'soi.item_name as service_name'
        )
        .orderBy('cl.created_at', 'desc')
        .limit(Number(limit));

      if (staff_id) {
        query = query.where('cl.staff_id', staff_id);
      }
      if (status) {
        query = query.where('cl.status', status);
      }

      const logs = await query;
      res.json({ success: true, logs });
    } catch (err) {
      next(err);
    }
  }

  // 3. Payout / Settle
  static async settlePayout(req, res, next) {
    try {
      const { staff_id, log_ids = [] } = req.body;
      if (!staff_id) {
        return res.status(400).json({ success: false, message: 'Staff ID wajib disertakan' });
      }

      const result = await CommissionService.settlePayout(staff_id, log_ids);
      res.json({
        success: true,
        message: `Pencairan komisi berhasil diselesaikan untuk ${result.count} data pengerjaan.`,
        result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CommissionController;
