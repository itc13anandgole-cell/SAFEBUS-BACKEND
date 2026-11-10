const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pool = null;
let useFallbackStore = false;

// In-Memory Fallback Database Store for Dev environment when MySQL server is not active
const memoryStore = {
  schools: [
    { id: 1, school_name: 'Greenwood International School', school_code: 'GIS-1001', official_email: 'admin@greenwood.edu', phone: '+919876543210', address: '123 Education Lane, Kothrud', city: 'Pune', state: 'Maharashtra', pincode: '411038', status: 'APPROVED', created_at: new Date() },
    { id: 2, school_name: 'Sunrise Global Academy', school_code: 'SGA-1002', official_email: 'contact@sunriseglobal.edu', phone: '+919876543211', address: '45 Knowledge Park, Viman Nagar', city: 'Pune', state: 'Maharashtra', pincode: '411014', status: 'PENDING', created_at: new Date() },
    { id: 3, school_name: 'St. Lawrence High School, Dahisar', school_code: 'SLH-1003', official_email: 'admin@stlawrencedahisar.edu', phone: '+919820011223', address: 'S.V. Road, Dahisar East', city: 'Mumbai', state: 'Maharashtra', pincode: '400068', status: 'APPROVED', created_at: new Date() }
  ],
  users: [
    { id: 1, school_id: null, full_name: 'Super Admin User', email: 'superadmin@eduride.com', phone: '+919900000000', password_hash: '$2a$10$PfrudR.SN8MimIUFUdi27.uaFa9w3slnNh3o3..StBHgaEh/8UYEG', role: 'SUPER_ADMIN', status: 'ACTIVE' },
    { id: 2, school_id: 1, full_name: 'Principal Rajesh Sharma', email: 'admin@greenwood.edu', phone: '+919876543210', password_hash: '$2a$10$PfrudR.SN8MimIUFUdi27.uaFa9w3slnNh3o3..StBHgaEh/8UYEG', role: 'SCHOOL_ADMIN', status: 'ACTIVE' },
    { id: 3, school_id: 1, full_name: 'Ramesh Kumar (Driver 1)', email: 'driver.ramesh@greenwood.edu', phone: '+919811122233', password_hash: '$2a$10$PfrudR.SN8MimIUFUdi27.uaFa9w3slnNh3o3..StBHgaEh/8UYEG', role: 'DRIVER', status: 'ACTIVE' },
    { id: 4, school_id: 1, full_name: 'Suresh Patil (Driver 2)', email: 'driver.suresh@greenwood.edu', phone: '+919811122244', password_hash: '$2a$10$PfrudR.SN8MimIUFUdi27.uaFa9w3slnNh3o3..StBHgaEh/8UYEG', role: 'DRIVER', status: 'ACTIVE' },
    { id: 5, school_id: 1, full_name: 'Amit Verma (Parent)', email: 'parent.amit@gmail.com', phone: '+919822033445', password_hash: '$2a$10$PfrudR.SN8MimIUFUdi27.uaFa9w3slnNh3o3..StBHgaEh/8UYEG', role: 'PARENT', status: 'ACTIVE' },
    { id: 6, school_id: 1, full_name: 'Priya Kulkarni (Parent)', email: 'parent.priya@gmail.com', phone: '+919822033446', password_hash: '$2a$10$PfrudR.SN8MimIUFUdi27.uaFa9w3slnNh3o3..StBHgaEh/8UYEG', role: 'PARENT', status: 'ACTIVE' },
    { id: 7, school_id: 3, full_name: 'Principal Victor Dsouza (Dahisar Admin)', email: 'admin@stlawrencedahisar.edu', phone: '+919820011223', password_hash: '$2a$10$PfrudR.SN8MimIUFUdi27.uaFa9w3slnNh3o3..StBHgaEh/8UYEG', role: 'SCHOOL_ADMIN', status: 'ACTIVE' },
    { id: 8, school_id: 3, full_name: 'Sunil Patil (Dahisar Driver)', email: 'driver.sunil@stlawrencedahisar.edu', phone: '+919820044556', password_hash: '$2a$10$PfrudR.SN8MimIUFUdi27.uaFa9w3slnNh3o3..StBHgaEh/8UYEG', role: 'DRIVER', status: 'ACTIVE' },
    { id: 9, school_id: 3, full_name: 'Rajesh Mehta (Dahisar Parent)', email: 'parent.rajesh@gmail.com', phone: '+919820055667', password_hash: '$2a$10$PfrudR.SN8MimIUFUdi27.uaFa9w3slnNh3o3..StBHgaEh/8UYEG', role: 'PARENT', status: 'ACTIVE' }
  ],

  students: [
    { id: 1, school_id: 1, admission_number: 'GIS-2024-001', first_name: 'Aarav', last_name: 'Verma', grade: 'Grade 5', section: 'A', gender: 'Male', emergency_contact: '+919822033445', parent_email: 'parent.amit@gmail.com', parent_phone: '+919822033445', address: 'Flat 402, Sunshine Heights, Kothrud, Pune', status: 'ACTIVE' },
    { id: 2, school_id: 1, admission_number: 'GIS-2024-002', first_name: 'Ananya', last_name: 'Kulkarni', grade: 'Grade 3', section: 'B', gender: 'Female', emergency_contact: '+919822033446', parent_email: 'parent.priya@gmail.com', parent_phone: '+919822033446', address: 'Villa 12, Rosewood Colony, Karve Nagar, Pune', status: 'ACTIVE' },
    { id: 3, school_id: 3, admission_number: 'SLD-2024-001', first_name: 'Rohan', last_name: 'Mehta', grade: 'Grade 6', section: 'A', gender: 'Male', emergency_contact: '+919820055667', parent_email: 'parent.rajesh@gmail.com', parent_phone: '+919820055667', address: 'Flat 302, Gokul Anand Complex, Dahisar East, Mumbai', status: 'ACTIVE' },
    { id: 4, school_id: 3, admission_number: 'SLD-2024-002', first_name: 'Priya', last_name: 'Nair', grade: 'Grade 4', section: 'B', gender: 'Female', emergency_contact: '+919820066778', parent_email: 'newparent.dahisar@gmail.com', parent_phone: '+919820066778', address: 'Flat 505, Shree Krishna Tower, Dahisar West, Mumbai', status: 'ACTIVE' }
  ],
  parents: [
    { id: 1, user_id: 5, student_id: 1, relationship: 'Father' },
    { id: 2, user_id: 6, student_id: 2, relationship: 'Mother' },
    { id: 3, user_id: 9, student_id: 3, relationship: 'Father' }
  ],
  drivers: [
    { 
      id: 1, 
      user_id: 3, 
      school_id: 1, 
      license_number: 'MH-12-2015-0098765', 
      experience_years: 8, 
      status: 'AVAILABLE', 
      verification_status: 'VERIFIED', 
      profile_photo: 'iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJBSURBVHic7da9TgJBEAXgZ7GwsLAwMTExMTExMTExMTExMTExMTExMTExMTEx/sA267A8y9V0ndq52Z2chG6yN4e', 
      license_photo: null, 
      aadhar_number: '1234-5678-9012', 
      verified_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 
      verified_by: 2 
    },
    { 
      id: 2, 
      user_id: 4, 
      school_id: 1, 
      license_number: 'MH-12-2018-0043210', 
      experience_years: 5, 
      status: 'AVAILABLE', 
      verification_status: 'PENDING', 
      profile_photo: null, 
      license_photo: null, 
      aadhar_number: '9876-5432-1098', 
      verified_at: null, 
      verified_by: null 
    },
    { 
      id: 3, 
      user_id: 8, 
      school_id: 3, 
      license_number: 'MH-02-2016-0087654', 
      experience_years: 7, 
      status: 'AVAILABLE', 
      verification_status: 'VERIFIED', 
      profile_photo: 'iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJBSURBVHic7da9TgJBEAXgZ7GwsLAwMTExMTExMTExMTExMTExMTExMTExMTEx/sA267A8y9V0ndq52Z2chG6yN4e', 
      license_photo: null, 
      aadhar_number: '5555-4444-3333', 
      verified_at: new Date(), 
      verified_by: 7 
    }
  ],
  buses: [
    { id: 1, school_id: 1, bus_number: 'BUS-01', registration_number: 'MH-12-Q-4521', capacity: 40, model: 'Tata Starbus', status: 'ACTIVE' },
    { id: 2, school_id: 1, bus_number: 'BUS-02', registration_number: 'MH-12-Q-9812', capacity: 35, model: 'Eicher Skyline', status: 'ACTIVE' },
    { id: 3, school_id: 3, bus_number: 'MH-02-BUS-03', registration_number: 'MH-02-CR-8899', capacity: 40, model: 'Tata Starbus Urban (Dahisar)', status: 'ACTIVE' }
  ],
  routes: [
    { id: 1, school_id: 1, route_name: 'Kothrud - Karve Nagar Route', route_code: 'ROUTE-KTR-01', start_location: 'Shivaji Nagar Circle', end_location: 'Greenwood School, Kothrud', distance_km: 14.50, estimated_minutes: 45, status: 'ACTIVE' },
    { id: 2, school_id: 1, route_name: 'Viman Nagar - Kalyani Nagar Route', route_code: 'ROUTE-VMN-02', start_location: 'Airport Road Metro', end_location: 'Greenwood School, Kothrud', distance_km: 22.00, estimated_minutes: 60, status: 'ACTIVE' },
    { id: 3, school_id: 3, route_name: 'Dahisar East Check Naka Route', route_code: 'ROUTE-DHS-03', start_location: 'Dahisar Check Naka Toll Plaza', end_location: 'St. Lawrence High School, Dahisar East', distance_km: 8.50, estimated_minutes: 30, status: 'ACTIVE' }
  ],
  bus_stops: [
    { id: 1, route_id: 1, stop_name: 'Shivaji Nagar Station Stop', sequence_order: 1, latitude: 18.53140000, longitude: 73.84460000, estimated_pickup_time: '07:15:00', estimated_drop_time: '15:45:00' },
    { id: 2, route_id: 1, stop_name: 'Deccan Gymkhana Stop', sequence_order: 2, latitude: 18.51670000, longitude: 73.84150000, estimated_pickup_time: '07:30:00', estimated_drop_time: '15:30:00' },
    { id: 3, route_id: 1, stop_name: 'Karve Statue Stop (Aarav Pickup)', sequence_order: 3, latitude: 18.50200000, longitude: 73.81800000, estimated_pickup_time: '07:45:00', estimated_drop_time: '15:15:00' },
    { id: 4, route_id: 1, stop_name: 'Cummins College Gate Stop (Ananya Pickup)', sequence_order: 4, latitude: 18.48900000, longitude: 73.81500000, estimated_pickup_time: '07:55:00', estimated_drop_time: '15:05:00' },
    { id: 5, route_id: 1, stop_name: 'Greenwood School Campus', sequence_order: 5, latitude: 18.50800000, longitude: 73.80500000, estimated_pickup_time: '08:10:00', estimated_drop_time: '14:50:00' },
    
    // Dahisar Mumbai Bus Stops
    { id: 6, route_id: 3, stop_name: 'Dahisar Check Naka Stop', sequence_order: 1, latitude: 19.26200000, longitude: 72.86500000, estimated_pickup_time: '07:15:00', estimated_drop_time: '15:45:00' },
    { id: 7, route_id: 3, stop_name: 'Rawalpada Metro Station (Rohan Pickup)', sequence_order: 2, latitude: 19.25900000, longitude: 72.86300000, estimated_pickup_time: '07:30:00', estimated_drop_time: '15:30:00' },
    { id: 8, route_id: 3, stop_name: 'Dahisar Station East Plaza', sequence_order: 3, latitude: 19.25400000, longitude: 72.85800000, estimated_pickup_time: '07:42:00', estimated_drop_time: '15:18:00' },
    { id: 9, route_id: 3, stop_name: 'Anand Nagar Dahisar', sequence_order: 4, latitude: 19.25000000, longitude: 72.85600000, estimated_pickup_time: '07:50:00', estimated_drop_time: '15:10:00' },
    { id: 10, route_id: 3, stop_name: 'St. Lawrence High School Campus, Dahisar', sequence_order: 5, latitude: 19.25500000, longitude: 72.85500000, estimated_pickup_time: '08:00:00', estimated_drop_time: '15:00:00' }
  ],
  student_bus_assignments: [
    { id: 1, student_id: 1, bus_id: 1, route_id: 1, pickup_stop_id: 3, drop_stop_id: 3, status: 'ACTIVE' },
    { id: 2, student_id: 2, bus_id: 1, route_id: 1, pickup_stop_id: 4, drop_stop_id: 4, status: 'ACTIVE' },
    { id: 3, student_id: 3, bus_id: 3, route_id: 3, pickup_stop_id: 7, drop_stop_id: 7, status: 'ACTIVE' },
    { id: 4, student_id: 4, bus_id: 3, route_id: 3, pickup_stop_id: 8, drop_stop_id: 8, status: 'ACTIVE' }
  ],
  trips: [
    { id: 1, bus_id: 1, driver_id: 1, route_id: 1, trip_type: 'MORNING_PICKUP', status: 'ACTIVE', start_time: new Date(), end_time: null, date: new Date().toISOString().split('T')[0] },
    { id: 2, bus_id: 3, driver_id: 3, route_id: 3, trip_type: 'MORNING_PICKUP', status: 'ACTIVE', start_time: new Date(), end_time: null, date: new Date().toISOString().split('T')[0] }
  ],
  gps_locations: [
    { id: 1, trip_id: 1, bus_id: 1, driver_id: 1, latitude: 18.51670000, longitude: 73.84150000, speed: 32.50, heading: 180.00, timestamp: new Date() },
    { id: 2, trip_id: 2, bus_id: 3, driver_id: 3, latitude: 19.25900000, longitude: 72.86300000, speed: 35.00, heading: 200.00, timestamp: new Date() }
  ],
  notifications: [
    { id: 1, user_id: 5, title: 'Trip Started', message: 'Morning pickup trip has been started for BUS-01 from Shivaji Nagar Station.', type: 'TRIP', is_read: false, created_at: new Date() },
    { id: 2, user_id: 6, title: 'Trip Started', message: 'Morning pickup trip has been started for BUS-01.', type: 'TRIP', is_read: false, created_at: new Date() },
    { id: 3, user_id: 9, title: 'Trip Started — Mumbai Dahisar', message: 'Morning pickup trip has been started for MH-02-BUS-03 from Dahisar Check Naka.', type: 'TRIP', is_read: false, created_at: new Date() },
    { id: 4, user_id: 9, title: 'Bus Approaching Pickup Stop', message: 'MH-02-BUS-03 is approaching Rawalpada Metro Station. Please prepare Rohan for pickup.', type: 'PICKUP', is_read: false, created_at: new Date(Date.now() - 5 * 60000) },
    { id: 5, user_id: 9, title: 'Rohan Boarded Bus', message: 'Rohan Mehta has been confirmed boarded on MH-02-BUS-03 at Rawalpada Metro Station.', type: 'BOARDING', is_read: true, created_at: new Date(Date.now() - 15 * 60000) }
  ],
  emergency_alerts: []
};

const initDatabase = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'eduride_db';
  const port = process.env.DB_PORT || 3306;

  try {
    // Attempt connecting to MySQL server
    const tempConn = await mysql.createConnection({ host, user, password, port });
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await tempConn.end();

    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Verify database tables exist
    const [tables] = await pool.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('⚡ MySQL Database empty. Running schema and seed initialization...');
      const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
      const seedSql = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf-8');

      // Execute schema statements
      const schemaStatements = schemaSql.split(';').filter(stmt => stmt.trim().length > 0);
      for (const stmt of schemaStatements) {
        if (!stmt.toLowerCase().includes('create database') && !stmt.toLowerCase().includes('use eduride_db')) {
          await pool.query(stmt);
        }
      }

      // Execute seed statements
      const seedStatements = seedSql.split(';').filter(stmt => stmt.trim().length > 0);
      for (const stmt of seedStatements) {
        if (!stmt.toLowerCase().includes('use eduride_db')) {
          await pool.query(stmt);
        }
      }
      console.log('✅ Database schema and seed data loaded successfully!');
    } else {
      console.log(`✅ Connected to MySQL database "${database}" successfully.`);
    }
  } catch (err) {
    console.warn(`⚠️ Could not connect to MySQL server (${err.message}). Using built-in In-Memory Data Store for seamless local execution.`);
    useFallbackStore = true;
  }
};

const getMemoryStore = () => memoryStore;
const isMemoryMode = () => useFallbackStore || pool === null;

const query = async (sql, params = []) => {
  if (isMemoryMode() || !pool) {
    throw new Error("Direct SQL string query requested in fallback mode. Use model abstraction.");
  }
  const [rows] = await pool.query(sql, params);
  return rows;
};

module.exports = {
  initDatabase,
  getPool: () => pool,
  query,
  getMemoryStore,
  isMemoryMode
};
