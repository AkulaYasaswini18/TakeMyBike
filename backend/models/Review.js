const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike' },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerRole: { type: String, enum: ['renter', 'owner'], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true },

  // Renter rating dimensions:
  bikeConditionRating: { type: Number, min: 1, max: 5 },
  ownerRating: { type: Number, min: 1, max: 5 },
  overallRating: { type: Number, min: 1, max: 5 },

  // Owner rating dimensions:
  renterRating: { type: Number, min: 1, max: 5 },
  communicationRating: { type: Number, min: 1, max: 5 },
  bikeHandlingRating: { type: Number, min: 1, max: 5 },

  category: { type: String, enum: ['bike', 'owner', 'renter'], default: 'bike' }
}, { timestamps: true });

ReviewSchema.index({ booking: 1, fromUser: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
