const { getDrivingDirections } = require('../services/orsService');
const { geocodeAddress } = require('../services/nominatimService');

const getRouteDirections = async (req, res, next) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ success: false, message: 'Coordinates array required [ [lng, lat], ... ]' });
    }
    const result = await getDrivingDirections(coordinates);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const searchLocation = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query string q is required' });
    }
    const result = await geocodeAddress(q);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRouteDirections,
  searchLocation
};
