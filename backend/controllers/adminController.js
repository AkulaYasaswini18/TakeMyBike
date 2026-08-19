const User = require('../models/User');
const Bike = require('../models/Bike');
const Booking = require('../models/Booking');
const CashPayment = require('../models/CashPayment');
const SecurityDeposit = require('../models/SecurityDeposit');
const Dispute = require('../models/Dispute');
const Report = require('../models/Report');
const { createNotification } = require('./notificationController');

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      rentersCount,
      ownersCount,
      totalBikes,
      approvedBikesCount,
      pendingBikesCount,
      totalBookings,
      activeBookingsCount,
      completedBookingsCount,
      cancelledBookingsCount,
      disputedBookingsCount,
      pendingBookingsCount,
      disputesCount,
      openDisputesCount,
      reportsCount,
      pendingReportsCount,
      allCompletedBookings,
      allBookings,
      allUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'renter' }),
      User.countDocuments({ role: 'owner' }),
      Bike.countDocuments(),
      Bike.countDocuments({ isApproved: true }),
      Bike.countDocuments({ isApproved: false }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'ACTIVE' }),
      Booking.countDocuments({ status: 'COMPLETED' }),
      Booking.countDocuments({ status: { $in: ['CANCELLED', 'REJECTED'] } }),
      Booking.countDocuments({ status: 'DISPUTED' }),
      Booking.countDocuments({ status: { $in: ['PENDING', 'APPROVED', 'CASH_PAYMENT_PENDING', 'CASH_PAYMENT_CONFIRMED'] } }),
      Dispute.countDocuments(),
      Dispute.countDocuments({ status: 'OPEN' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'PENDING' }),
      Booking.find({ status: 'COMPLETED' }).select('rentalAmount securityDeposit totalCash createdAt startDate'),
      Booking.find().select('status rentalAmount securityDeposit totalCash createdAt startDate bike').populate('bike', 'brand model'),
      User.find().select('role createdAt')
    ]);

    // Total platform recorded rental value (sum of rentalAmount for completed bookings)
    const totalRentalValue = allCompletedBookings.reduce((sum, b) => sum + (b.rentalAmount || 0), 0);
    const totalCashHandled = allCompletedBookings.reduce((sum, b) => sum + (b.totalCash || 0), 0);

    // Monthly Analytics (past 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyDataMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyDataMap[key] = {
        key,
        label,
        bookingsCount: 0,
        rentalValue: 0,
        newRenters: 0,
        newOwners: 0,
        totalUsers: 0
      };
    }

    // Populate monthly bookings & rental values
    allBookings.forEach(b => {
      const date = b.createdAt || b.startDate;
      if (!date) return;
      const d = new Date(date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyDataMap[key]) {
        monthlyDataMap[key].bookingsCount += 1;
        if (b.status === 'COMPLETED') {
          monthlyDataMap[key].rentalValue += (b.rentalAmount || 0);
        }
      }
    });

    // Populate monthly user signups
    allUsers.forEach(u => {
      if (!u.createdAt) return;
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyDataMap[key]) {
        if (u.role === 'renter') monthlyDataMap[key].newRenters += 1;
        else if (u.role === 'owner') monthlyDataMap[key].newOwners += 1;
        monthlyDataMap[key].totalUsers += 1;
      }
    });

    const monthlyAnalytics = Object.values(monthlyDataMap);

    // Popular bikes calculation
    const bikeBookingsCount = {};
    allBookings.forEach(b => {
      if (b.bike && b.bike._id) {
        const id = b.bike._id.toString();
        if (!bikeBookingsCount[id]) {
          bikeBookingsCount[id] = {
            id,
            brand: b.bike.brand || 'Bike',
            model: b.bike.model || '',
            count: 0
          };
        }
        bikeBookingsCount[id].count += 1;
      }
    });

    const popularBikes = Object.values(bikeBookingsCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    res.json({
      stats: {
        totalUsers,
        rentersCount,
        ownersCount,
        totalBikes,
        approvedBikesCount,
        pendingBikesCount,
        totalBookings,
        activeBookingsCount,
        completedBookingsCount,
        cancelledBookingsCount,
        disputedBookingsCount,
        pendingBookingsCount,
        totalRentalValue,
        totalCashHandled,
        disputesCount,
        openDisputesCount,
        reportsCount,
        pendingReportsCount
      },
      monthlyAnalytics,
      popularBikes
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, isVerified } = req.query;
    const filter = {};

    if (role && ['renter', 'owner', 'admin'].includes(role)) {
      filter.role = role;
    }
    if (isVerified !== undefined && isVerified !== '') {
      filter.isVerified = isVerified === 'true';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    // Fetch counts for users
    const userIds = users.map(u => u._id);
    const [bookingsCountByUser, bikesCountByUser] = await Promise.all([
      Booking.aggregate([
        { $match: { renter: { $in: userIds } } },
        { $group: { _id: '$renter', count: { $sum: 1 } } }
      ]),
      Bike.aggregate([
        { $match: { owner: { $in: userIds } } },
        { $group: { _id: '$owner', count: { $sum: 1 } } }
      ])
    ]);

    const bookingsMap = {};
    bookingsCountByUser.forEach(b => { bookingsMap[b._id.toString()] = b.count; });

    const bikesMap = {};
    bikesCountByUser.forEach(b => { bikesMap[b._id.toString()] = b.count; });

    const enrichedUsers = users.map(u => ({
      ...u.toObject(),
      bookingsCount: bookingsMap[u._id.toString()] || 0,
      bikesCount: bikesMap[u._id.toString()] || 0
    }));

    res.json({ users: enrichedUsers });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/bikes
exports.getBikes = async (req, res, next) => {
  try {
    const { isApproved, search } = req.query;
    const filter = {};

    if (isApproved !== undefined && isApproved !== '') {
      filter.isApproved = isApproved === 'true';
    }
    if (search) {
      filter.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { 'location.area': { $regex: search, $options: 'i' } }
      ];
    }

    const bikes = await Bike.find(filter)
      .populate('owner', 'name email phone rating')
      .sort({ createdAt: -1 });

    res.json({ bikes });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/bikes/:id/approve
exports.approveBike = async (req, res, next) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });

    bike.isApproved = true;
    bike.isAvailable = true;
    await bike.save();

    if (bike.owner) {
      await createNotification(bike.owner, {
        title: 'Bike Listing Approved',
        message: `Your ${bike.brand} ${bike.model} listing has been approved by admin and is now public!`,
        type: 'SYSTEM',
        link: '/my-bikes'
      });
    }

    res.json({ message: 'Bike approved successfully', bike });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/bikes/:id/reject
exports.rejectBike = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });

    bike.isApproved = false;
    bike.isAvailable = false;
    await bike.save();

    if (bike.owner) {
      await createNotification(bike.owner, {
        title: 'Bike Listing Rejected',
        message: `Your ${bike.brand} ${bike.model} listing was not approved. ${reason ? `Reason: ${reason}` : ''}`,
        type: 'SYSTEM',
        link: '/my-bikes'
      });
    }

    res.json({ message: 'Bike rejected', bike });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/bikes/:id/suspend
exports.suspendBike = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });

    bike.isApproved = false;
    bike.isAvailable = false;
    await bike.save();

    if (bike.owner) {
      await createNotification(bike.owner, {
        title: 'Bike Listing Suspended',
        message: `Your ${bike.brand} ${bike.model} listing has been suspended by admin. ${reason ? `Reason: ${reason}` : ''}`,
        type: 'SYSTEM',
        link: '/my-bikes'
      });
    }

    res.json({ message: 'Bike suspended successfully', bike });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/bookings
exports.getBookings = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('renter', 'name email phone rating')
      .populate('owner', 'name email phone rating')
      .populate('bike', 'brand model pricePerDay images')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/payments (view-only ledger: admin never confirms or moves money)
exports.getPayments = async (req, res, next) => {
  try {
    const [cashPayments, securityDeposits] = await Promise.all([
      CashPayment.find()
        .populate({
          path: 'booking',
          populate: [
            { path: 'renter', select: 'name email phone' },
            { path: 'owner', select: 'name email phone' },
            { path: 'bike', select: 'brand model' }
          ]
        })
        .populate('confirmedBy', 'name email')
        .sort({ createdAt: -1 }),
      SecurityDeposit.find()
        .populate({
          path: 'booking',
          populate: [
            { path: 'renter', select: 'name email phone' },
            { path: 'owner', select: 'name email phone' },
            { path: 'bike', select: 'brand model' }
          ]
        })
        .sort({ createdAt: -1 })
    ]);

    res.json({
      cashPayments,
      securityDeposits,
      notice: 'BikeShare administers peer-to-peer cash transactions. Payment records are strictly read-only for audit and platform oversight.'
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/disputes
exports.getDisputes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const disputes = await Dispute.find(filter)
      .populate('raisedBy', 'name email phone role')
      .populate({
        path: 'booking',
        populate: [
          { path: 'renter', select: 'name email phone' },
          { path: 'owner', select: 'name email phone' },
          { path: 'bike', select: 'brand model' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json({ disputes });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/disputes/:id
exports.resolveDispute = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['OPEN', 'RESOLVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid dispute status' });
    }

    const dispute = await Dispute.findById(req.params.id).populate('booking');
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    dispute.status = status;
    if (adminNotes !== undefined) dispute.adminNotes = adminNotes;
    await dispute.save();

    // If resolved, update deposit status if needed
    if (status === 'RESOLVED' && dispute.booking) {
      await SecurityDeposit.findOneAndUpdate(
        { booking: dispute.booking._id },
        { status: 'REFUND_PENDING', notes: `Dispute resolved by admin. Notes: ${adminNotes || 'None'}` }
      );
    }

    // Notify parties
    if (dispute.booking) {
      const booking = await Booking.findById(dispute.booking._id);
      if (booking) {
        if (booking.renter) {
          await createNotification(booking.renter, {
            title: `Dispute Status Updated: ${status}`,
            message: `Admin reviewed your dispute: ${adminNotes || 'Status updated to ' + status}`,
            type: 'SYSTEM',
            link: '/my-bookings'
          });
        }
        if (booking.owner) {
          await createNotification(booking.owner, {
            title: `Dispute Status Updated: ${status}`,
            message: `Admin reviewed the dispute: ${adminNotes || 'Status updated to ' + status}`,
            type: 'SYSTEM',
            link: '/rental-requests'
          });
        }
      }
    }

    res.json({ message: 'Dispute updated successfully', dispute });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reports
exports.getReports = async (req, res, next) => {
  try {
    const { status, targetType } = req.query;
    const filter = {};
    if (status && status !== 'ALL') filter.status = status;
    if (targetType) filter.targetType = targetType;

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email phone role')
      .populate('targetBike', 'brand model images owner')
      .populate('targetUser', 'name email phone role rating')
      .populate('targetBooking', 'status rentalAmount totalCash')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/reports/:id
exports.updateReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid report status' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    if (['ACTION_TAKEN', 'DISMISSED'].includes(status)) {
      report.resolvedAt = new Date();
    }
    await report.save();

    res.json({ message: 'Report updated successfully', report });
  } catch (err) {
    next(err);
  }
};
