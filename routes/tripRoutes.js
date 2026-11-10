const express = require('express');
const router = express.Router();
const { startTrip, endTrip, recordGpsLocation, getActiveTrips, getTripHistory } = require('../controllers/tripController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.post('/start', rbacMiddleware(['DRIVER']), startTrip);
router.post('/end/:trip_id', rbacMiddleware(['DRIVER']), endTrip);
router.post('/gps', rbacMiddleware(['DRIVER']), recordGpsLocation);
router.get('/active', getActiveTrips);
router.get('/history', getTripHistory);

module.exports = router;
