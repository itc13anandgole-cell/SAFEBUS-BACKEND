const express = require('express');
const router = express.Router();
const { login, registerParent, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register-parent', registerParent);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
