const dbModel = require('../models/dbModel');

const getStudents = async (req, res, next) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(400).json({ success: false, message: 'School ID missing in session.' });
    }
    const students = await dbModel.getStudentsBySchool(school_id);
    res.status(200).json({ success: true, students });
  } catch (err) {
    next(err);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const school_id = req.user.school_id;
    const { admission_number, first_name, last_name, grade, section, emergency_contact, parent_email, parent_phone, address } = req.body;
    if (!admission_number || !first_name || !last_name || !parent_email) {
      return res.status(400).json({ success: false, message: 'Admission number, student name, and parent email are required.' });
    }

    const newStudent = await dbModel.createStudent({
      school_id,
      admission_number: admission_number.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      grade: grade || 'Grade 1',
      section: section || 'A',
      emergency_contact: emergency_contact || parent_phone,
      parent_email: parent_email.trim(),
      parent_phone: parent_phone ? parent_phone.trim() : '',
      address: address || 'Pune'
    });

    res.status(201).json({ success: true, message: 'Student registered successfully', student: newStudent });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudents,
  createStudent
};
