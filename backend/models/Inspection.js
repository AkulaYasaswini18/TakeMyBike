const mongoose = require('mongoose');

const ImagesSubSchema = new mongoose.Schema({
  front: { type: String },
  back: { type: String },
  left: { type: String },
  right: { type: String },
  odometer: { type: String },
  damage: { type: String }
}, { _id: false });

const InspectionSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  phase: { type: String, enum: ['BEFORE','AFTER'], required: true },
  images: ImagesSubSchema,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Inspection', InspectionSchema);
