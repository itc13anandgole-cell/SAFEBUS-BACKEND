const express = require('express');
const router = express.Router();
const { getBuses, createBus } = require('../controllers/busController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/', rbacMiddleware(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT', 'DRIVER']), getBuses);
router.post('/', rbacMiddleware(['SCHOOL_ADMIN']), createBus);

module.exports = router;
