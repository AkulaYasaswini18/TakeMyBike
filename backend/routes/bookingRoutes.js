const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const bookingController = require('../controllers/bookingController');

// Renter routes
router.post('/', authenticate, authorize('renter'), bookingController.createBooking);
router.get('/my-bookings', authenticate, authorize('renter'), bookingController.getMyBookings);

// Owner routes
router.get('/owner/requests', authenticate, authorize('owner'), bookingController.getOwnerBookings);
router.put('/:id/approve', authenticate, authorize('owner'), bookingController.approveBooking);
router.put('/:id/reject', authenticate, authorize('owner'), bookingController.rejectBooking);
router.post('/:id/confirm-cash-payment', authenticate, authorize('owner'), bookingController.confirmCashPayment);

module.exports = router;
