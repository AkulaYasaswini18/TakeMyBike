const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const User = require('../models/User');
const CashPayment = require('../models/CashPayment');

// Create a booking request
exports.createBooking = async (req, res, next) => {
  try {
    const { bikeId, startDate, endDate } = req.body;
    
    if (!bikeId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Only renters can book
    if (req.user.role !== 'renter') {
      return res.status(403).json({ error: 'Only renters can create bookings' });
    }

    // User must be verified
    if (!req.user.isVerified) {
      return res.status(403).json({ error: 'Only verified users can book bikes' });
    }

    const bike = await Bike.findById(bikeId);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });

    // Cannot book own bike
    if (bike.owner.toString() === req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot book your own bike' });
    }

    // Bike must be approved and available
    if (!bike.isApproved || !bike.isAvailable) {
      return res.status(400).json({ error: 'Bike is not available for booking' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Check for overlapping confirmed bookings
    const overlapping = await Booking.findOne({
      bike: bikeId,
      status: { $in: ['APPROVED', 'CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED'] },
      $or: [
        { startDate: { $lt: end }, endDate: { $gt: start } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ error: 'Bike is already booked for the requested dates' });
    }

    // Calculate amounts
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const rentalAmount = days * bike.pricePerDay;
    const securityDeposit = bike.securityDeposit || 0;
    const totalCash = rentalAmount + securityDeposit;

    const booking = await Booking.create({
      renter: req.user._id,
      bike: bikeId,
      owner: bike.owner,
      startDate: start,
      endDate: end,
      rentalAmount,
      securityDeposit,
      totalCash,
      status: 'PENDING'
    });

    const populated = await booking.populate(['renter', 'bike', 'owner']);
    res.status(201).json({ booking: populated });
  } catch (err) {
    next(err);
  }
};

// Get renter's bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    if (req.user.role !== 'renter') {
      return res.status(403).json({ error: 'Only renters can view their bookings' });
    }

    const bookings = await Booking.find({ renter: req.user._id })
      .populate('bike', 'brand model pricePerDay images')
      .populate('owner', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
};

// Get owner's rental requests
exports.getOwnerBookings = async (req, res, next) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can view rental requests' });
    }

    const bookings = await Booking.find({ owner: req.user._id })
      .populate('renter', 'name phone rating')
      .populate('bike', 'brand model pricePerDay images')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
};

// Approve a booking
exports.approveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Owner only
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Can only approve pending bookings
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot approve booking with status ${booking.status}` });
    }

    booking.status = 'CASH_PAYMENT_PENDING';
    await booking.save();

    const populated = await booking.populate(['renter', 'bike', 'owner']);
    res.json({ booking: populated, message: 'Booking approved' });
  } catch (err) {
    next(err);
  }
};

// Reject a booking
exports.rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Owner only
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Can only reject pending bookings
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot reject booking with status ${booking.status}` });
    }

    booking.status = 'REJECTED';
    await booking.save();

    const populated = await booking.populate(['renter', 'bike', 'owner']);
    res.json({ booking: populated, message: 'Booking rejected' });
  } catch (err) {
    next(err);
  }
};

// Owner confirms cash payment received
exports.confirmCashPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Owner only
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized. Only the bike owner can confirm cash payment.' });
    }

    // Check invalid statuses
    if (['REJECTED', 'CANCELLED'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot confirm cash payment for a ${booking.status.toLowerCase()} booking` });
    }

    // Find or create CashPayment record
    let payment = await CashPayment.findOne({ booking: booking._id });
    if (!payment) {
      payment = new CashPayment({
        booking: booking._id,
        amount: booking.totalCash,
        paymentMethod: 'CASH',
        status: 'RECEIVED',
        confirmedBy: req.user._id,
        confirmedAt: new Date(),
        notes: req.body.notes || 'In-person cash payment received by owner'
      });
    } else {
      payment.amount = booking.totalCash;
      payment.paymentMethod = 'CASH';
      payment.status = 'RECEIVED';
      payment.confirmedBy = req.user._id;
      payment.confirmedAt = new Date();
      if (req.body.notes) {
        payment.notes = req.body.notes;
      }
    }
    await payment.save();

    // Mark Booking status = CASH_PAYMENT_CONFIRMED
    booking.status = 'CASH_PAYMENT_CONFIRMED';
    await booking.save();

    const populated = await booking.populate(['renter', 'bike', 'owner']);
    res.json({
      booking: populated,
      payment,
      message: 'Cash payment confirmed successfully'
    });
  } catch (err) {
    next(err);
  }
};

