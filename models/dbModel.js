const { getPool, isMemoryMode, getMemoryStore } = require('../config/db');

const dbModel = {
  // USER QUERIES
  async findUserByEmail(email) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      return store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findUserById(id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      return store.users.find(u => u.id === Number(id)) || null;
    }
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async createUser(userData) {
    const { school_id, full_name, email, phone, password_hash, role } = userData;
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newId = store.users.length ? Math.max(...store.users.map(u => u.id)) + 1 : 1;
      const newUser = {
        id: newId,
        school_id: school_id ? Number(school_id) : null,
        full_name,
        email,
        phone,
        password_hash,
        role,
        status: 'ACTIVE',
        created_at: new Date()
      };
      store.users.push(newUser);
      return newUser;
    }
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO users (school_id, full_name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, "ACTIVE")',
      [school_id || null, full_name, email, phone, password_hash, role]
    );
    return { id: result.insertId, ...userData };
  },

  // SCHOOL QUERIES
  async getSchools() {
    if (isMemoryMode()) {
      return getMemoryStore().schools;
    }
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM schools ORDER BY created_at DESC');
    return rows;
  },

  async findSchoolById(id) {
    if (isMemoryMode()) {
      return getMemoryStore().schools.find(s => s.id === Number(id)) || null;
    }
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM schools WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async createSchool(schoolData) {
    const { school_name, school_code, official_email, phone, address, city, state, pincode } = schoolData;
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newId = store.schools.length ? Math.max(...store.schools.map(s => s.id)) + 1 : 1;
      const newSchool = {
        id: newId,
        school_name,
        school_code,
        official_email,
        phone,
        address,
        city,
        state,
        pincode,
        status: 'APPROVED',
        created_at: new Date()
      };
      store.schools.push(newSchool);
      return newSchool;
    }
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO schools (school_name, school_code, official_email, phone, address, city, state, pincode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "APPROVED")',
      [school_name, school_code, official_email, phone, address, city, state, pincode]
    );
    return { id: result.insertId, ...schoolData, status: 'APPROVED' };
  },

  async updateSchoolStatus(id, status) {
    if (isMemoryMode()) {
      const school = getMemoryStore().schools.find(s => s.id === Number(id));
      if (school) school.status = status;
      return school;
    }
    const pool = getPool();
    await pool.query('UPDATE schools SET status = ? WHERE id = ?', [status, id]);
    return this.findSchoolById(id);
  },

  // STUDENT QUERIES
  async findStudentByAdmission(admission_number) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      return store.students.find(s => s.admission_number.toLowerCase() === admission_number.toLowerCase()) || null;
    }
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM students WHERE admission_number = ?', [admission_number]);
    return rows[0] || null;
  },

  async getStudentsBySchool(school_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      return store.students.filter(s => s.school_id === Number(school_id));
    }
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM students WHERE school_id = ? ORDER BY created_at DESC', [school_id]);
    return rows;
  },

  async createStudent(studentData) {
    const { school_id, admission_number, first_name, last_name, grade, section, gender, emergency_contact, parent_email, parent_phone, address } = studentData;
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newId = store.students.length ? Math.max(...store.students.map(s => s.id)) + 1 : 1;
      const newStudent = {
        id: newId,
        school_id: Number(school_id),
        admission_number,
        first_name,
        last_name,
        grade,
        section,
        gender,
        emergency_contact,
        parent_email,
        parent_phone,
        address,
        status: 'ACTIVE',
        created_at: new Date()
      };
      store.students.push(newStudent);
      return newStudent;
    }
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO students (school_id, admission_number, first_name, last_name, grade, section, gender, emergency_contact, parent_email, parent_phone, address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [school_id, admission_number, first_name, last_name, grade, section || '', gender || 'Male', emergency_contact, parent_email, parent_phone, address]
    );
    return { id: result.insertId, ...studentData };
  },

  // PARENT REGISTRATION & QUERIES
  async createParentAccount(userData, student_id, relationship) {
    const user = await this.createUser(userData);
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newParentId = store.parents.length ? Math.max(...store.parents.map(p => p.id)) + 1 : 1;
      const parentObj = { id: newParentId, user_id: user.id, student_id: Number(student_id), relationship };
      store.parents.push(parentObj);
      return { user, parent: parentObj };
    }
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO parents (user_id, student_id, relationship) VALUES (?, ?, ?)',
      [user.id, student_id, relationship]
    );
    return { user, parent: { id: result.insertId, user_id: user.id, student_id, relationship } };
  },

  async getParentsBySchool(school_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const schoolStudents = store.students.filter(s => s.school_id === Number(school_id));
      const studentIds = schoolStudents.map(s => s.id);
      const parentMaps = store.parents.filter(p => studentIds.includes(p.student_id));
      return parentMaps.map(p => {
        const u = store.users.find(user => user.id === p.user_id);
        const s = store.students.find(st => st.id === p.student_id);
        return {
          id: p.id,
          parent_name: u ? u.full_name : '',
          email: u ? u.email : '',
          phone: u ? u.phone : '',
          relationship: p.relationship,
          student_name: s ? `${s.first_name} ${s.last_name}` : '',
          admission_number: s ? s.admission_number : ''
        };
      });
    }
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT p.id, u.full_name as parent_name, u.email, u.phone, p.relationship,
              CONCAT(st.first_name, ' ', st.last_name) as student_name, st.admission_number
       FROM parents p
       JOIN users u ON p.user_id = u.id
       JOIN students st ON p.student_id = st.id
       WHERE st.school_id = ?`,
      [school_id]
    );
    return rows;
  },

  async getParentStudentDetails(user_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const parentRecord = store.parents.find(p => p.user_id === Number(user_id));
      if (!parentRecord) return null;

      const student = store.students.find(s => s.id === parentRecord.student_id);
      if (!student) return null;

      const assignment = store.student_bus_assignments.find(a => a.student_id === student.id && a.status === 'ACTIVE');
      let bus = null;
      let route = null;
      let pickup_stop = null;
      let drop_stop = null;
      let active_trip = null;

      let driver = null;
      if (assignment) {
        bus = store.buses.find(b => b.id === assignment.bus_id) || null;
        route = store.routes.find(r => r.id === assignment.route_id) || null;
        pickup_stop = store.bus_stops.find(s => s.id === assignment.pickup_stop_id) || null;
        drop_stop = store.bus_stops.find(s => s.id === assignment.drop_stop_id) || null;
        if (bus) {
          active_trip = store.trips.find(t => t.bus_id === bus.id && (t.status === 'STARTED' || t.status === 'ACTIVE')) || null;
          const driverRecord = store.drivers.find(d => d.school_id === student.school_id);
          if (driverRecord) {
            const driverUser = store.users.find(u => u.id === driverRecord.user_id);
            driver = {
              id: driverRecord.id,
              full_name: driverUser?.full_name || 'School Bus Driver',
              phone: driverUser?.phone || '+919820044556',
              email: driverUser?.email || '',
              license_number: driverRecord.license_number,
              profile_photo: driverRecord.profile_photo || null,
              verification_status: driverRecord.verification_status || 'VERIFIED'
            };
          }
        }
      }

      return {
        student,
        relationship: parentRecord.relationship,
        assignment,
        bus,
        route,
        pickup_stop,
        drop_stop,
        active_trip,
        driver
      };
    }

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT st.*, p.relationship, 
              sba.bus_id, sba.route_id, sba.pickup_stop_id, sba.drop_stop_id,
              b.bus_number, b.registration_number,
              r.route_name, r.route_code, r.start_location, r.end_location,
              ps.stop_name as pickup_stop_name, ps.latitude as pickup_lat, ps.longitude as pickup_lng, ps.estimated_pickup_time,
              ds.stop_name as drop_stop_name, ds.latitude as drop_lat, ds.longitude as drop_lng, ds.estimated_drop_time,
              t.id as active_trip_id, t.status as trip_status,
              drv.id as driver_id, drv.license_number, drv.profile_photo, drv.verification_status,
              du.full_name as driver_name, du.phone as driver_phone
       FROM parents p
       JOIN students st ON p.student_id = st.id
       LEFT JOIN student_bus_assignments sba ON st.id = sba.student_id AND sba.status = 'ACTIVE'
       LEFT JOIN buses b ON sba.bus_id = b.id
       LEFT JOIN routes r ON sba.route_id = r.id
       LEFT JOIN bus_stops ps ON sba.pickup_stop_id = ps.id
       LEFT JOIN bus_stops ds ON sba.drop_stop_id = ds.id
       LEFT JOIN trips t ON b.id = t.bus_id AND (t.status = 'STARTED' OR t.status = 'ACTIVE')
       LEFT JOIN drivers drv ON drv.school_id = st.school_id
       LEFT JOIN users du ON drv.user_id = du.id
       WHERE p.user_id = ?`,
      [user_id]
    );

    if (!rows.length) return null;
    const r = rows[0];

    return {
      student: {
        id: r.id,
        school_id: r.school_id,
        admission_number: r.admission_number,
        first_name: r.first_name,
        last_name: r.last_name,
        grade: r.grade,
        section: r.section,
        parent_email: r.parent_email,
        parent_phone: r.parent_phone,
        address: r.address
      },
      relationship: r.relationship,
      bus: r.bus_id ? { id: r.bus_id, bus_number: r.bus_number, registration_number: r.registration_number } : null,
      route: r.route_id ? { id: r.route_id, route_name: r.route_name, route_code: r.route_code, start_location: r.start_location, end_location: r.end_location } : null,
      pickup_stop: r.pickup_stop_id ? { id: r.pickup_stop_id, stop_name: r.pickup_stop_name, latitude: Number(r.pickup_lat), longitude: Number(r.pickup_lng), estimated_pickup_time: r.estimated_pickup_time } : null,
      drop_stop: r.drop_stop_id ? { id: r.drop_stop_id, stop_name: r.drop_stop_name, latitude: Number(r.drop_lat), longitude: Number(r.drop_lng), estimated_drop_time: r.estimated_drop_time } : null,
      active_trip: r.active_trip_id ? { id: r.active_trip_id, status: r.trip_status } : null,
      driver: r.driver_id ? {
        id: r.driver_id,
        full_name: r.driver_name,
        phone: r.driver_phone,
        license_number: r.license_number,
        profile_photo: r.profile_photo || null,
        verification_status: r.verification_status || 'VERIFIED'
      } : null
    };
  },

  // DRIVERS
  async getDriversBySchool(school_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const drvs = store.drivers.filter(d => d.school_id === Number(school_id));
      return drvs.map(d => {
        const u = store.users.find(user => user.id === d.user_id);
        return {
          id: d.id,
          user_id: d.user_id,
          driver_name: u ? u.full_name : '',
          email: u ? u.email : '',
          phone: u ? u.phone : '',
          license_number: d.license_number,
          experience_years: d.experience_years,
          status: d.status
        };
      });
    }
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT d.id, d.user_id, u.full_name as driver_name, u.email, u.phone, d.license_number, d.experience_years, d.status
       FROM drivers d
       JOIN users u ON d.user_id = u.id
       WHERE d.school_id = ?`,
      [school_id]
    );
    return rows;
  },

  async createDriver(userData, driverData) {
    const user = await this.createUser({ ...userData, role: 'DRIVER' });
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newDriverId = store.drivers.length ? Math.max(...store.drivers.map(d => d.id)) + 1 : 1;
      const driverObj = {
        id: newDriverId,
        user_id: user.id,
        school_id: Number(userData.school_id),
        license_number: driverData.license_number,
        experience_years: Number(driverData.experience_years || 1),
        status: 'AVAILABLE'
      };
      store.drivers.push(driverObj);
      return { user, driver: driverObj };
    }
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO drivers (user_id, school_id, license_number, experience_years, status) VALUES (?, ?, ?, ?, "AVAILABLE")',
      [user.id, userData.school_id, driverData.license_number, driverData.experience_years || 1]
    );
    return { user, driver: { id: result.insertId, user_id: user.id, ...driverData } };
  },

  async getDriverDetailsByUserId(user_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const driver = store.drivers.find(d => d.user_id === Number(user_id));
      if (!driver) return null;
      const user = store.users.find(u => u.id === Number(user_id));
      // Find assigned bus (e.g. from trips or school active bus)
      const bus = store.buses.find(b => b.school_id === driver.school_id) || null;
      const route = bus ? store.routes.find(r => r.school_id === driver.school_id) : null;
      const active_trip = bus ? store.trips.find(t => t.driver_id === driver.id && (t.status === 'STARTED' || t.status === 'ACTIVE')) : null;
      return {
        driver: { ...driver, full_name: user?.full_name, email: user?.email, phone: user?.phone },
        bus,
        route,
        active_trip
      };
    }
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT d.*, u.full_name, u.email, u.phone
       FROM drivers d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id = ?`,
      [user_id]
    );
    if (!rows.length) return null;
    const d = rows[0];

    // Find assigned bus & route
    const [buses] = await pool.query('SELECT * FROM buses WHERE school_id = ? LIMIT 1', [d.school_id]);
    const bus = buses[0] || null;
    let route = null;
    let active_trip = null;
    if (bus) {
      const [routes] = await pool.query('SELECT * FROM routes WHERE school_id = ? LIMIT 1', [d.school_id]);
      route = routes[0] || null;
      const [trips] = await pool.query('SELECT * FROM trips WHERE driver_id = ? AND (status = "STARTED" OR status = "ACTIVE") LIMIT 1', [d.id]);
      active_trip = trips[0] || null;
    }

    return { driver: d, bus, route, active_trip };
  },

  // BUSES
  async getBusesBySchool(school_id) {
    if (isMemoryMode()) {
      return getMemoryStore().buses.filter(b => b.school_id === Number(school_id));
    }
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM buses WHERE school_id = ? ORDER BY created_at DESC', [school_id]);
    return rows;
  },

  async createBus(busData) {
    const { school_id, bus_number, registration_number, capacity, model } = busData;
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newId = store.buses.length ? Math.max(...store.buses.map(b => b.id)) + 1 : 1;
      const newBus = {
        id: newId,
        school_id: Number(school_id),
        bus_number,
        registration_number,
        capacity: Number(capacity || 40),
        model: model || 'Standard School Bus',
        status: 'ACTIVE',
        created_at: new Date()
      };
      store.buses.push(newBus);
      return newBus;
    }
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO buses (school_id, bus_number, registration_number, capacity, model, status) VALUES (?, ?, ?, ?, ?, "ACTIVE")',
      [school_id, bus_number, registration_number, capacity || 40, model || 'Standard School Bus']
    );
    return { id: result.insertId, ...busData };
  },

  // ROUTES & STOPS
  async getRoutesBySchool(school_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const rts = store.routes.filter(r => r.school_id === Number(school_id));
      return rts.map(r => ({
        ...r,
        stops: store.bus_stops.filter(s => s.route_id === r.id).sort((a, b) => a.sequence_order - b.sequence_order)
      }));
    }
    const pool = getPool();
    const [routes] = await pool.query('SELECT * FROM routes WHERE school_id = ? ORDER BY created_at DESC', [school_id]);
    for (const r of routes) {
      const [stops] = await pool.query('SELECT * FROM bus_stops WHERE route_id = ? ORDER BY sequence_order ASC', [r.id]);
      r.stops = stops;
    }
    return routes;
  },

  async createRoute(routeData, stops = []) {
    const { school_id, route_name, route_code, start_location, end_location, distance_km, estimated_minutes } = routeData;
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newRouteId = store.routes.length ? Math.max(...store.routes.map(r => r.id)) + 1 : 1;
      const newRoute = {
        id: newRouteId,
        school_id: Number(school_id),
        route_name,
        route_code,
        start_location,
        end_location,
        distance_km: Number(distance_km || 10),
        estimated_minutes: Number(estimated_minutes || 40),
        status: 'ACTIVE'
      };
      store.routes.push(newRoute);

      stops.forEach((stop, idx) => {
        const stopId = store.bus_stops.length ? Math.max(...store.bus_stops.map(s => s.id)) + 1 : 1;
        store.bus_stops.push({
          id: stopId,
          route_id: newRouteId,
          stop_name: stop.stop_name,
          sequence_order: idx + 1,
          latitude: Number(stop.latitude),
          longitude: Number(stop.longitude),
          estimated_pickup_time: stop.estimated_pickup_time || '07:30:00',
          estimated_drop_time: stop.estimated_drop_time || '15:30:00'
        });
      });
      newRoute.stops = store.bus_stops.filter(s => s.route_id === newRouteId);
      return newRoute;
    }

    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO routes (school_id, route_name, route_code, start_location, end_location, distance_km, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [school_id, route_name, route_code, start_location, end_location, distance_km || 10, estimated_minutes || 40]
    );
    const routeId = result.insertId;

    for (let idx = 0; idx < stops.length; idx++) {
      const s = stops[idx];
      await pool.query(
        `INSERT INTO bus_stops (route_id, stop_name, sequence_order, latitude, longitude, estimated_pickup_time, estimated_drop_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [routeId, s.stop_name, idx + 1, s.latitude, s.longitude, s.estimated_pickup_time || '07:30:00', s.estimated_drop_time || '15:30:00']
      );
    }
    return this.getRoutesBySchool(school_id).then(rts => rts.find(r => r.id === routeId));
  },

  async getRouteStops(route_id) {
    if (isMemoryMode()) {
      return getMemoryStore().bus_stops.filter(s => s.route_id === Number(route_id)).sort((a, b) => a.sequence_order - b.sequence_order);
    }
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM bus_stops WHERE route_id = ? ORDER BY sequence_order ASC', [route_id]);
    return rows;
  },

  // ASSIGNMENTS
  async assignStudentToBus(assignmentData) {
    const { student_id, bus_id, route_id, pickup_stop_id, drop_stop_id } = assignmentData;
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newId = store.student_bus_assignments.length ? Math.max(...store.student_bus_assignments.map(a => a.id)) + 1 : 1;
      const assign = {
        id: newId,
        student_id: Number(student_id),
        bus_id: Number(bus_id),
        route_id: Number(route_id),
        pickup_stop_id: pickup_stop_id ? Number(pickup_stop_id) : null,
        drop_stop_id: drop_stop_id ? Number(drop_stop_id) : null,
        status: 'ACTIVE'
      };
      store.student_bus_assignments.push(assign);
      return assign;
    }
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO student_bus_assignments (student_id, bus_id, route_id, pickup_stop_id, drop_stop_id, status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [student_id, bus_id, route_id, pickup_stop_id || null, drop_stop_id || null]
    );
    return { id: result.insertId, ...assignmentData };
  },

  // TRIPS & GPS TRACKING
  async startTrip({ bus_id, driver_id, route_id, trip_type }) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      // Mark existing active trips for driver as COMPLETED
      store.trips.filter(t => t.driver_id === Number(driver_id) && t.status === 'ACTIVE').forEach(t => t.status = 'COMPLETED');
      const newId = store.trips.length ? Math.max(...store.trips.map(t => t.id)) + 1 : 1;
      const newTrip = {
        id: newId,
        bus_id: Number(bus_id),
        driver_id: Number(driver_id),
        route_id: Number(route_id),
        trip_type: trip_type || 'MORNING_PICKUP',
        status: 'ACTIVE',
        start_time: new Date(),
        end_time: null,
        date: new Date().toISOString().split('T')[0]
      };
      store.trips.push(newTrip);
      return newTrip;
    }
    const pool = getPool();
    await pool.query('UPDATE trips SET status = "COMPLETED", end_time = NOW() WHERE driver_id = ? AND status = "ACTIVE"', [driver_id]);
    const [result] = await pool.query(
      `INSERT INTO trips (bus_id, driver_id, route_id, trip_type, status, start_time, date)
       VALUES (?, ?, ?, ?, "ACTIVE", NOW(), CURDATE())`,
      [bus_id, driver_id, route_id, trip_type || 'MORNING_PICKUP']
    );
    return { id: result.insertId, bus_id, driver_id, route_id, status: 'ACTIVE', start_time: new Date() };
  },

  async endTrip(trip_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const trip = store.trips.find(t => t.id === Number(trip_id));
      if (trip) {
        trip.status = 'COMPLETED';
        trip.end_time = new Date();
      }
      return trip;
    }
    const pool = getPool();
    await pool.query('UPDATE trips SET status = "COMPLETED", end_time = NOW() WHERE id = ?', [trip_id]);
    const [rows] = await pool.query('SELECT * FROM trips WHERE id = ?', [trip_id]);
    return rows[0];
  },

  async saveGpsLocation(locationData) {
    const { trip_id, bus_id, driver_id, latitude, longitude, speed, heading } = locationData;
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newId = store.gps_locations.length ? Math.max(...store.gps_locations.map(g => g.id)) + 1 : 1;
      const loc = {
        id: newId,
        trip_id: Number(trip_id),
        bus_id: Number(bus_id),
        driver_id: Number(driver_id),
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed: Number(speed || 0),
        heading: Number(heading || 0),
        timestamp: new Date()
      };
      store.gps_locations.push(loc);
      return loc;
    }
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO gps_locations (trip_id, bus_id, driver_id, latitude, longitude, speed, heading)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [trip_id, bus_id, driver_id, latitude, longitude, speed || 0, heading || 0]
    );
    return { id: result.insertId, ...locationData, timestamp: new Date() };
  },

  async getLatestGpsForTrip(trip_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const locs = store.gps_locations.filter(g => g.trip_id === Number(trip_id));
      if (!locs.length) return null;
      return locs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    }
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM gps_locations WHERE trip_id = ? ORDER BY timestamp DESC LIMIT 1',
      [trip_id]
    );
    return rows[0] || null;
  },

  async getActiveTripsForSchool(school_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const schoolBuses = store.buses.filter(b => b.school_id === Number(school_id)).map(b => b.id);
      const activeTrips = store.trips.filter(t => schoolBuses.includes(t.bus_id) && (t.status === 'STARTED' || t.status === 'ACTIVE'));
      return activeTrips.map(t => {
        const bus = store.buses.find(b => b.id === t.bus_id);
        const driver = store.drivers.find(d => d.id === t.driver_id);
        const driverUser = driver ? store.users.find(u => u.id === driver.user_id) : null;
        const route = store.routes.find(r => r.id === t.route_id);
        const latestGps = this.getLatestGpsForTrip(t.id);
        return {
          ...t,
          bus_number: bus?.bus_number,
          driver_name: driverUser?.full_name,
          driver_phone: driverUser?.phone,
          route_name: route?.route_name,
          latestGps
        };
      });
    }
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT t.*, b.bus_number, u.full_name as driver_name, u.phone as driver_phone, r.route_name,
              g.latitude as latest_lat, g.longitude as latest_lng, g.speed, g.heading, g.timestamp as last_gps_time
       FROM trips t
       JOIN buses b ON t.bus_id = b.id
       JOIN drivers d ON t.driver_id = d.id
       JOIN users u ON d.user_id = u.id
       JOIN routes r ON t.route_id = r.id
       LEFT JOIN (
          SELECT g1.* FROM gps_locations g1
          INNER JOIN (
            SELECT trip_id, MAX(timestamp) as max_time FROM gps_locations GROUP BY trip_id
          ) g2 ON g1.trip_id = g2.trip_id AND g1.timestamp = g2.max_time
       ) g ON t.id = g.trip_id
       WHERE b.school_id = ? AND (t.status = 'STARTED' OR t.status = 'ACTIVE')`,
      [school_id]
    );
    return rows;
  },

  async getTripHistoryForUser(user_id, role) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      return store.trips.slice(0, 10);
    }
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT t.*, b.bus_number, r.route_name, u.full_name as driver_name
       FROM trips t
       JOIN buses b ON t.bus_id = b.id
       JOIN routes r ON t.route_id = r.id
       JOIN drivers d ON t.driver_id = d.id
       JOIN users u ON d.user_id = u.id
       ORDER BY t.created_at DESC LIMIT 20`
    );
    return rows;
  },

  // EMERGENCY ALERTS
  async createEmergencyAlert(alertData) {
    const { trip_id, bus_id, driver_id, school_id, emergency_type, message, latitude, longitude } = alertData;
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newId = store.emergency_alerts.length ? Math.max(...store.emergency_alerts.map(a => a.id)) + 1 : 1;
      const alertObj = {
        id: newId,
        trip_id: trip_id ? Number(trip_id) : null,
        bus_id: Number(bus_id),
        driver_id: Number(driver_id),
        school_id: Number(school_id),
        emergency_type: emergency_type || 'SOS',
        message: message || 'EMERGENCY SOS ALERT BROADCASTED',
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        status: 'ACTIVE',
        created_at: new Date()
      };
      store.emergency_alerts.push(alertObj);
      return alertObj;
    }
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO emergency_alerts (trip_id, bus_id, driver_id, school_id, emergency_type, message, latitude, longitude, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [trip_id || null, bus_id, driver_id, school_id, emergency_type || 'SOS', message || 'Emergency Alert', latitude || null, longitude || null]
    );
    return { id: result.insertId, ...alertData, status: 'ACTIVE', created_at: new Date() };
  },

  async getEmergencyAlerts(school_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      return store.emergency_alerts
        .filter(a => !school_id || a.school_id === Number(school_id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT e.*, b.bus_number, u.full_name as driver_name, u.phone as driver_phone
       FROM emergency_alerts e
       JOIN buses b ON e.bus_id = b.id
       JOIN drivers d ON e.driver_id = d.id
       JOIN users u ON d.user_id = u.id
       ${school_id ? 'WHERE e.school_id = ?' : ''}
       ORDER BY e.created_at DESC`,
      school_id ? [school_id] : []
    );
    return rows;
  },

  async resolveEmergencyAlert(alert_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const alertObj = store.emergency_alerts.find(a => a.id === Number(alert_id));
      if (alertObj) {
        alertObj.status = 'RESOLVED';
        alertObj.resolved_at = new Date();
      }
      return alertObj;
    }
    const pool = getPool();
    await pool.query('UPDATE emergency_alerts SET status = "RESOLVED", resolved_at = NOW() WHERE id = ?', [alert_id]);
    return { id: alert_id, status: 'RESOLVED' };
  },

  // NOTIFICATIONS
  async createNotification({ user_id, title, message, type }) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const newId = store.notifications.length ? Math.max(...store.notifications.map(n => n.id)) + 1 : 1;
      const notif = {
        id: newId,
        user_id: Number(user_id),
        title,
        message,
        type: type || 'TRIP',
        is_read: false,
        created_at: new Date()
      };
      store.notifications.push(notif);
      return notif;
    }
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, FALSE)',
      [user_id, title, message, type || 'TRIP']
    );
    return { id: result.insertId, user_id, title, message, type, is_read: false, created_at: new Date() };
  },

  async getUserNotifications(user_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      return store.notifications.filter(n => n.user_id === Number(user_id)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
    return rows;
  },

  // DRIVER PROFILE & VERIFICATION
  async uploadDriverProfile(user_id, { profile_photo, license_photo, aadhar_number }) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const driver = store.drivers.find(d => d.user_id === Number(user_id));
      if (!driver) return null;
      if (profile_photo !== undefined) driver.profile_photo = profile_photo;
      if (license_photo !== undefined) driver.license_photo = license_photo;
      if (aadhar_number !== undefined) driver.aadhar_number = aadhar_number;
      // Auto-set to UNDER_REVIEW when profile photo is uploaded
      if (driver.verification_status === 'PENDING') {
        driver.verification_status = 'UNDER_REVIEW';
      }
      return driver;
    }
    const pool = getPool();
    const updates = [];
    const vals = [];
    if (profile_photo !== undefined) { updates.push('profile_photo = ?'); vals.push(profile_photo); }
    if (license_photo !== undefined) { updates.push('license_photo = ?'); vals.push(license_photo); }
    if (aadhar_number !== undefined) { updates.push('aadhar_number = ?'); vals.push(aadhar_number); }
    updates.push("verification_status = 'UNDER_REVIEW'");
    vals.push(user_id);
    if (updates.length > 1) {
      await pool.query(`UPDATE drivers SET ${updates.join(', ')} WHERE user_id = ?`, vals);
    }
    return this.getDriverDetailsByUserId(user_id);
  },

  async updateDriverVerification(driver_id, { verification_status, verified_by }) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const driver = store.drivers.find(d => d.id === Number(driver_id));
      if (!driver) return null;
      driver.verification_status = verification_status;
      driver.verified_by = verified_by || null;
      driver.verified_at = verification_status === 'VERIFIED' ? new Date() : null;
      return driver;
    }
    const pool = getPool();
    await pool.query(
      'UPDATE drivers SET verification_status = ?, verified_by = ?, verified_at = ? WHERE id = ?',
      [verification_status, verified_by || null, verification_status === 'VERIFIED' ? new Date() : null, driver_id]
    );
    return { id: driver_id, verification_status };
  },

  async getDriverVerificationDetails(driver_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const driver = store.drivers.find(d => d.id === Number(driver_id));
      if (!driver) return null;
      const user = store.users.find(u => u.id === driver.user_id);
      return { ...driver, full_name: user?.full_name, email: user?.email, phone: user?.phone };
    }
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT d.*, u.full_name, u.email, u.phone FROM drivers d JOIN users u ON d.user_id = u.id WHERE d.id = ?`,
      [driver_id]
    );
    return rows[0] || null;
  },

  async getAllDriversForVerification(school_id) {
    if (isMemoryMode()) {
      const store = getMemoryStore();
      const drvs = school_id
        ? store.drivers.filter(d => d.school_id === Number(school_id))
        : store.drivers;
      return drvs.map(d => {
        const u = store.users.find(user => user.id === d.user_id);
        return {
          ...d,
          full_name: u?.full_name,
          email: u?.email,
          phone: u?.phone
        };
      });
    }
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT d.*, u.full_name, u.email, u.phone FROM drivers d JOIN users u ON d.user_id = u.id ${school_id ? 'WHERE d.school_id = ?' : ''}`,
      school_id ? [school_id] : []
    );
    return rows;
  }
};

module.exports = dbModel;
