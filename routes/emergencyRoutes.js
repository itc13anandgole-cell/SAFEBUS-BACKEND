const express = require('express');
const router = express.Router();
const { triggerSos, reportBreakdown, getEmergencyAlerts, resolveAlert } = require('../controllers/emergencyController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.post('/sos', rbacMiddleware(['DRIVER']), triggerSos);
router.post('/breakdown', rbacMiddleware(['DRIVER']), reportBreakdown);
router.get('/', rbacMiddleware(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT']), getEmergencyAlerts);
router.patch('/:alert_id/resolve', rbacMiddleware(['SCHOOL_ADMIN', 'SUPER_ADMIN']), resolveAlert);

module.exports = router;
