const express = require('express');
const router = express.Router();
const { getRouteDirections, searchLocation } = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/route', getRouteDirections);
router.get('/geocode', searchLocation);

module.exports = router;
