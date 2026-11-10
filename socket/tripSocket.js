const { verifyToken } = require('../config/jwt');
const dbModel = require('../models/dbModel');

const setupSocketHandlers = (io) => {
  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!token) {
        // Allow unauthenticated fallback for development test sockets if token missing, but attach guest
        socket.user = { id: 0, role: 'GUEST', full_name: 'Guest User' };
        return next();
      }

      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      const decoded = verifyToken(cleanToken);
      socket.user = decoded;
      next();
    } catch (err) {
      console.warn(`⚠️ Socket Auth Warning: ${err.message}. Assigning guest context.`);
      socket.user = { id: 0, role: 'GUEST', full_name: 'Guest User' };
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ID=${socket.id} | User=${socket.user?.full_name || 'Guest'} (${socket.user?.role || 'Guest'})`);

    // PARENT: Join Trip Room
    socket.on('parent:joinTrip', async (data) => {
      try {
        const { trip_id, bus_id } = data || {};
        const roomName = `trip_${trip_id || bus_id}`;
        socket.join(roomName);
        console.log(`👨‍👩‍👧 Parent ${socket.user?.full_name} joined socket room: ${roomName}`);

        // Fetch latest GPS location for this trip/bus and send immediately to parent
        if (trip_id) {
          const latestGps = await dbModel.getLatestGpsForTrip(trip_id);
          if (latestGps) {
            socket.emit('server:busLocationUpdated', latestGps);
          }
        }
      } catch (err) {
        console.error('Error handling parent:joinTrip', err);
      }
    });

    // PARENT: Leave Trip Room
    socket.on('parent:leaveTrip', (data) => {
      const { trip_id, bus_id } = data || {};
      const roomName = `trip_${trip_id || bus_id}`;
      socket.leave(roomName);
      console.log(`👨‍👩‍👧 Parent left socket room: ${roomName}`);
    });

    // DRIVER: Start Trip Event
    socket.on('driver:startTrip', async (data) => {
      try {
        const { bus_id, route_id, trip_type } = data || {};
        
        let driver_id = 1;
        if (socket.user && socket.user.role === 'DRIVER') {
          const details = await dbModel.getDriverDetailsByUserId(socket.user.id);
          if (details?.driver) driver_id = details.driver.id;
        }

        const trip = await dbModel.startTrip({
          bus_id: bus_id || 1,
          driver_id,
          route_id: route_id || 1,
          trip_type: trip_type || 'MORNING_PICKUP'
        });

        const roomName = `trip_${trip.id}`;
        socket.join(roomName);

        // Broadcast to parents and school admin
        io.to(roomName).emit('server:tripStarted', {
          trip_id: trip.id,
          bus_id: trip.bus_id,
          status: 'ACTIVE',
          message: 'School bus trip has started.'
        });

        io.emit('server:tripStarted', {
          trip_id: trip.id,
          bus_id: trip.bus_id,
          status: 'ACTIVE',
          message: 'School bus trip has started.'
        });

        console.log(`🚌 Driver started trip ${trip.id} for Bus ${trip.bus_id}`);
      } catch (err) {
        console.error('Error in driver:startTrip', err);
      }
    });

    // DRIVER: Live Location Update Event
    socket.on('driver:locationUpdate', async (data) => {
      try {
        const { trip_id, bus_id, driver_id, latitude, longitude, speed, heading } = data || {};

        if (!latitude || !longitude) return;

        // Save GPS entry into DB
        const locationRecord = await dbModel.saveGpsLocation({
          trip_id: trip_id || 1,
          bus_id: bus_id || 1,
          driver_id: driver_id || 1,
          latitude: Number(latitude),
          longitude: Number(longitude),
          speed: Number(speed || 0),
          heading: Number(heading || 0)
        });

        // Broadcast real-time location to authorized room
        const roomName = `trip_${trip_id || 1}`;
        io.to(roomName).emit('server:busLocationUpdated', {
          trip_id: locationRecord.trip_id,
          bus_id: locationRecord.bus_id,
          latitude: locationRecord.latitude,
          longitude: locationRecord.longitude,
          speed: locationRecord.speed,
          heading: locationRecord.heading,
          timestamp: locationRecord.timestamp
        });
      } catch (err) {
        console.error('Error in driver:locationUpdate', err);
      }
    });

    // DRIVER: End Trip Event
    socket.on('driver:endTrip', async (data) => {
      try {
        const { trip_id } = data || {};
        if (trip_id) {
          await dbModel.endTrip(trip_id);
          const roomName = `trip_${trip_id}`;
          io.to(roomName).emit('server:tripEnded', {
            trip_id: Number(trip_id),
            message: 'Trip completed safely.'
          });
        }
      } catch (err) {
        console.error('Error in driver:endTrip', err);
      }
    });

    // DRIVER: SOS Panic Button Event
    socket.on('driver:sos', async (data) => {
      try {
        const { trip_id, bus_id, driver_id, school_id, latitude, longitude, message } = data || {};
        
        const alert = await dbModel.createEmergencyAlert({
          trip_id: trip_id || 1,
          bus_id: bus_id || 1,
          driver_id: driver_id || 1,
          school_id: school_id || 1,
          emergency_type: 'SOS',
          message: message || 'EMERGENCY SOS TRIGGERED BY DRIVER!',
          latitude,
          longitude
        });

        // Broadcast to ALL sockets (School Admins & Parents)
        io.emit('server:emergencyAlert', {
          ...alert,
          emergency_type: 'SOS',
          title: '🚨 EMERGENCY SOS'
        });

        console.log(`🚨 SOS Alert Received from Bus ${bus_id}`);
      } catch (err) {
        console.error('Error in driver:sos', err);
      }
    });

    // DRIVER: Bus Breakdown Event
    socket.on('driver:breakdown', async (data) => {
      try {
        const { trip_id, bus_id, driver_id, school_id, latitude, longitude, reason } = data || {};

        const alert = await dbModel.createEmergencyAlert({
          trip_id: trip_id || 1,
          bus_id: bus_id || 1,
          driver_id: driver_id || 1,
          school_id: school_id || 1,
          emergency_type: 'BREAKDOWN',
          message: reason || 'Bus mechanical failure reported by driver.',
          latitude,
          longitude
        });

        io.emit('server:emergencyAlert', {
          ...alert,
          emergency_type: 'BREAKDOWN',
          title: '⚠️ BUS BREAKDOWN REPORTED'
        });
      } catch (err) {
        console.error('Error in driver:breakdown', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ID=${socket.id}`);
    });
  });
};

module.exports = setupSocketHandlers;
