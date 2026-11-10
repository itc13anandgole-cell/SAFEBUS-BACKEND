const express = require('express');
const router = express.Router();
const { getSchools, getSchoolDetails, createSchool, updateSchoolStatus } = require('../controllers/schoolController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/', rbacMiddleware(['SUPER_ADMIN']), getSchools);
router.get('/:id', rbacMiddleware(['SUPER_ADMIN', 'SCHOOL_ADMIN']), getSchoolDetails);
router.post('/', rbacMiddleware(['SUPER_ADMIN']), createSchool);
router.patch('/:id/status', rbacMiddleware(['SUPER_ADMIN']), updateSchoolStatus);

module.exports = router;
