const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const depositController = require('../controllers/depositController');

// PUT /api/deposits/:id/refund — owner only marks REFUNDED_DIRECTLY_BY_OWNER
router.put('/:id/refund', authenticate, authorize('owner'), depositController.refundDeposit);

// GET /api/deposits/booking/:bookingId — view security deposit status
router.get('/booking/:bookingId', authenticate, depositController.getDepositByBooking);

module.exports = router;
