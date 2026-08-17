const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  rentalAmount: { type: Number, default: 0 },
  securityDeposit: { type: Number, default: 0 },
  totalCash: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['PENDING','APPROVED','REJECTED','CASH_PAYMENT_PENDING','CASH_PAYMENT_CONFIRMED','ACTIVE','COMPLETED','CANCELLED','DISPUTED'],
    default: 'PENDING'
  },
  otp: { type: String },
  otpVerifiedAt: { type: Date },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
