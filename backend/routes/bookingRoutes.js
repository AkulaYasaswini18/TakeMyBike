const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');
const bookingController = require('../controllers/bookingController');

// Renter routes
router.post('/', authenticate, authorize('renter'), bookingController.createBooking);
router.get('/my-bookings', authenticate, authorize('renter'), bookingController.getMyBookings);
router.post('/:id/verify-otp', authenticate, authorize('renter'), bookingController.verifyOtp);

// Owner routes
router.get('/owner/requests', authenticate, authorize('owner'), bookingController.getOwnerBookings);
router.put('/:id/approve', authenticate, authorize('owner'), bookingController.approveBooking);
router.put('/:id/reject', authenticate, authorize('owner'), bookingController.rejectBooking);
router.post('/:id/confirm-cash-payment', authenticate, authorize('owner'), bookingController.confirmCashPayment);
router.post('/:id/generate-otp', authenticate, authorize('owner'), bookingController.generateOtp);

// Shared / booking-level inspection routes (Renter & Owner)
router.post(
  '/:id/inspection',
  authenticate,
  upload.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 },
    { name: 'left', maxCount: 1 },
    { name: 'right', maxCount: 1 },
    { name: 'odometer', maxCount: 1 },
    { name: 'damage', maxCount: 1 }
  ]),
  bookingController.uploadInspection
);
router.get('/:id/inspections', authenticate, bookingController.getBookingInspections);

module.exports = router;
