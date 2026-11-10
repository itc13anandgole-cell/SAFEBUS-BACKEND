const dbModel = require('../models/dbModel');

const getBuses = async (req, res, next) => {
  try {
    const school_id = req.user.school_id;
    const buses = await dbModel.getBusesBySchool(school_id);
    res.status(200).json({ success: true, buses });
  } catch (err) {
    next(err);
  }
};

const createBus = async (req, res, next) => {
  try {
    const school_id = req.user.school_id;
    const { bus_number, registration_number, capacity, model } = req.body;
    if (!bus_number || !registration_number) {
      return res.status(400).json({ success: false, message: 'Bus number and registration number are required.' });
    }
    const bus = await dbModel.createBus({ school_id, bus_number, registration_number, capacity, model });
    res.status(201).json({ success: true, message: 'Bus registered successfully', bus });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBuses,
  createBus
};
