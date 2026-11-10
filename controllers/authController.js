const bcrypt = require('bcryptjs');
const dbModel = require('../models/dbModel');
const { generateToken } = require('../config/jwt');

/**
 * Handles unified login for Super Admin, School Admin, Parent, Driver
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await dbModel.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact school administration.' });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT token containing payload
    const tokenPayload = {
      id: user.id,
      school_id: user.school_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    };

    const token = generateToken(tokenPayload);

    // Fetch extra role metadata
    let metadata = {};
    if (user.role === 'PARENT') {
      metadata = await dbModel.getParentStudentDetails(user.id);
    } else if (user.role === 'DRIVER') {
      metadata = await dbModel.getDriverDetailsByUserId(user.id);
    } else if (user.role === 'SCHOOL_ADMIN' && user.school_id) {
      const school = await dbModel.findSchoolById(user.school_id);
      metadata = { school };
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        school_id: user.school_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      metadata
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Parent Registration with Strict Verification against School Student Records
 */
const registerParent = async (req, res, next) => {
  try {
    const {
      admission_number,
      parent_email,
      mobile_number,
      password,
      relationship
    } = req.body;

    if (!admission_number || !parent_email || !mobile_number || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: admission number, email, mobile, password.'
      });
    }

    // 1. Verify student exists by Admission Number
    const student = await dbModel.findStudentByAdmission(admission_number.trim());

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Student details not found or parent information does not match school records.'
      });
    }

    // 2. Verify that parent email OR mobile matches registered student parent records
    const emailMatch = student.parent_email.toLowerCase() === parent_email.trim().toLowerCase();
    const phoneMatch = student.parent_phone === mobile_number.trim() || student.emergency_contact === mobile_number.trim();

    if (!emailMatch && !phoneMatch) {
      return res.status(400).json({
        success: false,
        message: 'Student details not found or parent information does not match school records.'
      });
    }

    // 3. Check if parent user already exists
    const existingUser = await dbModel.findUserByEmail(parent_email.trim());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login.'
      });
    }

    // 4. Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 5. Create Parent User Account & Link to Student
    const userData = {
      school_id: student.school_id,
      full_name: `${relationship || 'Parent'} of ${student.first_name}`,
      email: parent_email.trim(),
      phone: mobile_number.trim(),
      password_hash,
      role: 'PARENT'
    };

    const { user } = await dbModel.createParentAccount(userData, student.id, relationship || 'Father');

    // Generate JWT
    const token = generateToken({
      id: user.id,
      school_id: user.school_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    });

    const parentMetadata = await dbModel.getParentStudentDetails(user.id);

    res.status(201).json({
      success: true,
      message: 'Parent registration verified and account created successfully!',
      token,
      user: {
        id: user.id,
        school_id: user.school_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      metadata: parentMetadata
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get profile of currently logged-in user
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await dbModel.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    let metadata = {};
    if (user.role === 'PARENT') {
      metadata = await dbModel.getParentStudentDetails(user.id);
    } else if (user.role === 'DRIVER') {
      metadata = await dbModel.getDriverDetailsByUserId(user.id);
    } else if (user.role === 'SCHOOL_ADMIN' && user.school_id) {
      const school = await dbModel.findSchoolById(user.school_id);
      metadata = { school };
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        school_id: user.school_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      },
      metadata
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  registerParent,
  getProfile
};
