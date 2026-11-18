const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/ServiceController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/resources', ServiceController.getResources);
router.get('/staff', ServiceController.getStaff);
router.post('/check-collision', ServiceController.checkCollision);

router.get('/orders', ServiceController.getOrders);
router.get('/orders/:id', ServiceController.getOrderDetail);
router.post('/orders', ServiceController.createOrder);
router.put('/orders/:id/status', ServiceController.updateStatus);
router.post('/orders/:id/items', ServiceController.addItem);

module.exports = router;
