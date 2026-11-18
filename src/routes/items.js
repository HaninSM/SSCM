const express = require('express');
const router = express.Router();
const ItemController = require('../controllers/ItemController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', ItemController.getItems);
router.get('/:id/batches', ItemController.getItemBatches);

module.exports = router;
