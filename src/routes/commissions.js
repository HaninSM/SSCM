const express = require('express');
const router = express.Router();
const CommissionController = require('../controllers/CommissionController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

router.use(authMiddleware);

router.get('/summary', CommissionController.getSummary);
router.get('/logs', CommissionController.getLogs);
router.post('/payout', rbacMiddleware(['admin']), CommissionController.settlePayout);

module.exports = router;
