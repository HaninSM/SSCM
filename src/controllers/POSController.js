const db = require('../config/database');
const FIFOInventoryService = require('../services/FIFOInventoryService');
const CommissionService = require('../services/CommissionService');

class POSController {
  /**
   * Get orders that are READY_TO_PAY or IN_PROGRESS ready for billing
   */
  static async getPayableOrders(req, res, next) {
    try {
      const orders = await db('service_orders as so')
        .join('service_resources as sr', 'so.resource_id', 'sr.id')
        .join('service_staff as ss', 'so.staff_id', 'ss.id')
        .whereIn('so.status', ['READY_TO_PAY', 'IN_PROGRESS'])
        .select(
          'so.*',
          'sr.name as resource_name',
          'sr.code as resource_code',
          'ss.name as staff_name'
        )
        .orderBy('so.scheduled_start', 'asc');

      for (const order of orders) {
        order.items = await db('service_order_items').where({ service_order_id: order.id });
      }

      res.json({ success: true, orders });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Atomic POS Checkout with Split Payment, FIFO Inventory Depletion, and Commission Logging
   */
  static async checkout(req, res, next) {
    try {
      const {
        service_order_id,
        customer_name,
        cart_items = [], // extra or combined items
        payments = [], // array of { payment_method: 'CASH'|'TRANSFER'|'QRIS', amount: number, reference_number?: string }
        discount = 0,
        tax = 0
      } = req.body;

      if (!payments || payments.length === 0) {
        return res.status(400).json({ success: false, message: 'Minimal harus ada 1 metode pembayaran' });
      }

      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Perform transaction atomically
      const result = await db.transaction(async (trx) => {
        let order = null;
        let grandTotal = 0;
        let subtotal = 0;

        if (service_order_id) {
          order = await trx('service_orders').where({ id: service_order_id }).first();
          if (!order) {
            throw new Error('Order servis tidak ditemukan');
          }
          if (order.status === 'COMPLETED') {
            throw new Error('Order servis ini telah lunas dibayar sebelumnya');
          }
          subtotal = Number(order.grand_total);
        } else {
          subtotal = cart_items.reduce((sum, item) => sum + (Number(item.price || item.unit_price) * Number(item.qty || 1)), 0);
        }

        grandTotal = subtotal - Number(discount) + Number(tax);

        if (totalPaid < grandTotal) {
          const err = new Error(`Total pembayaran (Rp ${totalPaid.toLocaleString()}) kurang dari grand total (Rp ${grandTotal.toLocaleString()})`);
          err.status = 400;
          throw err;
        }

        const changeAmount = totalPaid - grandTotal;

        // Generate invoice number (e.g. INV-202611-0001)
        const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
        const countRes = await trx('transactions').count('id as cnt').first();
        const invoiceNum = `INV-${dateStr}-${String(Number(countRes.cnt) + 1).padStart(4, '0')}`;

        // 1. Create Transaction
        const [transaction] = await trx('transactions').insert({
          invoice_number: invoiceNum,
          service_order_id: service_order_id || null,
          customer_name: customer_name || (order ? order.customer_name : 'Pelanggan Walk-In'),
          subtotal: subtotal,
          discount: Number(discount),
          tax: Number(tax),
          grand_total: grandTotal,
          total_paid: totalPaid,
          change_amount: changeAmount,
          payment_status: 'PAID',
          cashier_id: req.user ? req.user.id : null
        }).returning('*');

        // 2. Insert Split Payments
        for (const p of payments) {
          await trx('transaction_payments').insert({
            transaction_id: transaction.id,
            payment_method: p.payment_method,
            amount: Number(p.amount),
            reference_number: p.reference_number || null
          });
        }

        // 3. If service_order_id is linked:
        //    a. Deduct FIFO stock for all consumable items in this order
        //    b. Record Staff Commission
        //    c. Mark service order as COMPLETED and free resource
        if (order) {
          const orderItems = await trx('service_order_items').where({ service_order_id: order.id });

          for (const line of orderItems) {
            if (line.item_type === 'CONSUMABLE') {
              await FIFOInventoryService.deductFIFO(line.item_id, line.qty, trx);
            }
          }

          // Record Commissions
          await CommissionService.recordCommissionsForOrder(order.id, trx);

          // Update order status & link transaction
          await trx('service_orders').where({ id: order.id }).update({
            status: 'COMPLETED',
            transaction_id: transaction.id,
            actual_end: db.fn.now(),
            updated_at: db.fn.now()
          });

          // Free resource
          await trx('service_resources').where({ id: order.resource_id }).update({ status: 'AVAILABLE' });
        } else if (cart_items.length > 0) {
          // Direct POS retail sale FIFO deduction
          for (const item of cart_items) {
            if (item.type !== 'SERVICE') {
              await FIFOInventoryService.deductFIFO(item.id, item.qty, trx);
            }
          }
        }

        return { transaction, changeAmount };
      });

      res.json({
        success: true,
        message: 'Transaksi kasir berhasil diselesaikan',
        transaction: result.transaction,
        change_amount: result.changeAmount
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactions(req, res, next) {
    try {
      const { limit = 50 } = req.query;
      const transactions = await db('transactions as t')
        .leftJoin('service_orders as so', 't.service_order_id', 'so.id')
        .leftJoin('users as u', 't.cashier_id', 'u.id')
        .select(
          't.*',
          'so.order_number',
          'so.asset_identifier',
          'u.name as cashier_name'
        )
        .orderBy('t.created_at', 'desc')
        .limit(Number(limit));

      for (const t of transactions) {
        t.payments = await db('transaction_payments').where({ transaction_id: t.id });
      }

      res.json({ success: true, transactions });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = POSController;
