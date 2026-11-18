const WarrantyService = require('../services/WarrantyService');

class WarrantyController {
  static async checkValidity(req, res, next) {
    try {
      const { original_order_id, claim_odometer } = req.query;
      const result = await WarrantyService.checkValidity({
        originalOrderId: original_order_id,
        claimOdometer: claim_odometer
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getClaims(req, res, next) {
    try {
      const { status } = req.query;
      const claims = await WarrantyService.getClaims({ status });
      res.json({ success: true, claims });
    } catch (err) {
      next(err);
    }
  }

  static async submitClaim(req, res, next) {
    try {
      const claim = await WarrantyService.submitClaim(req.body);
      res.status(201).json({ success: true, message: 'Klaim garansi berhasil didaftarkan', claim });
    } catch (err) {
      next(err);
    }
  }

  static async inspectClaim(req, res, next) {
    try {
      const { id } = req.params;
      const claim = await WarrantyService.inspectClaim(id, req.body);
      res.json({ success: true, message: 'Hasil inspeksi klaim berhasil disimpan', claim });
    } catch (err) {
      next(err);
    }
  }

  static async approveClaim(req, res, next) {
    try {
      const { id } = req.params;
      const result = await WarrantyService.approveClaim(id, {
        ...req.body,
        approved_by_user_id: req.user ? req.user.id : null
      });
      res.json({
        success: true,
        message: 'Klaim disetujui! SPK Pengerjaan Ulang Rp 0 telah diterbitkan.',
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  static async rejectClaim(req, res, next) {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const claim = await WarrantyService.rejectClaim(id, rejection_reason);
      res.json({ success: true, message: 'Klaim garansi telah ditolak', claim });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = WarrantyController;
