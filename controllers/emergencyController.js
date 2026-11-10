const dbModel = require('../models/dbModel');
const { sendPushNotification } = require('../services/fcmService');

const triggerSos = async (req, res, next) => {
  try {
    const { trip_id, bus_id, driver_id, school_id, latitude, longitude, message } = req.body;
    
    const driverDetails = await dbModel.getDriverDetailsByUserId(req.user.id);
    const targetDriverId = driverDetails?.driver?.id || driver_id || 1;
    const targetSchoolId = driverDetails?.driver?.school_id || school_id || req.user.school_id || 1;
    const targetBusId = driverDetails?.bus?.id || bus_id || 1;

    const alert = await dbModel.createEmergencyAlert({
      trip_id: trip_id || driverDetails?.active_trip?.id || null,
      bus_id: targetBusId,
      driver_id: targetDriverId,
      school_id: targetSchoolId,
      emergency_type: 'SOS',
      message: message || 'EMERGENCY SOS BUTTON TRIGGERED BY DRIVER!',
      latitude,
      longitude
    });

    const io = req.app.get('io');
    if (io) {
      // Broadcast SOS to entire school channel and trip room
      io.emit('server:emergencyAlert', {
        ...alert,
        bus_number: driverDetails?.bus?.bus_number || 'BUS-01',
        driver_name: driverDetails?.driver?.full_name || req.user.full_name
      });
    }

    sendPushNotification(null, '🚨 EMERGENCY SOS ALERT', `SOS alert received from Bus ${driverDetails?.bus?.bus_number || 'BUS-01'}.`);

    res.status(201).json({ success: true, message: 'Emergency SOS alert broadcasted successfully', alert });
  } catch (err) {
    next(err);
  }
};

const reportBreakdown = async (req, res, next) => {
  try {
    const { trip_id, bus_id, driver_id, school_id, latitude, longitude, reason } = req.body;

    const driverDetails = await dbModel.getDriverDetailsByUserId(req.user.id);
    const targetDriverId = driverDetails?.driver?.id || driver_id || 1;
    const targetSchoolId = driverDetails?.driver?.school_id || school_id || req.user.school_id || 1;
    const targetBusId = driverDetails?.bus?.id || bus_id || 1;

    const alert = await dbModel.createEmergencyAlert({
      trip_id: trip_id || driverDetails?.active_trip?.id || null,
      bus_id: targetBusId,
      driver_id: targetDriverId,
      school_id: targetSchoolId,
      emergency_type: 'BREAKDOWN',
      message: reason || 'Bus mechanical breakdown reported by driver.',
      latitude,
      longitude
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('server:emergencyAlert', alert);
    }

    sendPushNotification(null, '⚠️ Bus Breakdown Alert', `Bus ${driverDetails?.bus?.bus_number || 'BUS-01'} reported a breakdown: ${reason || 'Mechanical issue'}`);

    res.status(201).json({ success: true, message: 'Bus breakdown reported', alert });
  } catch (err) {
    next(err);
  }
};

const getEmergencyAlerts = async (req, res, next) => {
  try {
    const school_id = req.user.role === 'SUPER_ADMIN' ? null : (req.user.school_id || 1);
    const alerts = await dbModel.getEmergencyAlerts(school_id);
    res.status(200).json({ success: true, alerts });
  } catch (err) {
    next(err);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const { alert_id } = req.params;
    const alert = await dbModel.resolveEmergencyAlert(alert_id);
    res.status(200).json({ success: true, message: 'Emergency alert marked resolved', alert });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  triggerSos,
  reportBreakdown,
  getEmergencyAlerts,
  resolveAlert
};
