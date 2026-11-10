const dbModel = require('../models/dbModel');

const getParents = async (req, res, next) => {
  try {
    const school_id = req.user.school_id;
    const parents = await dbModel.getParentsBySchool(school_id);
    res.status(200).json({ success: true, parents });
  } catch (err) {
    next(err);
  }
};

const getMyChildDetails = async (req, res, next) => {
  try {
    const parentUserId = req.user.id;
    const details = await dbModel.getParentStudentDetails(parentUserId);
    if (!details) {
      return res.status(404).json({ success: false, message: 'No student associated with this parent account.' });
    }
    res.status(200).json({ success: true, details });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getParents,
  getMyChildDetails
};
