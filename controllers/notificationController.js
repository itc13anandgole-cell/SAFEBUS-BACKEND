const dbModel = require('../models/dbModel');

const getNotifications = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const notifications = await dbModel.getUserNotifications(user_id);
    res.status(200).json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications
};
