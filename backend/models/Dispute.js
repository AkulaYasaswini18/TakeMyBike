const mongoose = require('mongoose');

const DisputeSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['OPEN','RESOLVED','REJECTED'], default: 'OPEN' },
  adminNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Dispute', DisputeSchema);
