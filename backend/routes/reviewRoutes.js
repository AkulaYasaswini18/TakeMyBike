const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const reviewController = require('../controllers/reviewController');

// POST /api/reviews - submit review (participant only, COMPLETED booking only)
router.post('/', authenticate, reviewController.createReview);

// GET /api/reviews/bike/:bikeId - get reviews for a bike (public/authenticated)
router.get('/bike/:bikeId', reviewController.getBikeReviews);

// GET /api/reviews/user/:userId - get reviews received by a user (public/authenticated)
router.get('/user/:userId', reviewController.getUserReviews);

// GET /api/reviews/booking/:bookingId - get reviews for a specific booking
router.get('/booking/:bookingId', authenticate, reviewController.getBookingReviews);

module.exports = router;
