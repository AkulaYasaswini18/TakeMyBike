const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['renter', 'owner', 'admin'], default: 'renter' },
  phone: { type: String },
  isVerified: { type: Boolean, default: false },
  profileImage: { type: String },
  rating: { type: Number, min: 0, max: 5, default: 0 },
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', UserSchema);
