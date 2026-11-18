const db = require('../config/database');
const ServiceOrderService = require('../services/ServiceOrderService');
const CollisionEngineService = require('../services/CollisionEngineService');

class ServiceController {
  // 1. Get resources (bay/lift/chair/bed)
  static async getResources(req, res, next) {
    try {
      const { business_type } = req.query;
      let query = db('service_resources').where({ is_active: true });
      if (business_type) {
        query = query.where({ business_type });
      }
      const resources = await query.orderBy('code', 'asc');
      res.json({ success: true, resources });
    } catch (err) {
      next(err);
    }
  }

  // 2. Get staff (mechanics/therapists)
  static async getStaff(req, res, next) {
    try {
      const { business_type } = req.query;
      let query = db('service_staff').where({ is_active: true });
      if (business_type) {
        query = query.where({ business_type });
      }
      const staff = await query.orderBy('name', 'asc');
      res.json({ success: true, staff });
    } catch (err) {
      next(err);
    }
  }

  // 3. Collision Pre-check endpoint
  static async checkCollision(req, res, next) {
    try {
      const { resource_id, staff_id, scheduled_start, scheduled_end, exclude_order_id } = req.body;
      const result = await CollisionEngineService.checkCollision({
        resourceId: resource_id,
        staffId: staff_id,
        targetStart: scheduled_start,
        targetEnd: scheduled_end,
        excludeOrderId: exclude_order_id
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // 4. Get orders (queue / board)
  static async getOrders(req, res, next) {
    try {
      const { business_type, status, date } = req.query;
      let query = db('service_orders as so')
        .join('service_resources as sr', 'so.resource_id', 'sr.id')
        .join('service_staff as ss', 'so.staff_id', 'ss.id')
        .select(
          'so.*',
          'sr.name as resource_name',
          'sr.code as resource_code',
          'sr.resource_type',
          'ss.name as staff_name',
          'ss.staff_code',
          'ss.role_title'
        );

      if (business_type && business_type !== 'ALL') {
        query = query.where('so.business_type', business_type);
      }
      if (status) {
        const statuses = status.split(',');
        query = query.whereIn('so.status', statuses);
      }
      if (date) {
        query = query.whereRaw("date(so.scheduled_start) = date(?)", [date]);
      }

      const orders = await query.orderBy('so.scheduled_start', 'asc');

      // Attach items for each order
      for (const order of orders) {
        order.items = await db('service_order_items').where({ service_order_id: order.id });
      }

      res.json({ success: true, orders });
    } catch (err) {
      next(err);
    }
  }

  // 5. Get order detail
  static async getOrderDetail(req, res, next) {
    try {
      const { id } = req.params;
      const order = await db('service_orders as so')
        .join('service_resources as sr', 'so.resource_id', 'sr.id')
        .join('service_staff as ss', 'so.staff_id', 'ss.id')
        .where('so.id', id)
        .select(
          'so.*',
          'sr.name as resource_name',
          'sr.code as resource_code',
          'ss.name as staff_name',
          'ss.staff_code'
        )
        .first();

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
      }

      order.items = await db('service_order_items').where({ service_order_id: id });
      res.json({ success: true, order });
    } catch (err) {
      next(err);
    }
  }

  // 6. Create order / booking
  static async createOrder(req, res, next) {
    try {
      const order = await ServiceOrderService.createOrder(req.body);
      res.status(201).json({ success: true, message: 'Order servis berhasil dibuat', order });
    } catch (err) {
      next(err);
    }
  }

  // 7. Update status
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await ServiceOrderService.updateStatus(id, status);
      res.json({ success: true, message: `Status order berhasil diubah menjadi ${status}`, order });
    } catch (err) {
      next(err);
    }
  }

  // 8. Add item (part/service) to order
  static async addItem(req, res, next) {
    try {
      const { id } = req.params;
      const order = await ServiceOrderService.addItemToOrder(id, req.body);
      res.json({ success: true, message: 'Item berhasil ditambahkan ke order', order });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ServiceController;
