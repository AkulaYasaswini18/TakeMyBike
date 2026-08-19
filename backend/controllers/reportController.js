const Report = require('../models/Report');
const Bike = require('../models/Bike');
const User = require('../models/User');

// POST /api/reports
exports.createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !reason || !description) {
      return res.status(400).json({ error: 'Missing required fields: targetType, reason, description' });
    }

    const validReasons = [
      'fake bike',
      'wrong info',
      'suspicious owner',
      'payment disagreement',
      'damage',
      'deposit dispute',
      'other'
    ];

    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` });
    }

    const reportData = {
      reportedBy: req.user._id,
      targetType,
      reason,
      description: description.trim()
    };

    if (targetType === 'bike') {
      reportData.targetBike = targetId;
    } else if (targetType === 'user') {
      reportData.targetUser = targetId;
    } else if (targetType === 'booking') {
      reportData.targetBooking = targetId;
    }

    const report = await Report.create(reportData);

    const populated = await report.populate([
      { path: 'reportedBy', select: 'name email role' },
      { path: 'targetBike', select: 'brand model' },
      { path: 'targetUser', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Report submitted successfully. Our admin team will review it shortly.',
      report: populated
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/my-reports
exports.getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id })
      .populate('targetBike', 'brand model images')
      .populate('targetUser', 'name role')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (err) {
    next(err);
  }
};
