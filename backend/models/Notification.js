const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'BOOKING_REQUESTED',
      'BOOKING_APPROVED',
      'BOOKING_REJECTED',
      'CASH_PAYMENT_PENDING',
      'CASH_PAYMENT_CONFIRMED',
      'RENTAL_ACTIVE',
      'RETURN_COMPLETED',
      'DEPOSIT_REFUNDED',
      'DISPUTE_CREATED',
      'REVIEW_RECEIVED',
      'SYSTEM'
    ],
    default: 'SYSTEM'
  },
  link: { type: String },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
