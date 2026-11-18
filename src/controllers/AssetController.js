const AssetService = require('../services/AssetService');

class AssetController {
  static async search(req, res, next) {
    try {
      const { q } = req.query;
      const assets = await AssetService.searchAsset(q || '');
      res.json({ success: true, assets });
    } catch (err) {
      next(err);
    }
  }

  static async getDetail(req, res, next) {
    try {
      const { id } = req.params;
      const asset = await AssetService.getAssetDetail(id);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Data aset tidak ditemukan' });
      }
      res.json({ success: true, asset });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AssetController;
