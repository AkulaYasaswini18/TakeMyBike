const mongoose = require('mongoose');

const SecurityDepositSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['HELD_BY_OWNER','REFUND_PENDING','REFUNDED_DIRECTLY_BY_OWNER','DISPUTED'], default: 'HELD_BY_OWNER' },
  refundMethod: { type: String, enum: ['DIRECT_CASH'], default: 'DIRECT_CASH' },
  refundedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SecurityDeposit', SecurityDepositSchema);
