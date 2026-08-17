const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  category: { type: String, enum: ['bike','owner','renter'], default: 'bike' }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
