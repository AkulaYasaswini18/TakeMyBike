const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const User = require('../models/User');
const CashPayment = require('../models/CashPayment');
const Inspection = require('../models/Inspection');
const SecurityDeposit = require('../models/SecurityDeposit');
const Dispute = require('../models/Dispute');
const { createNotification } = require('./notificationController');

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

    // Notify bike owner of new request
    await createNotification(bike.owner, {
      title: 'New Rental Request',
      message: `You received a new booking request for ${bike.brand} ${bike.model} from ${req.user.name || 'a renter'}.`,
      type: 'BOOKING_REQUESTED',
      link: '/rental-requests',
      booking: booking._id
    });

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

    // Notify renter that booking was approved
    await createNotification(booking.renter, {
      title: 'Booking Approved',
      message: `Your booking for ${populated.bike?.brand || 'the bike'} ${populated.bike?.model || ''} was approved! Please pay ₹${booking.totalCash} in cash directly to the owner at handover.`,
      type: 'BOOKING_APPROVED',
      link: '/my-bookings',
      booking: booking._id
    });

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

    // Notify renter that booking was rejected
    await createNotification(booking.renter, {
      title: 'Booking Rejected',
      message: `Your booking request for ${populated.bike?.brand || 'the bike'} ${populated.bike?.model || ''} was rejected by the owner.`,
      type: 'BOOKING_REJECTED',
      link: '/my-bookings',
      booking: booking._id
    });

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

    // Notify renter that cash payment was received
    await createNotification(booking.renter, {
      title: 'Cash Payment Received',
      message: `The owner confirmed receipt of ₹${booking.totalCash} cash payment. Ask the owner for your 6-digit Handover OTP to start the rental!`,
      type: 'CASH_PAYMENT_CONFIRMED',
      link: '/my-bookings',
      booking: booking._id
    });

    res.json({
      booking: populated,
      payment,
      message: 'Cash payment confirmed successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Owner generates 6-digit handover OTP (only if cash payment is RECEIVED)
exports.generateOtp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Owner only
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized. Only the bike owner can generate the handover OTP.' });
    }

    // Must have CashPayment.status === 'RECEIVED'
    const cashPayment = await CashPayment.findOne({ booking: booking._id });
    if (!cashPayment || cashPayment.status !== 'RECEIVED') {
      return res.status(400).json({ error: 'Cash payment must be confirmed as RECEIVED before generating handover OTP' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    booking.otp = otp;
    await booking.save();

    const populated = await booking.populate(['renter', 'bike', 'owner']);
    res.json({
      message: 'Handover OTP generated successfully',
      otp,
      booking: populated
    });
  } catch (err) {
    next(err);
  }
};

// Renter enters 6-digit OTP code to verify and start rental
exports.verifyOtp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Renter only
    if (booking.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized. Only the renter can verify the handover OTP.' });
    }

    if (!booking.otp || booking.otp.trim() !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid OTP code. Please check with the bike owner.' });
    }

    booking.status = 'ACTIVE';
    booking.otpVerifiedAt = new Date();
    booking.rentalStartTime = new Date();
    await booking.save();

    const populated = await booking.populate(['renter', 'bike', 'owner']);

    // Notify owner and renter that rental is now ACTIVE
    await createNotification(booking.owner, {
      title: 'Rental Active',
      message: `Handover OTP verified! Rental for ${populated.bike?.brand || 'your bike'} ${populated.bike?.model || ''} is now ACTIVE.`,
      type: 'RENTAL_ACTIVE',
      link: '/rental-requests',
      booking: booking._id
    });
    await createNotification(booking.renter, {
      title: 'Rental Active',
      message: `OTP verified! Your rental for ${populated.bike?.brand || 'the bike'} ${populated.bike?.model || ''} is now active. Enjoy your ride!`,
      type: 'RENTAL_ACTIVE',
      link: '/my-bookings',
      booking: booking._id
    });

    res.json({
      message: 'OTP verified successfully. Rental is now ACTIVE!',
      booking: populated
    });
  } catch (err) {
    next(err);
  }
};

// Upload BEFORE or AFTER inspection photos (front, back, left, right, odometer, damage)
exports.uploadInspection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const phase = req.body.phase;

    if (!phase || !['BEFORE', 'AFTER'].includes(phase.toUpperCase())) {
      return res.status(400).json({ error: 'Inspection phase must be BEFORE or AFTER' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Owner or renter only
    const userId = req.user._id.toString();
    const isOwner = booking.owner.toString() === userId;
    const isRenter = booking.renter.toString() === userId;

    if (!isOwner && !isRenter) {
      return res.status(403).json({ error: 'Not authorized to upload inspection photos for this booking' });
    }

    const normalizedPhase = phase.toUpperCase();

    // Collect image paths from multipart files or body urls
    const images = {};
    const angles = ['front', 'back', 'left', 'right', 'odometer', 'damage'];
    
    // Check if uploaded via multer (req.files)
    if (req.files) {
      angles.forEach(angle => {
        if (req.files[angle] && req.files[angle][0]) {
          images[angle] = `/uploads/${req.files[angle][0].filename}`;
        }
      });
    }

    // Also check req.body in case image URLs are sent or passed as json/strings
    angles.forEach(angle => {
      if (req.body[angle] && typeof req.body[angle] === 'string' && !images[angle]) {
        images[angle] = req.body[angle];
      }
    });

    let inspection = await Inspection.findOne({ booking: booking._id, phase: normalizedPhase });
    if (!inspection) {
      inspection = new Inspection({
        booking: booking._id,
        phase: normalizedPhase,
        uploadedBy: req.user._id,
        images
      });
    } else {
      inspection.uploadedBy = req.user._id;
      inspection.images = {
        ...(inspection.images ? inspection.images.toObject() : {}),
        ...images
      };
    }

    await inspection.save();
    const populated = await inspection.populate('uploadedBy', 'name email role');

    res.status(201).json({
      message: `${normalizedPhase} inspection photos uploaded successfully`,
      inspection: populated
    });
  } catch (err) {
    next(err);
  }
};

// Get all inspections for a booking
exports.getBookingInspections = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Must be owner, renter, or admin
    const userId = req.user._id.toString();
    const isOwner = booking.owner.toString() === userId;
    const isRenter = booking.renter.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isRenter && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view inspections for this booking' });
    }

    const inspections = await Inspection.find({ booking: booking._id })
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: 1 });

    res.json({ inspections });
  } catch (err) {
    next(err);
  }
};

// Owner processes bike return (after-rental inspection + damage flagging + deposit lifecycle)
exports.returnBike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hasDamage, damageNotes, disputeReason } = req.body;

    const booking = await Booking.findById(id).populate('bike');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Owner only
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized. Only the bike owner can process bike returns.' });
    }

    // Booking must be ACTIVE
    if (!['ACTIVE', 'CASH_PAYMENT_CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot process return for booking with status ${booking.status}` });
    }

    // Handle AFTER inspection photos (files or URLs)
    const angles = ['front', 'back', 'left', 'right', 'odometer', 'damage'];
    const images = {};

    if (req.files) {
      angles.forEach(angle => {
        if (req.files[angle] && req.files[angle][0]) {
          images[angle] = `/uploads/${req.files[angle][0].filename}`;
        }
      });
    }

    angles.forEach(angle => {
      if (req.body[angle] && typeof req.body[angle] === 'string' && !images[angle]) {
        images[angle] = req.body[angle];
      }
    });

    let afterInspection = await Inspection.findOne({ booking: booking._id, phase: 'AFTER' });

    if (Object.keys(images).length > 0) {
      if (!afterInspection) {
        afterInspection = new Inspection({
          booking: booking._id,
          phase: 'AFTER',
          uploadedBy: req.user._id,
          images
        });
      } else {
        afterInspection.images = {
          ...(afterInspection.images ? (afterInspection.images.toObject ? afterInspection.images.toObject() : afterInspection.images) : {}),
          ...images
        };
        afterInspection.uploadedBy = req.user._id;
      }
      await afterInspection.save();
    }

    // Verify that AFTER inspection exists and has at least one photo
    if (!afterInspection || !afterInspection.images || Object.keys(afterInspection.images.toObject ? afterInspection.images.toObject() : afterInspection.images).length === 0) {
      return res.status(400).json({ error: 'After-rental inspection photos are required before confirming bike return' });
    }

    // Find or create SecurityDeposit record
    let deposit = await SecurityDeposit.findOne({ booking: booking._id });
    if (!deposit) {
      deposit = new SecurityDeposit({
        booking: booking._id,
        amount: booking.securityDeposit || 0,
        status: 'HELD_BY_OWNER',
        refundMethod: 'DIRECT_CASH'
      });
    }

    let disputeRecord = null;
    const isDamageFlagged = hasDamage === true || hasDamage === 'true' || Boolean(damageNotes && damageNotes.trim());

    if (isDamageFlagged) {
      // Mark as DISPUTED
      booking.status = 'DISPUTED';
      deposit.status = 'DISPUTED';
      if (damageNotes) deposit.notes = damageNotes;
      await deposit.save();

      // Create Dispute record
      disputeRecord = await Dispute.create({
        booking: booking._id,
        raisedBy: req.user._id,
        reason: damageNotes || disputeReason || 'Damage reported during post-rental return inspection',
        status: 'OPEN'
      });
    } else {
      // Mark as COMPLETED
      booking.status = 'COMPLETED';
      booking.rentalEndTime = new Date();
      deposit.status = 'REFUND_PENDING';
      await deposit.save();

      // Make bike available again for future bookings
      if (booking.bike) {
        await Bike.findByIdAndUpdate(booking.bike._id || booking.bike, { isAvailable: true });
      }
    }

    await booking.save();
    const populated = await booking.populate(['renter', 'bike', 'owner']);

    if (isDamageFlagged) {
      // Notify renter of dispute
      await createNotification(booking.renter, {
        title: 'Damage Flagged / Dispute Opened',
        message: `Damage was reported during the return inspection for ${populated.bike?.brand || 'the bike'}. A dispute has been opened and the deposit is withheld.`,
        type: 'DISPUTE_CREATED',
        link: '/my-bookings',
        booking: booking._id
      });
    } else {
      // Notify renter of completed return and pending direct refund
      await createNotification(booking.renter, {
        title: 'Bike Return Completed',
        message: `Your return for ${populated.bike?.brand || 'the bike'} ${populated.bike?.model || ''} was confirmed! The owner will hand over your ₹${deposit.amount} security deposit directly in cash.`,
        type: 'RETURN_COMPLETED',
        link: '/my-bookings',
        booking: booking._id
      });
    }

    res.json({
      message: isDamageFlagged
        ? 'Return processed with damage flagged. Booking and security deposit marked as DISPUTED.'
        : 'Bike return completed successfully. Security deposit is now REFUND_PENDING for direct return.',
      booking: populated,
      securityDeposit: deposit,
      dispute: disputeRecord
    });
  } catch (err) {
    next(err);
  }
};



