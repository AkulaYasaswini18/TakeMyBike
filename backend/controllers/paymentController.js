const Booking = require('../models/Booking');
const CashPayment = require('../models/CashPayment');

// Get payment details for a specific booking
exports.getBookingPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('renter', 'name email phone')
      .populate('owner', 'name email phone')
      .populate('bike', 'brand model pricePerDay securityDeposit');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization: must be the renter, owner, or admin
    const userId = req.user._id.toString();
    const isRenter = booking.renter && booking.renter._id.toString() === userId;
    const isOwner = booking.owner && booking.owner._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isRenter && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view payment details for this booking' });
    }

    const payment = await CashPayment.findOne({ booking: booking._id })
      .populate('confirmedBy', 'name email phone');

    res.json({
      booking: {
        _id: booking._id,
        status: booking.status,
        rentalAmount: booking.rentalAmount,
        securityDeposit: booking.securityDeposit,
        totalCash: booking.totalCash,
        startDate: booking.startDate,
        endDate: booking.endDate,
        bike: booking.bike,
        renter: booking.renter,
        owner: booking.owner
      },
      payment: payment || {
        booking: booking._id,
        amount: booking.totalCash,
        paymentMethod: 'CASH',
        status: booking.status === 'CASH_PAYMENT_CONFIRMED' ? 'RECEIVED' : 'PENDING'
      }
    });
  } catch (err) {
    next(err);
  }
};
