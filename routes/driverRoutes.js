const express = require('express');
const router = express.Router();
const {
  getDrivers,
  createDriver,
  getMyDriverDetails,
  uploadMyProfile,
  getMyProfile,
  getDriversForVerification,
  getDriverVerification,
  updateVerificationStatus
} = require('../controllers/driverController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

// Driver self-routes
router.get('/my-details', rbacMiddleware(['DRIVER']), getMyDriverDetails);
router.get('/my-profile', rbacMiddleware(['DRIVER']), getMyProfile);
router.post('/my-profile/upload', rbacMiddleware(['DRIVER']), uploadMyProfile);

// Admin routes
router.get('/', rbacMiddleware(['SCHOOL_ADMIN', 'SUPER_ADMIN']), getDrivers);
router.post('/', rbacMiddleware(['SCHOOL_ADMIN']), createDriver);
router.get('/verification-list', rbacMiddleware(['SCHOOL_ADMIN', 'SUPER_ADMIN']), getDriversForVerification);
router.get('/:driver_id/verification', rbacMiddleware(['SCHOOL_ADMIN', 'SUPER_ADMIN']), getDriverVerification);
router.patch('/:driver_id/verify', rbacMiddleware(['SCHOOL_ADMIN', 'SUPER_ADMIN']), updateVerificationStatus);

module.exports = router;
