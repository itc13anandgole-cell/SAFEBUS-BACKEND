const dbModel = require('../models/dbModel');

const getSchools = async (req, res, next) => {
  try {
    const schools = await dbModel.getSchools();
    res.status(200).json({ success: true, schools });
  } catch (err) {
    next(err);
  }
};

const getSchoolDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const school = await dbModel.findSchoolById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    res.status(200).json({ success: true, school });
  } catch (err) {
    next(err);
  }
};

const createSchool = async (req, res, next) => {
  try {
    const { school_name, school_code, official_email, phone, address, city, state, pincode } = req.body;
    if (!school_name || !school_code || !official_email) {
      return res.status(400).json({ success: false, message: 'School name, code, and email are required.' });
    }
    const school = await dbModel.createSchool(req.body);
    res.status(201).json({ success: true, message: 'School added successfully', school });
  } catch (err) {
    next(err);
  }
};

const updateSchoolStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid school status.' });
    }
    const updated = await dbModel.updateSchoolStatus(id, status);
    res.status(200).json({ success: true, message: `School status updated to ${status}`, school: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSchools,
  getSchoolDetails,
  createSchool,
  updateSchoolStatus
};
