const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true },
  blockedDates: [{ type: Date }]
}, { timestamps: true });

module.exports = mongoose.model('Availability', AvailabilitySchema);
