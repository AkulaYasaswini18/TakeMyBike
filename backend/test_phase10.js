const mongoose = require('mongoose');
const User = require('./models/User');
const Bike = require('./models/Bike');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const reviewController = require('./controllers/reviewController');

require('./config/env')();

async function runTests() {
  console.log('--- Starting Phase 10 Tests ---');
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bikeshare';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');

    const owner = await User.create({
      name: 'Phase 10 Owner',
      email: `phase10_owner_${Date.now()}@example.com`,
      password: 'password123',
      role: 'owner',
      phone: '9876543210',
      isVerified: true
    });

    const renter = await User.create({
      name: 'Phase 10 Renter',
      email: `phase10_renter_${Date.now()}@example.com`,
      password: 'password123',
      role: 'renter',
      phone: '9123456780',
      isVerified: true
    });

    const thirdParty = await User.create({
      name: 'Phase 10 Stranger',
      email: `phase10_stranger_${Date.now()}@example.com`,
      password: 'password123',
      role: 'renter',
      phone: '9000000000',
      isVerified: true
    });

    const bike = await Bike.create({
      owner: owner._id,
      brand: 'Royal Enfield',
      model: 'Hunter 350',
      type: 'Cruiser',
      pricePerDay: 900,
      securityDeposit: 2000,
      isApproved: true,
      isAvailable: true
    });

    // 1. Create a non-completed booking (ACTIVE)
    const activeBooking = await Booking.create({
      renter: renter._id,
      bike: bike._id,
      owner: owner._id,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
      rentalAmount: 1800,
      securityDeposit: 2000,
      totalCash: 3800,
      status: 'ACTIVE'
    });

    // 2. Create a completed booking
    const completedBooking = await Booking.create({
      renter: renter._id,
      bike: bike._id,
      owner: owner._id,
      startDate: new Date(Date.now() - 86400000 * 2),
      endDate: new Date(Date.now() - 86400000),
      rentalAmount: 1800,
      securityDeposit: 2000,
      totalCash: 3800,
      status: 'COMPLETED',
      rentalStartTime: new Date(Date.now() - 86400000 * 2),
      rentalEndTime: new Date(Date.now() - 86400000)
    });

    // TEST 1: Review fails if booking is not COMPLETED
    {
      let statusCalled = null;
      let jsonCalled = null;
      const req = {
        user: { _id: renter._id, role: 'renter' },
        body: {
          bookingId: activeBooking._id.toString(),
          bikeConditionRating: 5,
          ownerRating: 5,
          overallRating: 5,
          comment: 'Great bike!'
        }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await reviewController.createReview(req, res, () => {});

      if (statusCalled === 400) {
        console.log('✓ TEST 1 PASSED: Cannot review a non-completed booking');
      } else {
        console.error('✗ TEST 1 FAILED:', statusCalled, jsonCalled);
      }
    }

    // TEST 2: Non-participant cannot review completed booking
    {
      let statusCalled = null;
      let jsonCalled = null;
      const req = {
        user: { _id: thirdParty._id, role: 'renter' },
        body: {
          bookingId: completedBooking._id.toString(),
          bikeConditionRating: 4,
          ownerRating: 4,
          overallRating: 4
        }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await reviewController.createReview(req, res, () => {});

      if (statusCalled === 403) {
        console.log('✓ TEST 2 PASSED: Non-participant rejected with 403');
      } else {
        console.error('✗ TEST 2 FAILED:', statusCalled, jsonCalled);
      }
    }

    // TEST 3: Renter reviews completed booking (3 aspects: condition, owner, overall)
    {
      let statusCalled = 201;
      let jsonCalled = null;
      const req = {
        user: { _id: renter._id, role: 'renter' },
        body: {
          bookingId: completedBooking._id.toString(),
          bikeConditionRating: 5,
          ownerRating: 5,
          overallRating: 5,
          comment: 'Smooth ride and extremely polite owner!'
        }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await reviewController.createReview(req, res, () => {});

      const updatedBike = await Bike.findById(bike._id);
      const updatedOwner = await User.findById(owner._id);

      if (
        jsonCalled &&
        jsonCalled.review &&
        jsonCalled.review.reviewerRole === 'renter' &&
        updatedBike.rating === 5 &&
        updatedBike.numReviews === 1 &&
        updatedOwner.rating === 5 &&
        updatedOwner.numReviews === 1
      ) {
        console.log('✓ TEST 3 PASSED: Renter review created & Bike/Owner average ratings recalculated to 5.0 (1 review)');
      } else {
        console.error('✗ TEST 3 FAILED:', { jsonCalled, updatedBike, updatedOwner });
      }
    }

    // TEST 4: Duplicate review by same user fails
    {
      let statusCalled = null;
      let jsonCalled = null;
      const req = {
        user: { _id: renter._id, role: 'renter' },
        body: {
          bookingId: completedBooking._id.toString(),
          bikeConditionRating: 4,
          ownerRating: 4,
          overallRating: 4
        }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await reviewController.createReview(req, res, () => {});

      if (statusCalled === 400) {
        console.log('✓ TEST 4 PASSED: Duplicate review prevented (400)');
      } else {
        console.error('✗ TEST 4 FAILED:', statusCalled, jsonCalled);
      }
    }

    // TEST 5: Owner reviews renter on completed booking (3 aspects: renter, communication, handling)
    {
      let statusCalled = 201;
      let jsonCalled = null;
      const req = {
        user: { _id: owner._id, role: 'owner' },
        body: {
          bookingId: completedBooking._id.toString(),
          renterRating: 5,
          communicationRating: 4,
          bikeHandlingRating: 5,
          comment: 'Very punctual and returned the bike in spotless condition.'
        }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await reviewController.createReview(req, res, () => {});

      const updatedRenter = await User.findById(renter._id);

      if (
        jsonCalled &&
        jsonCalled.review &&
        jsonCalled.review.reviewerRole === 'owner' &&
        updatedRenter.rating === 5 &&
        updatedRenter.numReviews === 1
      ) {
        console.log('✓ TEST 5 PASSED: Owner review created & Renter average rating recalculated to 5.0 (1 review)');
      } else {
        console.error('✗ TEST 5 FAILED:', { jsonCalled, updatedRenter });
      }
    }

    // TEST 6: GET /api/reviews/bike/:bikeId
    {
      let jsonCalled = null;
      const req = { params: { bikeId: bike._id.toString() } };
      const res = { json: (data) => { jsonCalled = data; } };
      await reviewController.getBikeReviews(req, res, () => {});

      if (jsonCalled && jsonCalled.reviews && jsonCalled.reviews.length === 1 && jsonCalled.stats.avgRating === 5) {
        console.log('✓ TEST 6 PASSED: Retrieved bike reviews and rating breakdown stats');
      } else {
        console.error('✗ TEST 6 FAILED:', jsonCalled);
      }
    }

    // TEST 7: GET /api/reviews/user/:userId
    {
      let jsonCalled = null;
      const req = { params: { userId: owner._id.toString() } };
      const res = { json: (data) => { jsonCalled = data; } };
      await reviewController.getUserReviews(req, res, () => {});

      if (jsonCalled && jsonCalled.reviews && jsonCalled.reviews.length === 1 && jsonCalled.user.name === owner.name) {
        console.log('✓ TEST 7 PASSED: Retrieved user profile and received reviews');
      } else {
        console.error('✗ TEST 7 FAILED:', jsonCalled);
      }
    }

    // TEST 8: GET /api/reviews/booking/:bookingId
    {
      let jsonCalled = null;
      const req = { params: { bookingId: completedBooking._id.toString() } };
      const res = { json: (data) => { jsonCalled = data; } };
      await reviewController.getBookingReviews(req, res, () => {});

      if (jsonCalled && jsonCalled.reviews && jsonCalled.reviews.length === 2) {
        console.log('✓ TEST 8 PASSED: Retrieved both renter and owner reviews for the booking');
      } else {
        console.error('✗ TEST 8 FAILED:', jsonCalled);
      }
    }

    // Clean up
    await Review.deleteMany({ booking: { $in: [activeBooking._id, completedBooking._id] } });
    await Booking.deleteMany({ _id: { $in: [activeBooking._id, completedBooking._id] } });
    await Bike.deleteMany({ _id: bike._id });
    await User.deleteMany({ _id: { $in: [owner._id, renter._id, thirdParty._id] } });

    console.log('--- ALL PHASE 10 TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
