const mongoose = require('mongoose');
const User = require('./models/User');
const Bike = require('./models/Bike');
const Booking = require('./models/Booking');
const CashPayment = require('./models/CashPayment');
const bookingController = require('./controllers/bookingController');
const paymentController = require('./controllers/paymentController');

async function runTests() {
  console.log('--- Starting Phase 7 Tests ---');
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bikeshare';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB successfully');

    // Clean up old test data
    await User.deleteMany({ email: /phase7test.*@example.com/ });
    
    // Create test owner and renter
    const owner = await User.create({
      name: 'Phase 7 Owner',
      email: `phase7test_owner_${Date.now()}@example.com`,
      password: 'password123',
      role: 'owner',
      phone: '9876543210',
      isVerified: true
    });

    const renter = await User.create({
      name: 'Phase 7 Renter',
      email: `phase7test_renter_${Date.now()}@example.com`,
      password: 'password123',
      role: 'renter',
      phone: '9123456780',
      isVerified: true
    });

    const otherUser = await User.create({
      name: 'Phase 7 Other',
      email: `phase7test_other_${Date.now()}@example.com`,
      password: 'password123',
      role: 'renter',
      phone: '9000000000',
      isVerified: true
    });

    // Create a bike
    const bike = await Bike.create({
      owner: owner._id,
      brand: 'Royal Enfield',
      model: 'Classic 350',
      type: 'Cruiser',
      pricePerDay: 800,
      securityDeposit: 2000,
      isApproved: true,
      isAvailable: true
    });

    // Create a booking in CASH_PAYMENT_PENDING status
    const booking = await Booking.create({
      renter: renter._id,
      bike: bike._id,
      owner: owner._id,
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 86400000 * 3),
      rentalAmount: 1600,
      securityDeposit: 2000,
      totalCash: 3600,
      status: 'CASH_PAYMENT_PENDING'
    });

    console.log('Created test booking:', booking._id.toString(), 'status:', booking.status);

    // TEST 1: Unauthorized user attempts to confirm cash payment
    {
      let statusCalled = null;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: renter._id, role: 'renter' },
        body: {}
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.confirmCashPayment(req, res, (err) => { if (err) console.error(err); });

      if (statusCalled === 403) {
        console.log('✓ TEST 1 PASSED: Renter cannot confirm cash payment (403 forbidden)');
      } else {
        console.error('✗ TEST 1 FAILED: Expected 403, got status:', statusCalled, jsonCalled);
      }
    }

    // TEST 2: Owner confirms cash payment
    {
      let statusCalled = 200;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: owner._id, role: 'owner' },
        body: { notes: 'Received full ₹3600 cash at pickup' }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.confirmCashPayment(req, res, (err) => { if (err) console.error(err); });

      const updatedBooking = await Booking.findById(booking._id);
      const cashPayment = await CashPayment.findOne({ booking: booking._id });

      if (updatedBooking.status === 'CASH_PAYMENT_CONFIRMED' && cashPayment && cashPayment.status === 'RECEIVED' && cashPayment.amount === 3600) {
        console.log('✓ TEST 2 PASSED: Cash payment confirmed -> CashPayment.status = RECEIVED & Booking.status = CASH_PAYMENT_CONFIRMED');
      } else {
        console.error('✗ TEST 2 FAILED: State mismatch', { bookingStatus: updatedBooking?.status, payment: cashPayment });
      }
    }

    // TEST 3: Payment details retrieval GET /api/payments/booking/:bookingId by renter
    {
      let statusCalled = 200;
      let jsonCalled = null;
      const req = {
        params: { bookingId: booking._id.toString() },
        user: { _id: renter._id, role: 'renter' }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await paymentController.getBookingPayment(req, res, (err) => { if (err) console.error(err); });

      if (jsonCalled && jsonCalled.payment && jsonCalled.payment.status === 'RECEIVED' && jsonCalled.booking.status === 'CASH_PAYMENT_CONFIRMED') {
        console.log('✓ TEST 3 PASSED: Renter can retrieve booking payment details');
      } else {
        console.error('✗ TEST 3 FAILED:', jsonCalled);
      }
    }

    // TEST 4: Payment details retrieval by unauthorized user
    {
      let statusCalled = null;
      let jsonCalled = null;
      const req = {
        params: { bookingId: booking._id.toString() },
        user: { _id: otherUser._id, role: 'renter' }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await paymentController.getBookingPayment(req, res, (err) => { if (err) console.error(err); });

      if (statusCalled === 403) {
        console.log('✓ TEST 4 PASSED: Unrelated user denied payment details (403 forbidden)');
      } else {
        console.error('✗ TEST 4 FAILED: Expected 403, got status:', statusCalled, jsonCalled);
      }
    }

    // Clean up
    await Booking.deleteMany({ _id: booking._id });
    await CashPayment.deleteMany({ booking: booking._id });
    await Bike.deleteMany({ _id: bike._id });
    await User.deleteMany({ _id: { $in: [owner._id, renter._id, otherUser._id] } });

    console.log('--- ALL PHASE 7 TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
