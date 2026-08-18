const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const User = require('../models/User');

// Helper to recalculate and store average ratings on Bike and User
async function recalculateAverages(bikeId, toUserId, isRenter) {
  try {
    // Recalculate Bike rating from renter reviews
    if (bikeId && isRenter) {
      const bikeReviews = await Review.find({ bike: bikeId, reviewerRole: 'renter' });
      if (bikeReviews.length > 0) {
        const totalRating = bikeReviews.reduce((sum, r) => sum + (r.rating || r.overallRating || 0), 0);
        const avgBikeRating = Number((totalRating / bikeReviews.length).toFixed(1));
        await Bike.findByIdAndUpdate(bikeId, {
          rating: avgBikeRating,
          numReviews: bikeReviews.length
        });
      }
    }

    // Recalculate User rating from all received reviews
    if (toUserId) {
      const userReviews = await Review.find({ toUser: toUserId });
      if (userReviews.length > 0) {
        const totalUserRating = userReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        const avgUserRating = Number((totalUserRating / userReviews.length).toFixed(1));
        await User.findByIdAndUpdate(toUserId, {
          rating: avgUserRating,
          numReviews: userReviews.length
        });
      }
    }
  } catch (err) {
    console.error('Error recalculating ratings:', err);
  }
}

// POST /api/reviews - Submit review for completed booking
exports.createReview = async (req, res, next) => {
  try {
    const {
      bookingId,
      rating,
      comment,
      bikeConditionRating,
      ownerRating,
      overallRating,
      renterRating,
      communicationRating,
      bikeHandlingRating
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId).populate('bike');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only allowed if booking is COMPLETED
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Reviews are only allowed for completed bookings' });
    }

    // Must be a participant in that booking
    const userId = req.user._id.toString();
    const isRenter = booking.renter && booking.renter.toString() === userId;
    const isOwner = booking.owner && booking.owner.toString() === userId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ error: 'Not authorized. You were not a participant in this booking.' });
    }

    // Check if user has already reviewed this booking
    const existing = await Review.findOne({ booking: booking._id, fromUser: req.user._id });
    if (existing) {
      return res.status(400).json({ error: 'You have already submitted a review for this booking' });
    }

    let reviewData = {
      booking: booking._id,
      bike: booking.bike?._id || booking.bike,
      fromUser: req.user._id,
      comment: (comment || '').trim()
    };

    if (isRenter) {
      // Renter rating dimensions: bike condition, owner, overall
      const bCond = Number(bikeConditionRating) || 5;
      const oRate = Number(ownerRating) || 5;
      const ovRate = Number(overallRating || rating) || Math.round((bCond + oRate) / 2);
      const computedRating = Math.max(1, Math.min(5, Math.round((bCond + oRate + ovRate) / 3)));

      reviewData = {
        ...reviewData,
        toUser: booking.owner,
        reviewerRole: 'renter',
        category: 'bike',
        bikeConditionRating: bCond,
        ownerRating: oRate,
        overallRating: ovRate,
        rating: Number(rating) || computedRating
      };
    } else {
      // Owner rating dimensions: renter, communication, bike handling
      const rRate = Number(renterRating) || 5;
      const commRate = Number(communicationRating) || 5;
      const handRate = Number(bikeHandlingRating) || 5;
      const computedRating = Math.max(1, Math.min(5, Math.round((rRate + commRate + handRate) / 3)));

      reviewData = {
        ...reviewData,
        toUser: booking.renter,
        reviewerRole: 'owner',
        category: 'renter',
        renterRating: rRate,
        communicationRating: commRate,
        bikeHandlingRating: handRate,
        rating: Number(rating) || computedRating
      };
    }

    const review = await Review.create(reviewData);

    // Recalculate average ratings for Bike and Target User
    await recalculateAverages(booking.bike?._id || booking.bike, reviewData.toUser, isRenter);

    const populated = await review.populate([
      { path: 'fromUser', select: 'name profileImage role' },
      { path: 'toUser', select: 'name profileImage role' },
      { path: 'bike', select: 'brand model' }
    ]);

    res.status(201).json({
      message: 'Review submitted successfully',
      review: populated
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/bike/:bikeId - Get reviews for a specific bike
exports.getBikeReviews = async (req, res, next) => {
  try {
    const { bikeId } = req.params;

    const reviews = await Review.find({ bike: bikeId, reviewerRole: 'renter' })
      .populate('fromUser', 'name profileImage role rating')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let avgRating = 0;
    let avgCondition = 0;
    let avgOwner = 0;
    let avgOverall = 0;

    if (totalReviews > 0) {
      avgRating = Number((reviews.reduce((s, r) => s + (r.rating || 0), 0) / totalReviews).toFixed(1));
      avgCondition = Number((reviews.reduce((s, r) => s + (r.bikeConditionRating || r.rating || 0), 0) / totalReviews).toFixed(1));
      avgOwner = Number((reviews.reduce((s, r) => s + (r.ownerRating || r.rating || 0), 0) / totalReviews).toFixed(1));
      avgOverall = Number((reviews.reduce((s, r) => s + (r.overallRating || r.rating || 0), 0) / totalReviews).toFixed(1));
    }

    res.json({
      reviews,
      stats: {
        totalReviews,
        avgRating,
        avgCondition,
        avgOwner,
        avgOverall
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/user/:userId - Get reviews received by a user
exports.getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('name role phone rating numReviews createdAt');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const reviews = await Review.find({ toUser: userId })
      .populate('fromUser', 'name profileImage role')
      .populate('bike', 'brand model images')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? Number((reviews.reduce((s, r) => s + (r.rating || 0), 0) / totalReviews).toFixed(1))
      : (user.rating || 0);

    res.json({
      user,
      reviews,
      stats: {
        totalReviews,
        avgRating
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/booking/:bookingId - Get reviews submitted for a booking
exports.getBookingReviews = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const reviews = await Review.find({ booking: bookingId })
      .populate('fromUser', 'name role')
      .populate('toUser', 'name role');

    res.json({ reviews });
  } catch (err) {
    next(err);
  }
};
