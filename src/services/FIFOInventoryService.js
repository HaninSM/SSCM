const db = require('../config/database');

class FIFOInventoryService {
  /**
   * Deduct stock for an item using First-In, First-Out (FIFO)
   * Must be called within a Knex transaction (trx)
   */
  static async deductFIFO(itemId, qtyToDeduct, trx) {
    const knexClient = trx || db;
    let remainingNeeded = Number(qtyToDeduct);
    let totalCogs = 0;

    // Fetch batches with remaining quantity > 0, ordered by received_date ASC, id ASC
    const batches = await knexClient('inventory_batches')
      .where('item_id', itemId)
      .where('remaining_quantity', '>', 0)
      .orderBy('received_date', 'asc')
      .orderBy('id', 'asc');

    for (const batch of batches) {
      if (remainingNeeded <= 0) break;

      const availableInBatch = Number(batch.remaining_quantity);
      const deductFromThis = Math.min(availableInBatch, remainingNeeded);

      const newRemaining = availableInBatch - deductFromThis;
      await knexClient('inventory_batches')
        .where('id', batch.id)
        .update({ remaining_quantity: newRemaining });

      totalCogs += deductFromThis * Number(batch.cost_per_unit);
      remainingNeeded -= deductFromThis;
    }

    if (remainingNeeded > 0) {
      // Stock shortage: if physical stock in batches was insufficient, log warning or allow negative
      console.warn(`[FIFO WARNING] Item ID ${itemId} memiliki kekurangan stok batch sebanyak ${remainingNeeded} unit.`);
    }

    // Update aggregate stock in items table
    await knexClient('items')
      .where('id', itemId)
      .decrement('stock', qtyToDeduct);

    return {
      itemId,
      deductedQty: qtyToDeduct,
      totalCogs,
      averageCogsPerUnit: qtyToDeduct > 0 ? totalCogs / qtyToDeduct : 0
    };
  }
}

module.exports = FIFOInventoryService;
