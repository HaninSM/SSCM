const express = require('express');
const router = express.Router();
const AssetController = require('../controllers/AssetController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/search', AssetController.search);
router.get('/:id', AssetController.getDetail);

module.exports = router;
