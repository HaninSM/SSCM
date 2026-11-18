const express = require('express');
const router = express.Router();
const WarrantyController = require('../controllers/WarrantyController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

router.use(authMiddleware);

router.get('/check', WarrantyController.checkValidity);
router.get('/claims', WarrantyController.getClaims);
router.post('/claims', WarrantyController.submitClaim);
router.put('/claims/:id/inspect', WarrantyController.inspectClaim);
router.post('/claims/:id/approve', rbacMiddleware(['admin']), WarrantyController.approveClaim);
router.put('/claims/:id/reject', rbacMiddleware(['admin']), WarrantyController.rejectClaim);

module.exports = router;
