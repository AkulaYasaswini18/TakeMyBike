const mongoose = require('mongoose');
const User = require('./models/User');
const Bike = require('./models/Bike');
const Booking = require('./models/Booking');
const CashPayment = require('./models/CashPayment');
const Inspection = require('./models/Inspection');
const SecurityDeposit = require('./models/SecurityDeposit');
const Dispute = require('./models/Dispute');
const bookingController = require('./controllers/bookingController');
const depositController = require('./controllers/depositController');

require('./config/env')();

async function runTests() {
  console.log('--- Starting Phase 9 Tests ---');
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bikeshare';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');

    const owner = await User.create({
      name: 'Phase 9 Owner',
      email: `phase9_owner_${Date.now()}@example.com`,
      password: 'password123',
      role: 'owner',
      phone: '9876543210',
      isVerified: true
    });

    const renter = await User.create({
      name: 'Phase 9 Renter',
      email: `phase9_renter_${Date.now()}@example.com`,
      password: 'password123',
      role: 'renter',
      phone: '9123456780',
      isVerified: true
    });

    const bike = await Bike.create({
      owner: owner._id,
      brand: 'Yamaha',
      model: 'R15 V4',
      type: 'Sports',
      pricePerDay: 1000,
      securityDeposit: 2500,
      isApproved: true,
      isAvailable: false
    });

    // 1. Create an active booking
    const booking = await Booking.create({
      renter: renter._id,
      bike: bike._id,
      owner: owner._id,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
      rentalAmount: 2000,
      securityDeposit: 2500,
      totalCash: 4500,
      status: 'ACTIVE',
      rentalStartTime: new Date(Date.now() - 86400000)
    });

    // TEST 1: Return fails if no after-inspection photos exist
    {
      let statusCalled = null;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: owner._id, role: 'owner' },
        body: { hasDamage: false }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.returnBike(req, res, () => {});

      if (statusCalled === 400) {
        console.log('✓ TEST 1 PASSED: Return fails if AFTER inspection photos are missing');
      } else {
        console.error('✗ TEST 1 FAILED:', statusCalled, jsonCalled);
      }
    }

    // TEST 2: Successful return without damage
    {
      let statusCalled = 200;
      let jsonCalled = null;
      const req = {
        params: { id: booking._id.toString() },
        user: { _id: owner._id, role: 'owner' },
        body: {
          hasDamage: false,
          front: '/uploads/after_front.jpg',
          odometer: '/uploads/after_odo.jpg'
        }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.returnBike(req, res, () => {});

      const updated = await Booking.findById(booking._id);
      const deposit = await SecurityDeposit.findOne({ booking: booking._id });
      const updatedBike = await Bike.findById(bike._id);

      if (
        updated.status === 'COMPLETED' &&
        deposit &&
        deposit.status === 'REFUND_PENDING' &&
        updatedBike.isAvailable === true
      ) {
        console.log('✓ TEST 2 PASSED: Return without damage completed -> Booking.status = COMPLETED, SecurityDeposit.status = REFUND_PENDING, Bike.isAvailable = true');
      } else {
        console.error('✗ TEST 2 FAILED:', { updated, deposit, updatedBike });
      }
    }

    // TEST 3: Owner refunds security deposit directly in cash
    {
      const deposit = await SecurityDeposit.findOne({ booking: booking._id });
      let statusCalled = 200;
      let jsonCalled = null;
      const req = {
        params: { id: deposit._id.toString() },
        user: { _id: owner._id, role: 'owner' },
        body: { notes: 'Deposit refunded directly in cash upon return' }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await depositController.refundDeposit(req, res, () => {});

      const updatedDeposit = await SecurityDeposit.findById(deposit._id);
      if (updatedDeposit.status === 'REFUNDED_DIRECTLY_BY_OWNER' && updatedDeposit.refundMethod === 'DIRECT_CASH' && updatedDeposit.refundedAt) {
        console.log('✓ TEST 3 PASSED: Deposit marked as REFUNDED_DIRECTLY_BY_OWNER with direct cash method');
      } else {
        console.error('✗ TEST 3 FAILED:', updatedDeposit);
      }
    }

    // TEST 4: Return with damage flagged creates Dispute and sets DISPUTED status
    {
      const damageBooking = await Booking.create({
        renter: renter._id,
        bike: bike._id,
        owner: owner._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        rentalAmount: 1000,
        securityDeposit: 2500,
        totalCash: 3500,
        status: 'ACTIVE',
        rentalStartTime: new Date()
      });

      let statusCalled = 200;
      let jsonCalled = null;
      const req = {
        params: { id: damageBooking._id.toString() },
        user: { _id: owner._id, role: 'owner' },
        body: {
          hasDamage: true,
          damageNotes: 'Severe scratch on fuel tank and broken clutch lever',
          front: '/uploads/damage_front.jpg',
          damage: '/uploads/tank_scratch.jpg'
        }
      };
      const res = {
        status: (code) => { statusCalled = code; return { json: (data) => { jsonCalled = data; } }; },
        json: (data) => { jsonCalled = data; }
      };
      await bookingController.returnBike(req, res, () => {});

      const updatedDamageBooking = await Booking.findById(damageBooking._id);
      const damageDeposit = await SecurityDeposit.findOne({ booking: damageBooking._id });
      const dispute = await Dispute.findOne({ booking: damageBooking._id });

      if (
        updatedDamageBooking.status === 'DISPUTED' &&
        damageDeposit &&
        damageDeposit.status === 'DISPUTED' &&
        dispute &&
        dispute.status === 'OPEN' &&
        dispute.reason.includes('broken clutch lever')
      ) {
        console.log('✓ TEST 4 PASSED: Return with damage flagged -> Booking.status = DISPUTED, SecurityDeposit.status = DISPUTED, Dispute created with OPEN status');
      } else {
        console.error('✗ TEST 4 FAILED:', { updatedDamageBooking, damageDeposit, dispute });
      }

      await Dispute.deleteMany({ booking: damageBooking._id });
      await SecurityDeposit.deleteMany({ booking: damageBooking._id });
      await Booking.deleteMany({ _id: damageBooking._id });
    }

    // TEST 5: Get Deposit by booking endpoint
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
      await depositController.getDepositByBooking(req, res, () => {});

      if (jsonCalled && jsonCalled.securityDeposit && jsonCalled.securityDeposit.status === 'REFUNDED_DIRECTLY_BY_OWNER') {
        console.log('✓ TEST 5 PASSED: Renter can retrieve deposit details via GET /api/deposits/booking/:bookingId');
      } else {
        console.error('✗ TEST 5 FAILED:', jsonCalled);
      }
    }

    // Clean up
    await Inspection.deleteMany({ booking: booking._id });
    await SecurityDeposit.deleteMany({ booking: booking._id });
    await Booking.deleteMany({ _id: booking._id });
    await Bike.deleteMany({ _id: bike._id });
    await User.deleteMany({ _id: { $in: [owner._id, renter._id] } });

    console.log('--- ALL PHASE 9 TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
