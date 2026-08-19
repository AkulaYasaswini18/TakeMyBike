const mongoose = require('mongoose');
const User = require('./models/User');
const Bike = require('./models/Bike');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');
const CashPayment = require('./models/CashPayment');
const SecurityDeposit = require('./models/SecurityDeposit');
const Review = require('./models/Review');
const bookingController = require('./controllers/bookingController');

require('./config/env')();

async function runTests() {
  console.log('=== Starting Phase 12 Dashboard Tests ===');
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bikeshare';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✓ Connected to MongoDB');

    // Create test Owner
    const owner = await User.create({
      name: 'Dashboard Test Owner',
      email: `owner_dash_${Date.now()}@example.com`,
      password: 'password123',
      role: 'owner',
      phone: '9888877777',
      isVerified: true
    });

    // Create test Renter
    const renter = await User.create({
      name: 'Dashboard Test Renter',
      email: `renter_dash_${Date.now()}@example.com`,
      password: 'password123',
      role: 'renter',
      phone: '9111122222',
      isVerified: true
    });

    // Create 2 bikes for Owner
    const bike1 = await Bike.create({
      owner: owner._id,
      brand: 'Royal Enfield',
      model: 'Hunter 350',
      type: 'Cruiser',
      pricePerDay: 800,
      securityDeposit: 2000,
      isApproved: true,
      isAvailable: false
    });

    const bike2 = await Bike.create({
      owner: owner._id,
      brand: 'Yamaha',
      model: 'MT-15',
      type: 'Sports',
      pricePerDay: 1000,
      securityDeposit: 2500,
      isApproved: true,
      isAvailable: true
    });

    // 1. Create COMPLETED booking (3 days @ 800 = 2400 rental, 2000 deposit, total 4400)
    const bookingCompleted = await Booking.create({
      renter: renter._id,
      bike: bike1._id,
      owner: owner._id,
      startDate: new Date(Date.now() - 86400000 * 5),
      endDate: new Date(Date.now() - 86400000 * 2),
      rentalAmount: 2400,
      securityDeposit: 2000,
      totalCash: 4400,
      status: 'COMPLETED'
    });

    await CashPayment.create({
      booking: bookingCompleted._id,
      amount: 4400,
      paymentMethod: 'CASH',
      status: 'RECEIVED',
      confirmedBy: owner._id,
      confirmedAt: new Date()
    });

    await SecurityDeposit.create({
      booking: bookingCompleted._id,
      amount: 2000,
      status: 'REFUNDED_DIRECTLY_BY_OWNER',
      refundMethod: 'DIRECT_CASH',
      refundedAt: new Date()
    });

    await Review.create({
      booking: bookingCompleted._id,
      bike: bike1._id,
      fromUser: renter._id,
      toUser: owner._id,
      reviewerRole: 'renter',
      rating: 5,
      comment: 'Superb bike and smooth transaction with owner!',
      bikeConditionRating: 5,
      ownerRating: 5,
      overallRating: 5
    });

    // 2. Create ACTIVE booking (2 days @ 1000 = 2000 rental, 2500 deposit, total 4500)
    const bookingActive = await Booking.create({
      renter: renter._id,
      bike: bike2._id,
      owner: owner._id,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
      rentalAmount: 2000,
      securityDeposit: 2500,
      totalCash: 4500,
      status: 'ACTIVE'
    });

    await CashPayment.create({
      booking: bookingActive._id,
      amount: 4500,
      paymentMethod: 'CASH',
      status: 'RECEIVED',
      confirmedBy: owner._id,
      confirmedAt: new Date()
    });

    await SecurityDeposit.create({
      booking: bookingActive._id,
      amount: 2500,
      status: 'HELD_BY_OWNER',
      refundMethod: 'DIRECT_CASH'
    });

    // 3. Create PENDING booking
    const bookingPending = await Booking.create({
      renter: renter._id,
      bike: bike1._id,
      owner: owner._id,
      startDate: new Date(Date.now() + 86400000 * 2),
      endDate: new Date(Date.now() + 86400000 * 4),
      rentalAmount: 1600,
      securityDeposit: 2000,
      totalCash: 3600,
      status: 'PENDING'
    });

    // TEST 1: getRenterDashboard
    {
      let jsonResult = null;
      let statusResult = 200;
      const req = { user: { _id: renter._id, role: 'renter' } };
      const res = {
        status: (code) => { statusResult = code; return { json: (d) => { jsonResult = d; } }; },
        json: (d) => { jsonResult = d; }
      };

      await bookingController.getRenterDashboard(req, res, (err) => { if (err) console.error(err); });

      if (
        jsonResult &&
        jsonResult.summary &&
        jsonResult.summary.totalRentals === 3 &&
        jsonResult.summary.activeCount === 1 &&
        jsonResult.summary.upcomingCount === 1 &&
        jsonResult.summary.completedCount === 1 &&
        jsonResult.summary.totalRentalAmountPaid === 2400 &&
        jsonResult.activeBookings.length === 1 &&
        jsonResult.upcomingBookings.length === 1 &&
        jsonResult.completedBookings.length === 1 &&
        jsonResult.cashPayments.length >= 2 &&
        jsonResult.securityDeposits.length >= 2
      ) {
        console.log('✓ TEST 1 PASSED: getRenterDashboard returned correct summary, active, upcoming, completed and cash records');
      } else {
        console.error('✗ TEST 1 FAILED: Incorrect renter dashboard data', JSON.stringify(jsonResult, null, 2));
      }
    }

    // TEST 2: getOwnerDashboard
    {
      let jsonResult = null;
      let statusResult = 200;
      const req = { user: { _id: owner._id, role: 'owner' } };
      const res = {
        status: (code) => { statusResult = code; return { json: (d) => { jsonResult = d; } }; },
        json: (d) => { jsonResult = d; }
      };

      await bookingController.getOwnerDashboard(req, res, (err) => { if (err) console.error(err); });

      if (
        jsonResult &&
        jsonResult.summary &&
        jsonResult.summary.totalEarnings === 2400 && // Sum of completed rentalAmount
        jsonResult.summary.totalBikes === 2 &&
        jsonResult.summary.activeRentals === 1 &&
        jsonResult.summary.pendingRequestsCount === 1 &&
        jsonResult.summary.completedRentalsCount === 1 &&
        jsonResult.summary.totalReviews === 1 &&
        jsonResult.bikes.length === 2 &&
        jsonResult.pendingRequests.length === 1 &&
        jsonResult.activeBookings.length === 1 &&
        jsonResult.completedBookings.length === 1 &&
        jsonResult.reviews.length === 1
      ) {
        console.log('✓ TEST 2 PASSED: getOwnerDashboard returned correct earnings (sum of completed rental amounts), bikes, requests, and reviews');
      } else {
        console.error('✗ TEST 2 FAILED: Incorrect owner dashboard data', JSON.stringify(jsonResult, null, 2));
      }
    }

    // TEST 3: Role-based Authorization barriers
    {
      let renterStatus = null;
      const reqOwnerToRenter = { user: { _id: owner._id, role: 'owner' } };
      const res1 = {
        status: (code) => { renterStatus = code; return { json: () => {} }; },
        json: () => {}
      };
      await bookingController.getRenterDashboard(reqOwnerToRenter, res1, () => {});

      let ownerStatus = null;
      const reqRenterToOwner = { user: { _id: renter._id, role: 'renter' } };
      const res2 = {
        status: (code) => { ownerStatus = code; return { json: () => {} }; },
        json: () => {}
      };
      await bookingController.getOwnerDashboard(reqRenterToOwner, res2, () => {});

      if (renterStatus === 403 && ownerStatus === 403) {
        console.log('✓ TEST 3 PASSED: Role barriers correctly block unauthorized cross-role dashboard access (403)');
      } else {
        console.error(`✗ TEST 3 FAILED: renterStatus=${renterStatus}, ownerStatus=${ownerStatus}`);
      }
    }

    console.log('=== All Phase 12 Tests Passed Successfully! ===');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

runTests();
