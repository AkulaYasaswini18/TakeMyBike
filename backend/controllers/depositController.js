const SecurityDeposit = require('../models/SecurityDeposit');
const Booking = require('../models/Booking');
const { createNotification } = require('./notificationController');

// Get security deposit for a booking
exports.getDepositByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const userId = req.user._id.toString();
    const isOwner = booking.owner && booking.owner.toString() === userId;
    const isRenter = booking.renter && booking.renter.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isRenter && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view deposit for this booking' });
    }

    let deposit = await SecurityDeposit.findOne({ booking: bookingId })
      .populate('booking', 'status rentalAmount securityDeposit totalCash');

    if (!deposit) {
      // Create a default initial record if not present
      deposit = await SecurityDeposit.create({
        booking: booking._id,
        amount: booking.securityDeposit || 0,
        status: ['COMPLETED'].includes(booking.status) ? 'REFUND_PENDING' : 'HELD_BY_OWNER',
        refundMethod: 'DIRECT_CASH'
      });
    }

    res.json({ securityDeposit: deposit });
  } catch (err) {
    next(err);
  }
};

// Owner marks security deposit as REFUNDED_DIRECTLY_BY_OWNER
exports.refundDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search by deposit _id or by booking _id
    let deposit = await SecurityDeposit.findById(id).populate('booking');
    if (!deposit) {
      deposit = await SecurityDeposit.findOne({ booking: id }).populate('booking');
    }

    if (!deposit) {
      return res.status(404).json({ error: 'Security deposit record not found' });
    }

    const booking = deposit.booking;
    if (!booking) {
      return res.status(404).json({ error: 'Associated booking not found' });
    }

    // Owner only
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized. Only the bike owner can record deposit refunds.' });
    }

    deposit.status = 'REFUNDED_DIRECTLY_BY_OWNER';
    deposit.refundMethod = 'DIRECT_CASH';
    deposit.refundedAt = new Date();
    if (req.body.notes) {
      deposit.notes = req.body.notes;
    } else if (!deposit.notes) {
      deposit.notes = 'Security deposit refunded directly in cash by owner';
    }

    await deposit.save();

    // Notify renter that deposit has been refunded
    if (booking.renter) {
      await createNotification(booking.renter, {
        title: 'Security Deposit Refunded',
        message: `The owner confirmed direct cash return of your ₹${deposit.amount} security deposit.`,
        type: 'DEPOSIT_REFUNDED',
        link: '/my-bookings',
        booking: booking._id
      });
    }

    res.json({
      message: 'Security deposit marked as refunded directly by owner',
      securityDeposit: deposit
    });
  } catch (err) {
    next(err);
  }
};
