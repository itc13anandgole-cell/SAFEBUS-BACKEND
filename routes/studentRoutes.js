const express = require('express');
const router = express.Router();
const { getStudents, createStudent } = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/', rbacMiddleware(['SCHOOL_ADMIN', 'SUPER_ADMIN']), getStudents);
router.post('/', rbacMiddleware(['SCHOOL_ADMIN']), createStudent);

module.exports = router;
