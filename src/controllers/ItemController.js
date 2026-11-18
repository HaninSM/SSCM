const db = require('../config/database');

class ItemController {
  static async getItems(req, res, next) {
    try {
      const { business_type, type, search } = req.query;
      let query = db('items').where({ is_active: true });

      if (business_type && business_type !== 'ALL') {
        query = query.where((b) => {
          b.where('business_type', business_type).orWhere('business_type', 'ALL');
        });
      }
      if (type) {
        query = query.where({ type });
      }
      if (search) {
        query = query.where((b) => {
          b.where('name', 'like', `%${search}%`)
           .orWhere('sku', 'like', `%${search}%`)
           .orWhere('category', 'like', `%${search}%`);
        });
      }

      const items = await query.orderBy('name', 'asc');
      res.json({ success: true, items });
    } catch (err) {
      next(err);
    }
  }

  static async getItemBatches(req, res, next) {
    try {
      const { id } = req.params;
      const batches = await db('inventory_batches')
        .where({ item_id: id })
        .orderBy('received_date', 'asc');
      res.json({ success: true, batches });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ItemController;
