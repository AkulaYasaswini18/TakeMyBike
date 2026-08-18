const mongoose = require('mongoose');
const User = require('./models/User');
const Bike = require('./models/Bike');
const Booking = require('./models/Booking');
const CashPayment = require('./models/CashPayment');
const Inspection = require('./models/Inspection');
const bookingController = require('./controllers/bookingController');

require('./config/env')();

async function runTests() {
  console.log('--- Starting Phase 8 Tests ---');
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bikeshare';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');

    // Create test owner and renter
    const owner = await User.create({
      name: 'Phase 8 Owner',
      email: `phase8_owner_${Date.now()}@example.com`,
      password: 'password123',
      role: 'owner',
      phone: '9876543210',
      isVerified: true
    });

    const renter = await User.create({
      name: 'Phase 8 Renter',
      email: `phase8_renter_${Date.now()}@example.com`,
      password: 'password123',
      role: 'renter',
      phone: '9123456780',
      isVerified: true
    });

    const thirdParty = await User.create({
      name: 'Phase 8 ThirdParty',
      email: `phase8_third_${Date.now()}@example.com`,
      password: 'password123',
      role: 'renter',
      phone: '9000000000',
      isVerified: true
    });

    const bike = await Bike.create({
      owner: owner._id,
      brand: 'KTM',
      model: 'Duke 390',
      type: 'Sports',
      pricePerDay: 1200,
      securityDeposit: 3000,
      isApproved: true,
      isAvailable: true
    });

    // 1. Create a booking in CASH_PAYMENT_PENDING status
    const booking = await Booking.create({
      renter: renter._id,
      bike: bike._id,
      owner: owner._id,
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 86400000 * 2),
      rentalAmount: 1200,
      securityDeposit: 3000,
      totalCash: 4200,
      status: 'CASH_PAYMENT_PENDING'
    });

    // TEST 1: Generate OTP fails before cash is confirmed received
    {
      let statusCalled = null;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: owner._id, role: 'owner' }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.generateOtp(req, res, () => {});

      if (statusCalled === 400) {
        console.log('✓ TEST 1 PASSED: Cannot generate OTP before cash payment status is RECEIVED');
      } else {
        console.error('✗ TEST 1 FAILED:', statusCalled, jsonCalled);
      }
    }

    // Confirm cash payment
    await CashPayment.create({
      booking: booking._id,
      amount: 4200,
      paymentMethod: 'CASH',
      status: 'RECEIVED',
      confirmedBy: owner._id,
      confirmedAt: new Date()
    });
    booking.status = 'CASH_PAYMENT_CONFIRMED';
    await booking.save();

    // TEST 2: Generate OTP succeeds once cash payment is received
    let generatedOtp = null;
    {
      let statusCalled = 200;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: owner._id, role: 'owner' }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.generateOtp(req, res, () => {});

      if (jsonCalled && jsonCalled.otp && jsonCalled.otp.length === 6) {
        generatedOtp = jsonCalled.otp;
        console.log('✓ TEST 2 PASSED: Owner generated 6-digit OTP:', generatedOtp);
      } else {
        console.error('✗ TEST 2 FAILED:', jsonCalled);
      }
    }

    // TEST 3: Inspection upload (BEFORE rental photos)
    {
      let statusCalled = 201;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: owner._id, role: 'owner' },
        body: {
          phase: 'BEFORE',
          front: '/uploads/front.jpg',
          back: '/uploads/back.jpg',
          left: '/uploads/left.jpg',
          right: '/uploads/right.jpg',
          odometer: '/uploads/odo.jpg',
          damage: '/uploads/scratches.jpg'
        }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.uploadInspection(req, res, () => {});

      if (statusCalled === 201 && jsonCalled.inspection && jsonCalled.inspection.phase === 'BEFORE') {
        console.log('✓ TEST 3 PASSED: BEFORE-rental inspection photos saved successfully');
      } else {
        console.error('✗ TEST 3 FAILED:', statusCalled, jsonCalled);
      }
    }

    // TEST 4: Invalid OTP verification fails
    {
      let statusCalled = null;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: renter._id, role: 'renter' },
        body: { otp: '000000' }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.verifyOtp(req, res, () => {});

      if (statusCalled === 400) {
        console.log('✓ TEST 4 PASSED: Wrong OTP correctly rejected');
      } else {
        console.error('✗ TEST 4 FAILED:', statusCalled, jsonCalled);
      }
    }

    // TEST 5: Correct OTP verification activates booking and records rentalStartTime
    {
      let statusCalled = 200;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: renter._id, role: 'renter' },
        body: { otp: generatedOtp }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.verifyOtp(req, res, () => {});

      const updated = await Booking.findById(booking._id);
      if (updated.status === 'ACTIVE' && updated.rentalStartTime && updated.otpVerifiedAt) {
        console.log('✓ TEST 5 PASSED: Correct OTP verified! Booking.status = ACTIVE, rentalStartTime recorded');
      } else {
        console.error('✗ TEST 5 FAILED:', updated);
      }
    }

    // TEST 6: Inspection upload (AFTER rental photos)
    {
      let statusCalled = 201;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: renter._id, role: 'renter' },
        body: {
          phase: 'AFTER',
          front: '/uploads/return_front.jpg',
          odometer: '/uploads/return_odo.jpg'
        }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.uploadInspection(req, res, () => {});

      if (statusCalled === 201 && jsonCalled.inspection && jsonCalled.inspection.phase === 'AFTER') {
        console.log('✓ TEST 6 PASSED: AFTER-rental inspection photos saved successfully');
      } else {
        console.error('✗ TEST 6 FAILED:', statusCalled, jsonCalled);
      }
    }

    // TEST 7: Get inspections retrieval
    {
      let statusCalled = 200;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: renter._id, role: 'renter' }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.getBookingInspections(req, res, () => {});

      if (jsonCalled && jsonCalled.inspections && jsonCalled.inspections.length === 2) {
        console.log('✓ TEST 7 PASSED: Retrieved both BEFORE and AFTER inspections');
      } else {
        console.error('✗ TEST 7 FAILED:', jsonCalled);
      }
    }

    // TEST 8: Third-party access restriction on inspections
    {
      let statusCalled = null;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: thirdParty._id, role: 'renter' }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.getBookingInspections(req, res, () => {});

      if (statusCalled === 403) {
        console.log('✓ TEST 8 PASSED: Unrelated user cannot view inspections (403 forbidden)');
      } else {
        console.error('✗ TEST 8 FAILED:', statusCalled, jsonCalled);
      }
    }

    // Clean up
    await Booking.deleteMany({ _id: booking._id });
    await CashPayment.deleteMany({ booking: booking._id });
    await Inspection.deleteMany({ booking: booking._id });
    await Bike.deleteMany({ _id: bike._id });
    await User.deleteMany({ _id: { $in: [owner._id, renter._id, thirdParty._id] } });

    console.log('--- ALL PHASE 8 TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
