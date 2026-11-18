const db = require('../config/database');

class CollisionEngineService {
  /**
   * Check if a physical resource (bay/chair) or staff (mechanic/therapist)
   * has a collision in time range [targetStart, targetEnd]
   */
  static async checkCollision({ resourceId, staffId, targetStart, targetEnd, excludeOrderId = null }) {
    const startIso = new Date(targetStart).toISOString();
    const endIso = new Date(targetEnd).toISOString();

    if (new Date(startIso) >= new Date(endIso)) {
      return {
        hasCollision: true,
        reason: 'Waktu selesai harus lebih besar daripada waktu mulai'
      };
    }

    // Query active orders (not completed, not cancelled) that overlap in time
    let query = db('service_orders')
      .whereNotIn('status', ['COMPLETED', 'CANCELLED'])
      .where((builder) => {
        // Overlap formula: (existing_start < targetEnd) AND (existing_end > targetStart)
        builder.where('scheduled_start', '<', endIso)
               .andWhere('scheduled_end', '>', startIso);
      });

    if (excludeOrderId) {
      query = query.whereNot('id', excludeOrderId);
    }

    const overlappingOrders = await query
      .select('id', 'order_number', 'resource_id', 'staff_id', 'scheduled_start', 'scheduled_end', 'customer_name', 'status');

    // 1. Check physical resource collision
    if (resourceId) {
      const resourceConflict = overlappingOrders.find(o => Number(o.resource_id) === Number(resourceId));
      if (resourceConflict) {
        const resource = await db('service_resources').where({ id: resourceId }).first();
        return {
          hasCollision: true,
          conflictType: 'RESOURCE',
          conflictOrder: resourceConflict,
          reason: `Fasilitas "${resource ? resource.name : 'ID ' + resourceId}" sudah terpakai pada rentang jam tersebut oleh order ${resourceConflict.order_number} (${resourceConflict.customer_name}).`
        };
      }
    }

    // 2. Check staff collision
    if (staffId) {
      const staffConflict = overlappingOrders.find(o => Number(o.staff_id) === Number(staffId));
      if (staffConflict) {
        const staff = await db('service_staff').where({ id: staffId }).first();
        return {
          hasCollision: true,
          conflictType: 'STAFF',
          conflictOrder: staffConflict,
          reason: `Staf/Teknisi "${staff ? staff.name : 'ID ' + staffId}" sudah ditugaskan pada jam tersebut pada order ${staffConflict.order_number} (${staffConflict.customer_name}).`
        };
      }
    }

    return {
      hasCollision: false
    };
  }
}

module.exports = CollisionEngineService;
