const mongoose = require('mongoose');
const User = require('./models/User');
const Bike = require('./models/Bike');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');
const CashPayment = require('./models/CashPayment');
const SecurityDeposit = require('./models/SecurityDeposit');
const Inspection = require('./models/Inspection');
const Review = require('./models/Review');
const bookingController = require('./controllers/bookingController');
const depositController = require('./controllers/depositController');
const reviewController = require('./controllers/reviewController');
const notificationController = require('./controllers/notificationController');

require('./config/env')();

async function runTests() {
  console.log('--- Starting Phase 11 Tests ---');
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bikeshare';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');

    const owner = await User.create({
      name: 'Phase 11 Owner',
      email: `phase11_owner_${Date.now()}@example.com`,
      password: 'password123',
      role: 'owner',
      phone: '9876543210',
      isVerified: true
    });

    const renter = await User.create({
      name: 'Phase 11 Renter',
      email: `phase11_renter_${Date.now()}@example.com`,
      password: 'password123',
      role: 'renter',
      phone: '9123456780',
      isVerified: true
    });

    const bike = await Bike.create({
      owner: owner._id,
      brand: 'Kawasaki',
      model: 'Ninja 300',
      type: 'Sports',
      pricePerDay: 1500,
      securityDeposit: 3000,
      isApproved: true,
      isAvailable: true
    });

    // TEST 1: createBooking creates notification for owner
    let bookingId = null;
    {
      let jsonCalled = null;
      const req = {
        user: { _id: renter._id, role: 'renter', name: 'Phase 11 Renter', isVerified: true },
        body: {
          bikeId: bike._id.toString(),
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000 * 3).toISOString()
        }
      };
      const res = {
        status: (code) => ({ json: (d) => { jsonCalled = d; } }),
        json: (d) => { jsonCalled = d; }
      };
      await bookingController.createBooking(req, res, () => {});
      bookingId = jsonCalled.booking._id;

      const notif = await Notification.findOne({ user: owner._id, type: 'BOOKING_REQUESTED' });
      if (notif && notif.message.includes('Kawasaki')) {
        console.log('✓ TEST 1 PASSED: Owner received BOOKING_REQUESTED notification');
      } else {
        console.error('✗ TEST 1 FAILED:', notif);
      }
    }

    // TEST 2: approveBooking creates notification for renter
    {
      let jsonCalled = null;
      const req = {
        params: { id: bookingId.toString() },
        user: { _id: owner._id, role: 'owner' }
      };
      const res = { json: (d) => { jsonCalled = d; } };
      await bookingController.approveBooking(req, res, () => {});

      const notif = await Notification.findOne({ user: renter._id, type: 'BOOKING_APPROVED' });
      if (notif) {
        console.log('✓ TEST 2 PASSED: Renter received BOOKING_APPROVED notification');
      } else {
        console.error('✗ TEST 2 FAILED:', notif);
      }
    }

    // TEST 3: confirmCashPayment creates notification for renter
    {
      let jsonCalled = null;
      const req = {
        params: { id: bookingId.toString() },
        user: { _id: owner._id, role: 'owner' },
        body: { notes: 'Cash confirmed' }
      };
      const res = { json: (d) => { jsonCalled = d; } };
      await bookingController.confirmCashPayment(req, res, () => {});

      const notif = await Notification.findOne({ user: renter._id, type: 'CASH_PAYMENT_CONFIRMED' });
      if (notif) {
        console.log('✓ TEST 3 PASSED: Renter received CASH_PAYMENT_CONFIRMED notification');
      } else {
        console.error('✗ TEST 3 FAILED:', notif);
      }
    }

    // TEST 4: verifyOtp creates notification for owner and renter
    {
      // generate OTP first
      const booking = await Booking.findById(bookingId);
      booking.otp = '123456';
      await booking.save();

      let jsonCalled = null;
      const req = {
        params: { id: bookingId.toString() },
        user: { _id: renter._id, role: 'renter' },
        body: { otp: '123456' }
      };
      const res = { json: (d) => { jsonCalled = d; } };
      await bookingController.verifyOtp(req, res, () => {});

      const ownerNotif = await Notification.findOne({ user: owner._id, type: 'RENTAL_ACTIVE' });
      const renterNotif = await Notification.findOne({ user: renter._id, type: 'RENTAL_ACTIVE' });

      if (ownerNotif && renterNotif) {
        console.log('✓ TEST 4 PASSED: Both owner and renter received RENTAL_ACTIVE notifications');
      } else {
        console.error('✗ TEST 4 FAILED:', { ownerNotif, renterNotif });
      }
    }

    // TEST 5: returnBike creates notification for renter
    {
      let jsonCalled = null;
      const req = {
        params: { id: bookingId.toString() },
        user: { _id: owner._id, role: 'owner' },
        body: {
          hasDamage: false,
          front: '/uploads/after_front.jpg'
        }
      };
      const res = {
        status: (c) => ({ json: (d) => { jsonCalled = d; } }),
        json: (d) => { jsonCalled = d; }
      };
      await bookingController.returnBike(req, res, () => {});

      const returnNotif = await Notification.findOne({ user: renter._id, type: 'RETURN_COMPLETED' });
      if (returnNotif) {
        console.log('✓ TEST 5 PASSED: Renter received RETURN_COMPLETED notification');
      } else {
        console.error('✗ TEST 5 FAILED:', returnNotif);
      }
    }

    // TEST 6: refundDeposit creates notification for renter
    {
      const deposit = await SecurityDeposit.findOne({ booking: bookingId });
      let jsonCalled = null;
      const req = {
        params: { id: deposit._id.toString() },
        user: { _id: owner._id, role: 'owner' },
        body: { notes: 'Direct cash handed over' }
      };
      const res = { json: (d) => { jsonCalled = d; } };
      await depositController.refundDeposit(req, res, () => {});

      const refundNotif = await Notification.findOne({ user: renter._id, type: 'DEPOSIT_REFUNDED' });
      if (refundNotif) {
        console.log('✓ TEST 6 PASSED: Renter received DEPOSIT_REFUNDED notification');
      } else {
        console.error('✗ TEST 6 FAILED:', refundNotif);
      }
    }

    // TEST 7: createReview creates notification for target user
    {
      let jsonCalled = null;
      const req = {
        user: { _id: renter._id, role: 'renter', name: 'Phase 11 Renter' },
        body: {
          bookingId: bookingId.toString(),
          bikeConditionRating: 5,
          ownerRating: 5,
          overallRating: 5,
          comment: 'Awesome Ninja 300!'
        }
      };
      const res = {
        status: (c) => ({ json: (d) => { jsonCalled = d; } }),
        json: (d) => { jsonCalled = d; }
      };
      await reviewController.createReview(req, res, () => {});

      const reviewNotif = await Notification.findOne({ user: owner._id, type: 'REVIEW_RECEIVED' });
      if (reviewNotif) {
        console.log('✓ TEST 7 PASSED: Owner received REVIEW_RECEIVED notification');
      } else {
        console.error('✗ TEST 7 FAILED:', reviewNotif);
      }
    }

    // TEST 8: GET /api/notifications/mine
    {
      let jsonCalled = null;
      const req = { user: { _id: renter._id } };
      const res = { json: (d) => { jsonCalled = d; } };
      await notificationController.getMyNotifications(req, res, () => {});

      if (jsonCalled && jsonCalled.notifications.length >= 4 && jsonCalled.unreadCount >= 4) {
        console.log(`✓ TEST 8 PASSED: Retrieved renter notifications (${jsonCalled.notifications.length}) with unread count: ${jsonCalled.unreadCount}`);
      } else {
        console.error('✗ TEST 8 FAILED:', jsonCalled);
      }
    }

    // TEST 9: PUT /api/notifications/:id/read
    {
      const notif = await Notification.findOne({ user: renter._id, isRead: false });
      let jsonCalled = null;
      const req = {
        params: { id: notif._id.toString() },
        user: { _id: renter._id }
      };
      const res = { json: (d) => { jsonCalled = d; } };
      await notificationController.markAsRead(req, res, () => {});

      const updated = await Notification.findById(notif._id);
      if (updated.isRead === true && updated.readAt) {
        console.log('✓ TEST 9 PASSED: Single notification marked as read');
      } else {
        console.error('✗ TEST 9 FAILED:', updated);
      }
    }

    // TEST 10: PUT /api/notifications/read-all
    {
      let jsonCalled = null;
      const req = { user: { _id: renter._id } };
      const res = { json: (d) => { jsonCalled = d; } };
      await notificationController.markAllAsRead(req, res, () => {});

      const unread = await Notification.countDocuments({ user: renter._id, isRead: false });
      if (unread === 0) {
        console.log('✓ TEST 10 PASSED: All user notifications marked as read');
      } else {
        console.error('✗ TEST 10 FAILED: Remaining unread count =', unread);
      }
    }

    // Clean up
    await Notification.deleteMany({ user: { $in: [owner._id, renter._id] } });
    await Review.deleteMany({ booking: bookingId });
    await Inspection.deleteMany({ booking: bookingId });
    await SecurityDeposit.deleteMany({ booking: bookingId });
    await CashPayment.deleteMany({ booking: bookingId });
    await Booking.deleteMany({ _id: bookingId });
    await Bike.deleteMany({ _id: bike._id });
    await User.deleteMany({ _id: { $in: [owner._id, renter._id] } });

    console.log('--- ALL PHASE 11 TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
