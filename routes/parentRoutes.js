const express = require('express');
const router = express.Router();
const { getParents, getMyChildDetails } = require('../controllers/parentController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/', rbacMiddleware(['SCHOOL_ADMIN', 'SUPER_ADMIN']), getParents);
router.get('/my-child', rbacMiddleware(['PARENT']), getMyChildDetails);

module.exports = router;
