const dbModel = require('../models/dbModel');

const getRoutes = async (req, res, next) => {
  try {
    const school_id = req.user.school_id;
    const routes = await dbModel.getRoutesBySchool(school_id);
    res.status(200).json({ success: true, routes });
  } catch (err) {
    next(err);
  }
};

const createRoute = async (req, res, next) => {
  try {
    const school_id = req.user.school_id;
    const { route_name, route_code, start_location, end_location, distance_km, estimated_minutes, stops } = req.body;
    if (!route_name || !route_code) {
      return res.status(400).json({ success: false, message: 'Route name and route code are required.' });
    }
    const route = await dbModel.createRoute(
      { school_id, route_name, route_code, start_location, end_location, distance_km, estimated_minutes },
      stops || []
    );
    res.status(201).json({ success: true, message: 'Route created successfully', route });
  } catch (err) {
    next(err);
  }
};

const assignStudentToBus = async (req, res, next) => {
  try {
    const { student_id, bus_id, route_id, pickup_stop_id, drop_stop_id } = req.body;
    if (!student_id || !bus_id || !route_id) {
      return res.status(400).json({ success: false, message: 'Student ID, Bus ID, and Route ID are required.' });
    }
    const assignment = await dbModel.assignStudentToBus({ student_id, bus_id, route_id, pickup_stop_id, drop_stop_id });
    res.status(201).json({ success: true, message: 'Student assigned to bus successfully', assignment });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRoutes,
  createRoute,
  assignStudentToBus
};
