const bcrypt = require('bcryptjs');
const dbModel = require('../models/dbModel');

const getDrivers = async (req, res, next) => {
  try {
    const school_id = req.user.school_id;
    const drivers = await dbModel.getDriversBySchool(school_id);
    res.status(200).json({ success: true, drivers });
  } catch (err) {
    next(err);
  }
};

const createDriver = async (req, res, next) => {
  try {
    const school_id = req.user.school_id;
    const { full_name, email, phone, password, license_number, experience_years } = req.body;

    if (!full_name || !email || !license_number || !password) {
      return res.status(400).json({ success: false, message: 'Driver name, email, license, and password are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userData = { school_id, full_name, email, phone: phone || '+910000000000', password_hash };
    const driverData = { license_number, experience_years: experience_years || 1 };

    const result = await dbModel.createDriver(userData, driverData);
    res.status(201).json({ success: true, message: 'Driver created successfully', result });
  } catch (err) {
    next(err);
  }
};

const getMyDriverDetails = async (req, res, next) => {
  try {
    const details = await dbModel.getDriverDetailsByUserId(req.user.id);
    if (!details) {
      return res.status(404).json({ success: false, message: 'Driver details not found.' });
    }
    res.status(200).json({ success: true, details });
  } catch (err) {
    next(err);
  }
};

/**
 * Driver uploads their own profile photo + license photo (base64)
 */
const uploadMyProfile = async (req, res, next) => {
  try {
    const { profile_photo, license_photo, aadhar_number } = req.body;
    const updated = await dbModel.uploadDriverProfile(req.user.id, { profile_photo, license_photo, aadhar_number });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Driver record not found.' });
    }
    // Strip heavy base64 from response — just return status
    const safeResponse = { ...updated, profile_photo: updated.profile_photo ? '[PHOTO_UPLOADED]' : null, license_photo: updated.license_photo ? '[PHOTO_UPLOADED]' : null };
    res.status(200).json({ success: true, message: 'Profile submitted for verification.', driver: safeResponse });
  } catch (err) {
    next(err);
  }
};

/**
 * Driver gets their own full profile (including photo)
 */
const getMyProfile = async (req, res, next) => {
  try {
    const details = await dbModel.getDriverDetailsByUserId(req.user.id);
    if (!details) return res.status(404).json({ success: false, message: 'Driver not found.' });
    // Return profile with photo presence flags
    const driver = details.driver || details;
    res.status(200).json({
      success: true,
      profile: {
        ...driver,
        has_profile_photo: !!driver.profile_photo,
        has_license_photo: !!driver.license_photo,
        profile_photo: driver.profile_photo || null,
        license_photo: driver.license_photo || null
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Get all drivers with verification info
 */
const getDriversForVerification = async (req, res, next) => {
  try {
    const school_id = req.user.role === 'SUPER_ADMIN' ? null : req.user.school_id;
    const drivers = await dbModel.getAllDriversForVerification(school_id);
    res.status(200).json({ success: true, drivers });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Get one driver's full verification details + photos
 */
const getDriverVerification = async (req, res, next) => {
  try {
    const { driver_id } = req.params;
    const driver = await dbModel.getDriverVerificationDetails(driver_id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    res.status(200).json({ success: true, driver });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Approve or reject a driver's verification
 */
const updateVerificationStatus = async (req, res, next) => {
  try {
    const { driver_id } = req.params;
    const { verification_status } = req.body;

    const allowed = ['VERIFIED', 'REJECTED', 'PENDING', 'UNDER_REVIEW'];
    if (!allowed.includes(verification_status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Use one of: ${allowed.join(', ')}` });
    }

    const updated = await dbModel.updateDriverVerification(driver_id, {
      verification_status,
      verified_by: req.user.id
    });

    res.status(200).json({ success: true, message: `Driver verification status updated to ${verification_status}.`, driver: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDrivers,
  createDriver,
  getMyDriverDetails,
  uploadMyProfile,
  getMyProfile,
  getDriversForVerification,
  getDriverVerification,
  updateVerificationStatus
};
