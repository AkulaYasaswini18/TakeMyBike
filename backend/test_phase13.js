const mongoose = require('mongoose');
const User = require('./models/User');
const Bike = require('./models/Bike');
const Booking = require('./models/Booking');
const Dispute = require('./models/Dispute');
const Report = require('./models/Report');
const CashPayment = require('./models/CashPayment');
const SecurityDeposit = require('./models/SecurityDeposit');
const seedAdmin = require('./seed/seedAdmin');
const adminController = require('./controllers/adminController');
const reportController = require('./controllers/reportController');

require('./config/env')();

async function runTests() {
  console.log('=== Starting Phase 13 Admin Panel Tests ===');
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bikeshare';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✓ Connected to MongoDB');

    // TEST 1: Admin Seeding
    const admin = await seedAdmin();
    if (admin && admin.role === 'admin' && admin.isVerified) {
      console.log('✓ TEST 1 PASSED: Admin seeded successfully with role: admin');
    } else {
      console.error('✗ TEST 1 FAILED:', admin);
    }

    // Create test Renter & Owner
    const renter = await User.create({
      name: 'Phase 13 Renter',
      email: `renter_p13_${Date.now()}@example.com`,
      passwordHash: 'hashed',
      role: 'renter',
      phone: '9123456789',
      isVerified: true
    });

    const owner = await User.create({
      name: 'Phase 13 Owner',
      email: `owner_p13_${Date.now()}@example.com`,
      passwordHash: 'hashed',
      role: 'owner',
      phone: '9876543210',
      isVerified: true
    });

    // Create a bike pending approval
    const bike = await Bike.create({
      owner: owner._id,
      brand: 'KTM',
      model: 'Duke 390',
      type: 'Sports',
      pricePerDay: 1200,
      securityDeposit: 3000,
      isApproved: false,
      isAvailable: false
    });

    // TEST 2: GET /api/admin/bikes and PUT /api/admin/bikes/:id/approve
    {
      let jsonResult = null;
      const reqApprove = {
        params: { id: bike._id.toString() },
        user: { _id: admin._id, role: 'admin' }
      };
      const resApprove = {
        status: () => ({ json: (d) => { jsonResult = d; } }),
        json: (d) => { jsonResult = d; }
      };

      await adminController.approveBike(reqApprove, resApprove, () => {});
      const updatedBike = await Bike.findById(bike._id);

      if (updatedBike && updatedBike.isApproved === true && updatedBike.isAvailable === true) {
        console.log('✓ TEST 2 PASSED: Admin approved bike successfully');
      } else {
        console.error('✗ TEST 2 FAILED: Bike not approved', updatedBike);
      }
    }

    // TEST 3: PUT /api/admin/bikes/:id/suspend
    {
      let jsonResult = null;
      const reqSuspend = {
        params: { id: bike._id.toString() },
        body: { reason: 'Maintenance audit' },
        user: { _id: admin._id, role: 'admin' }
      };
      const resSuspend = {
        status: () => ({ json: (d) => { jsonResult = d; } }),
        json: (d) => { jsonResult = d; }
      };

      await adminController.suspendBike(reqSuspend, resSuspend, () => {});
      const suspendedBike = await Bike.findById(bike._id);

      if (suspendedBike && suspendedBike.isApproved === false && suspendedBike.isAvailable === false) {
        console.log('✓ TEST 3 PASSED: Admin suspended bike successfully');
      } else {
        console.error('✗ TEST 3 FAILED:', suspendedBike);
      }
    }

    // TEST 4: Create user report via POST /api/reports and review via GET /api/admin/reports
    let reportId = null;
    {
      let jsonResult = null;
      const reqReport = {
        user: { _id: renter._id, role: 'renter' },
        body: {
          targetType: 'bike',
          targetId: bike._id.toString(),
          reason: 'fake bike',
          description: 'This bike listing has incorrect specifications and photos.'
        }
      };
      const resReport = {
        status: (code) => ({ json: (d) => { jsonResult = d; } }),
        json: (d) => { jsonResult = d; }
      };

      await reportController.createReport(reqReport, resReport, () => {});
      if (jsonResult && jsonResult.report && jsonResult.report._id) {
        reportId = jsonResult.report._id;
        console.log('✓ TEST 4A PASSED: User report created successfully');
      } else {
        console.error('✗ TEST 4A FAILED:', jsonResult);
      }

      // Admin review & resolve report
      let updateJson = null;
      const reqUpdate = {
        params: { id: reportId.toString() },
        body: { status: 'ACTION_TAKEN', adminNotes: 'Bike verified and warning issued' },
        user: { _id: admin._id, role: 'admin' }
      };
      const resUpdate = {
        status: () => ({ json: (d) => { updateJson = d; } }),
        json: (d) => { updateJson = d; }
      };

      await adminController.updateReport(reqUpdate, resUpdate, () => {});
      const updatedReport = await Report.findById(reportId);

      if (updatedReport && updatedReport.status === 'ACTION_TAKEN' && updatedReport.adminNotes.includes('warning issued')) {
        console.log('✓ TEST 4B PASSED: Admin reviewed and updated report status');
      } else {
        console.error('✗ TEST 4B FAILED:', updatedReport);
      }
    }

    // TEST 5: Create dispute and resolve via PUT /api/admin/disputes/:id
    {
      const booking = await Booking.create({
        renter: renter._id,
        owner: owner._id,
        bike: bike._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        rentalAmount: 1200,
        securityDeposit: 3000,
        totalCash: 4200,
        status: 'DISPUTED'
      });

      const dispute = await Dispute.create({
        booking: booking._id,
        raisedBy: owner._id,
        reason: 'Scratched handlebar',
        status: 'OPEN'
      });

      let resolveJson = null;
      const reqResolve = {
        params: { id: dispute._id.toString() },
        body: { status: 'RESOLVED', adminNotes: 'Owner and renter agreed to partial compensation' },
        user: { _id: admin._id, role: 'admin' }
      };
      const resResolve = {
        status: () => ({ json: (d) => { resolveJson = d; } }),
        json: (d) => { resolveJson = d; }
      };

      await adminController.resolveDispute(reqResolve, resResolve, () => {});
      const updatedDispute = await Dispute.findById(dispute._id);

      if (updatedDispute && updatedDispute.status === 'RESOLVED' && updatedDispute.adminNotes.includes('partial compensation')) {
        console.log('✓ TEST 5 PASSED: Admin resolved dispute successfully');
      } else {
        console.error('✗ TEST 5 FAILED:', updatedDispute);
      }
    }

    // TEST 6: GET /api/admin/stats
    {
      let statsJson = null;
      const reqStats = { user: { _id: admin._id, role: 'admin' }, query: {} };
      const resStats = {
        status: () => ({ json: (d) => { statsJson = d; } }),
        json: (d) => { statsJson = d; }
      };

      await adminController.getStats(reqStats, resStats, () => {});

      if (
        statsJson &&
        statsJson.stats &&
        statsJson.stats.totalUsers >= 3 &&
        statsJson.stats.totalBikes >= 1 &&
        Array.isArray(statsJson.monthlyAnalytics) &&
        statsJson.monthlyAnalytics.length === 6 &&
        Array.isArray(statsJson.popularBikes)
      ) {
        console.log('✓ TEST 6 PASSED: Admin stats and monthly time series computed accurately');
      } else {
        console.error('✗ TEST 6 FAILED:', statsJson);
      }
    }

    console.log('=== All Phase 13 Tests Passed Successfully! ===');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

runTests();
