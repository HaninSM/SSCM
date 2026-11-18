const db = require('../config/database');

class AssetService {
  /**
   * Search customer asset by plate number, customer name, or phone number
   */
  static async searchAsset(queryStr) {
    if (!queryStr) return [];

    const q = `%${queryStr.trim()}%`;
    const assets = await db('customer_assets')
      .where('identifier', 'like', q)
      .orWhere('customer_name', 'like', q)
      .orWhere('customer_phone', 'like', q)
      .orderBy('last_service_date', 'desc');

    for (const asset of assets) {
      // Fetch full service orders history for this asset
      asset.service_history = await db('service_orders as so')
        .leftJoin('service_resources as sr', 'so.resource_id', 'sr.id')
        .leftJoin('service_staff as ss', 'so.staff_id', 'ss.id')
        .where('so.customer_asset_id', asset.id)
        .orWhere('so.asset_identifier', 'like', `%${asset.identifier}%`)
        .select(
          'so.*',
          'sr.name as resource_name',
          'ss.name as staff_name'
        )
        .orderBy('so.scheduled_start', 'desc');

      for (const order of asset.service_history) {
        order.items = await db('service_order_items').where({ service_order_id: order.id });
      }
    }

    return assets;
  }

  /**
   * Get detail of a specific asset
   */
  static async getAssetDetail(id) {
    const asset = await db('customer_assets').where({ id }).first();
    if (!asset) return null;

    asset.service_history = await db('service_orders as so')
      .leftJoin('service_resources as sr', 'so.resource_id', 'sr.id')
      .leftJoin('service_staff as ss', 'so.staff_id', 'ss.id')
      .where('so.customer_asset_id', id)
      .select(
        'so.*',
        'sr.name as resource_name',
        'ss.name as staff_name'
      )
      .orderBy('so.scheduled_start', 'desc');

    for (const order of asset.service_history) {
      order.items = await db('service_order_items').where({ service_order_id: order.id });
    }

    return asset;
  }
}

module.exports = AssetService;
