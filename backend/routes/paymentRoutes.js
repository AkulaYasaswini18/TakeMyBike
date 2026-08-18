const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const paymentController = require('../controllers/paymentController');

// GET /api/payments/booking/:bookingId - Get payment record for a booking
router.get('/booking/:bookingId', authenticate, paymentController.getBookingPayment);

module.exports = router;
