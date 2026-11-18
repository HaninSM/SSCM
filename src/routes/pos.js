const express = require('express');
const router = express.Router();
const POSController = require('../controllers/POSController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/service-orders', POSController.getPayableOrders);
router.post('/checkout', POSController.checkout);
router.get('/transactions', POSController.getTransactions);

module.exports = router;
