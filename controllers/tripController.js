const dbModel = require('../models/dbModel');
const { sendPushNotification } = require('../services/fcmService');

const startTrip = async (req, res, next) => {
  try {
    const { bus_id, route_id, trip_type } = req.body;
    const driverDetails = await dbModel.getDriverDetailsByUserId(req.user.id);

    if (!driverDetails || !driverDetails.driver) {
      return res.status(404).json({ success: false, message: 'Driver details not found.' });
    }

    const driver_id = driverDetails.driver.id;
    const targetBusId = bus_id || (driverDetails.bus ? driverDetails.bus.id : 1);
    const targetRouteId = route_id || (driverDetails.route ? driverDetails.route.id : 1);

    const trip = await dbModel.startTrip({
      bus_id: targetBusId,
      driver_id,
      route_id: targetRouteId,
      trip_type: trip_type || 'MORNING_PICKUP'
    });

    // Notify connected Socket server instance via req.app.get('io') if attached
    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${trip.id}`).emit('server:tripStarted', {
        trip_id: trip.id,
        bus_id: targetBusId,
        message: 'Your child\'s school bus trip has started.'
      });
    }

    // Broadcast push notification stub
    sendPushNotification(null, 'Trip Started', `Your child's school bus (BUS-01) has started its trip.`);

    res.status(200).json({ success: true, message: 'Trip started successfully', trip });
  } catch (err) {
    next(err);
  }
};

const endTrip = async (req, res, next) => {
  try {
    const { trip_id } = req.params;
    const trip = await dbModel.endTrip(trip_id);

    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${trip_id}`).emit('server:tripEnded', {
        trip_id: Number(trip_id),
        message: 'Trip completed safely at destination.'
      });
    }

    sendPushNotification(null, 'Trip Completed', 'Your child\'s school bus trip has ended safely.');

    res.status(200).json({ success: true, message: 'Trip completed successfully', trip });
  } catch (err) {
    next(err);
  }
};

const recordGpsLocation = async (req, res, next) => {
  try {
    const { trip_id, bus_id, driver_id, latitude, longitude, speed, heading } = req.body;
    const location = await dbModel.saveGpsLocation({ trip_id, bus_id, driver_id, latitude, longitude, speed, heading });

    const io = req.app.get('io');
    if (io && trip_id) {
      io.to(`trip_${trip_id}`).emit('server:busLocationUpdated', location);
    }

    res.status(200).json({ success: true, location });
  } catch (err) {
    next(err);
  }
};

const getActiveTrips = async (req, res, next) => {
  try {
    const school_id = req.user.school_id || 1;
    const activeTrips = await dbModel.getActiveTripsForSchool(school_id);
    res.status(200).json({ success: true, activeTrips });
  } catch (err) {
    next(err);
  }
};

const getTripHistory = async (req, res, next) => {
  try {
    const history = await dbModel.getTripHistoryForUser(req.user.id, req.user.role);
    res.status(200).json({ success: true, history });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startTrip,
  endTrip,
  recordGpsLocation,
  getActiveTrips,
  getTripHistory
};
