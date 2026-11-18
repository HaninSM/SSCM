const db = require('../config/database');
const FIFOInventoryService = require('./FIFOInventoryService');

class WarrantyService {
  /**
   * Dual-Limit Warranty Check (Days vs Odometer KM)
   */
  static async checkValidity({ originalOrderId, claimOdometer = 0, claimDate = new Date() }) {
    const order = await db('service_orders').where({ id: originalOrderId }).first();
    if (!order) {
      return { isValid: false, reason: 'SPK asal tidak ditemukan' };
    }

    if (order.status !== 'COMPLETED') {
      return { isValid: false, reason: 'SPK asal belum berstatus lunas / completed' };
    }

    const claimTime = new Date(claimDate).getTime();
    const serviceFinishTime = new Date(order.actual_end || order.scheduled_end).getTime();
    const daysElapsed = Math.floor((claimTime - serviceFinishTime) / (1000 * 60 * 60 * 24));

    // Default policy limits
    const maxDays = order.business_type === 'WORKSHOP' ? 14 : 7;
    const maxKm = order.business_type === 'WORKSHOP' ? 1000 : 0;

    const baseKm = Number(order.odometer_km || 0);
    const currentKm = Number(claimOdometer || 0);
    const kmElapsed = currentKm > baseKm ? currentKm - baseKm : 0;

    // 1. Check Days limit
    if (daysElapsed > maxDays) {
      return {
        isValid: false,
        daysElapsed,
        maxDays,
        kmElapsed,
        maxKm,
        reason: `Masa garansi waktu telah kedaluwarsa (${daysElapsed} hari berlalu, batas maksimal ${maxDays} hari).`
      };
    }

    // 2. Check Odometer limit (Bengkel only)
    if (order.business_type === 'WORKSHOP' && maxKm > 0 && kmElapsed > maxKm) {
      return {
        isValid: false,
        daysElapsed,
        maxDays,
        kmElapsed,
        maxKm,
        reason: `Masa garansi jarak tempuh telah terlampaui (${kmElapsed} KM ditempuh, batas maksimal ${maxKm} KM).`
      };
    }

    return {
      isValid: true,
      daysElapsed,
      maxDays,
      kmElapsed,
      maxKm,
      remainingDays: maxDays - daysElapsed,
      remainingKm: maxKm > 0 ? maxKm - kmElapsed : null,
      message: 'Garansi aktif dan memenuhi syarat klaim.'
    };
  }

  /**
   * Submit new warranty claim
   */
  static async submitClaim(data) {
    const {
      original_service_order_id,
      claim_odometer = 0,
      complaint_reason
    } = data;

    const order = await db('service_orders').where({ id: original_service_order_id }).first();
    if (!order) {
      const err = new Error('SPK asal tidak ditemukan');
      err.status = 404;
      throw err;
    }

    // Check validity
    const validity = await this.checkValidity({
      originalOrderId: original_service_order_id,
      claimOdometer: claim_odometer
    });

    if (!validity.isValid && !data.manager_override) {
      const err = new Error(`Klaim tidak dapat diajukan: ${validity.reason}`);
      err.status = 400;
      throw err;
    }

    // Generate claim number (e.g. CLM-202611-0002)
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const countRes = await db('warranty_claims').count('id as cnt').first();
    const claimNumber = `CLM-${dateStr}-${String(Number(countRes.cnt) + 1).padStart(4, '0')}`;

    const [claim] = await db('warranty_claims').insert({
      claim_number: claimNumber,
      original_service_order_id,
      customer_asset_id: order.customer_asset_id || null,
      claim_date: db.fn.now(),
      claim_odometer: Number(claim_odometer || 0),
      complaint_reason,
      status: 'SUBMITTED'
    }).returning('*');

    return claim;
  }

  /**
   * Inspect warranty claim by QC / Supervisor
   */
  static async inspectClaim(id, { inspection_result, root_cause }) {
    const claim = await db('warranty_claims').where({ id }).first();
    if (!claim) {
      const err = new Error('Klaim garansi tidak ditemukan');
      err.status = 404;
      throw err;
    }

    await db('warranty_claims').where({ id }).update({
      inspection_result,
      root_cause, // 'WORKMANSHIP_ERROR', 'DEFECTIVE_PART', 'CUSTOMER_MISUSE'
      status: 'INSPECTING',
      updated_at: db.fn.now()
    });

    return await db('warranty_claims').where({ id }).first();
  }

  /**
   * Approve claim, generate Zero-Cost SPK, deduct parts via FIFO, and book QA Expense
   */
  static async approveClaim(id, approvalData) {
    const {
      approved_by_user_id,
      replacement_parts = [], // array of { item_id, qty, serial_number }
      resource_id,
      staff_id,
      notes
    } = approvalData;

    const claim = await db('warranty_claims').where({ id }).first();
    if (!claim) {
      const err = new Error('Klaim garansi tidak ditemukan');
      err.status = 404;
      throw err;
    }

    const originalOrder = await db('service_orders').where({ id: claim.original_service_order_id }).first();

    return await db.transaction(async (trx) => {
      // 1. Resolve valid resource_id and staff_id to satisfy foreign key constraints
      let finalResourceId = resource_id;
      if (finalResourceId) {
        const resExists = await trx('service_resources').where({ id: finalResourceId }).first();
        if (!resExists) finalResourceId = null;
      }
      if (!finalResourceId) {
        const origRes = await trx('service_resources').where({ id: originalOrder.resource_id }).first();
        if (origRes) {
          finalResourceId = origRes.id;
        } else {
          const fallbackRes = await trx('service_resources').where({ business_type: originalOrder.business_type }).first();
          finalResourceId = fallbackRes ? fallbackRes.id : null;
        }
      }

      let finalStaffId = staff_id;
      if (finalStaffId) {
        const staffExists = await trx('service_staff').where({ id: finalStaffId }).first();
        if (!staffExists) finalStaffId = null;
      }
      if (!finalStaffId) {
        const origStaff = await trx('service_staff').where({ id: originalOrder.staff_id }).first();
        if (origStaff) {
          finalStaffId = origStaff.id;
        } else {
          const fallbackStaff = await trx('service_staff').where({ business_type: originalOrder.business_type }).first();
          finalStaffId = fallbackStaff ? fallbackStaff.id : null;
        }
      }

      // 2. Generate Zero-Cost Service Order (SPK Garansi Rp 0)
      const prefix = originalOrder.business_type === 'SALON' ? 'SPK-GAR-S' : 'SPK-GAR-W';
      const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
      const countRes = await trx('service_orders').count('id as cnt').first();
      const reworkOrderNum = `${prefix}${dateStr}-${String(Number(countRes.cnt) + 1).padStart(4, '0')}`;

      const now = new Date();
      const schedStart = now.toISOString();
      const schedEnd = new Date(now.getTime() + 60 * 60000).toISOString();

      const [reworkOrder] = await trx('service_orders').insert({
        order_number: reworkOrderNum,
        business_type: originalOrder.business_type,
        customer_name: originalOrder.customer_name,
        customer_phone: originalOrder.customer_phone,
        asset_identifier: originalOrder.asset_identifier,
        customer_asset_id: originalOrder.customer_asset_id,
        scheduled_start: schedStart,
        scheduled_end: schedEnd,
        resource_id: finalResourceId,
        staff_id: finalStaffId,
        status: 'QUEUED',
        notes: `[GARANSI KLAIM ${claim.claim_number}]: ${notes || claim.complaint_reason}`,
        is_warranty_rework: true,
        total_service_amount: 0,
        total_consumable_amount: 0,
        grand_total: 0 // FREE OF CHARGE TO CUSTOMER
      }).returning('*');

      // Find original service item or any available service item in items table
      const origServiceItem = await trx('service_order_items')
        .where({ service_order_id: originalOrder.id, item_type: 'SERVICE' })
        .first();
      let defaultItemId = origServiceItem ? origServiceItem.item_id : null;
      if (!defaultItemId) {
        const anyService = await trx('items').where({ type: 'SERVICE' }).first();
        defaultItemId = anyService ? anyService.id : 1;
      }

      // Add zero-tariff service line
      await trx('service_order_items').insert({
        service_order_id: reworkOrder.id,
        item_id: defaultItemId,
        item_type: 'SERVICE',
        item_name: `Pengerjaan Ulang Garansi (${claim.claim_number})`,
        qty: 1,
        unit_price: 0,
        subtotal: 0,
        staff_id: finalStaffId
      });

      // 2. Process Replacement Parts (if any): Deduct FIFO & book to expenses
      let totalPartCost = 0;
      for (const p of replacement_parts) {
        const item = await trx('items').where({ id: p.item_id }).first();
        if (item) {
          // FIFO deduction
          const fifoResult = await FIFOInventoryService.deductFIFO(p.item_id, p.qty || 1, trx);
          totalPartCost += Number(fifoResult.totalCogs);

          // Add to warranty claim items
          await trx('warranty_claim_items').insert({
            warranty_claim_id: claim.id,
            item_id: p.item_id,
            qty: p.qty || 1,
            cost_price: fifoResult.averageCogsPerUnit,
            serial_number: p.serial_number || null,
            supplier_claim_status: claim.root_cause === 'DEFECTIVE_PART' ? 'RETURNED_TO_VENDOR' : 'NONE'
          });

          // Add to rework order items as Rp 0 line for receipt documentation
          await trx('service_order_items').insert({
            service_order_id: reworkOrder.id,
            item_id: p.item_id,
            item_type: 'CONSUMABLE',
            item_name: `[Ganti Garansi Rp 0] ${item.name}`,
            qty: p.qty || 1,
            unit_price: 0,
            subtotal: 0
          });
        }
      }

      // 3. Book Quality Assurance Expense to `expenses` table
      if (totalPartCost > 0) {
        const expCount = await trx('expenses').count('id as cnt').first();
        const expNum = `EXP-GAR-${dateStr}-${String(Number(expCount.cnt) + 1).padStart(4, '0')}`;

        await trx('expenses').insert({
          expense_number: expNum,
          category: 'Beban Klaim Garansi & Mutu',
          amount: totalPartCost,
          payment_method: 'NON_CASH_EXPENSE',
          notes: `Alokasi HPP penggantian part gratis untuk Klaim ${claim.claim_number} (SPK ${reworkOrder.order_number})`,
          ref_type: 'WARRANTY_CLAIM',
          ref_id: claim.id
        });
      }

      // 4. Update claim record
      await trx('warranty_claims').where({ id: claim.id }).update({
        status: 'APPROVED',
        total_claim_cost: totalPartCost,
        zero_cost_service_order_id: reworkOrder.id,
        approved_by_user_id: approved_by_user_id || null,
        updated_at: db.fn.now()
      });

      return {
        claim: await trx('warranty_claims').where({ id: claim.id }).first(),
        rework_order: reworkOrder,
        total_claim_cost: totalPartCost
      };
    });
  }

  /**
   * Reject claim
   */
  static async rejectClaim(id, rejectionReason) {
    const claim = await db('warranty_claims').where({ id }).first();
    if (!claim) {
      const err = new Error('Klaim garansi tidak ditemukan');
      err.status = 404;
      throw err;
    }

    await db('warranty_claims').where({ id }).update({
      status: 'REJECTED',
      rejection_reason: rejectionReason,
      updated_at: db.fn.now()
    });

    return await db('warranty_claims').where({ id }).first();
  }

  /**
   * List warranty claims with filters
   */
  static async getClaims(filters = {}) {
    let query = db('warranty_claims as wc')
      .join('service_orders as so', 'wc.original_service_order_id', 'so.id')
      .leftJoin('customer_assets as ca', 'wc.customer_asset_id', 'ca.id')
      .leftJoin('service_orders as rso', 'wc.zero_cost_service_order_id', 'rso.id')
      .select(
        'wc.*',
        'so.order_number as original_order_number',
        'so.business_type',
        'so.customer_name',
        'so.customer_phone',
        'so.asset_identifier',
        'so.scheduled_end as original_service_date',
        'ca.brand_model',
        'rso.order_number as rework_order_number'
      )
      .orderBy('wc.created_at', 'desc');

    if (filters.status) {
      query = query.where('wc.status', filters.status);
    }

    const claims = await query;
    for (const c of claims) {
      c.rework_service_order_id = c.zero_cost_service_order_id;
      c.items = await db('warranty_claim_items as wci')
        .join('items as i', 'wci.item_id', 'i.id')
        .where('wci.warranty_claim_id', c.id)
        .select('wci.*', 'i.name as item_name', 'i.sku');
    }

    return claims;
  }
}

module.exports = WarrantyService;
