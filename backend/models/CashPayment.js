const mongoose = require('mongoose');

const CashPaymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['CASH'], default: 'CASH' },
  status: { type: String, enum: ['PENDING','RECEIVED','NOT_RECEIVED','DISPUTED'], default: 'PENDING' },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CashPayment', CashPaymentSchema);
