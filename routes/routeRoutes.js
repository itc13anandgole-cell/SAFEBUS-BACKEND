const express = require('express');
const router = express.Router();
const { getRoutes, createRoute, assignStudentToBus } = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/', rbacMiddleware(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT', 'DRIVER']), getRoutes);
router.post('/', rbacMiddleware(['SCHOOL_ADMIN']), createRoute);
router.post('/assign-student', rbacMiddleware(['SCHOOL_ADMIN']), assignStudentToBus);

module.exports = router;
