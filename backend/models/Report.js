const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['bike', 'user', 'booking'], required: true },
  targetBike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  reason: {
    type: String,
    enum: [
      'fake bike',
      'wrong info',
      'suspicious owner',
      'payment disagreement',
      'damage',
      'deposit dispute',
      'other'
    ],
    required: true
  },
  description: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED'],
    default: 'PENDING'
  },
  adminNotes: { type: String, trim: true },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
