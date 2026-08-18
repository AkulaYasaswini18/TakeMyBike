const mongoose = require('mongoose');

const BikeSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String },
  model: { type: String },
  type: { type: String },
  year: { type: Number },
  registrationNumber: { type: String },
  description: { type: String },
  pricePerDay: { type: Number },
  securityDeposit: { type: Number },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    area: { type: String }
  },
  condition: { type: String },
  isApproved: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  images: [{ type: String }],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 }
}, { timestamps: true });

BikeSchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('Bike', BikeSchema);
