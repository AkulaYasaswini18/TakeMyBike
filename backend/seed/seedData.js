const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Bike = require('../models/Bike');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const CashPayment = require('../models/CashPayment');
const SecurityDeposit = require('../models/SecurityDeposit');
const Dispute = require('../models/Dispute');
const Report = require('../models/Report');
const Inspection = require('../models/Inspection');
const Availability = require('../models/Availability');

require('../config/env')();

const DEMO_PASSWORD = 'BikeShare@123';
const demoUsers = [
  { name: 'Aarav Sharma', email: 'renter1@bikeshare.demo', role: 'renter', phone: '9876500001' },
  { name: 'Meera Iyer', email: 'renter2@bikeshare.demo', role: 'renter', phone: '9876500002' },
  { name: 'Kabir Khan', email: 'renter3@bikeshare.demo', role: 'renter', phone: '9876500003' },
  { name: 'Ananya Rao', email: 'renter4@bikeshare.demo', role: 'renter', phone: '9876500004' },
  { name: 'Vikram Singh', email: 'owner1@bikeshare.demo', role: 'owner', phone: '9876500011' },
  { name: 'Priya Nair', email: 'owner2@bikeshare.demo', role: 'owner', phone: '9876500012' },
  { name: 'Rohan Desai', email: 'owner3@bikeshare.demo', role: 'owner', phone: '9876500013' },
  { name: 'Ishita Menon', email: 'owner4@bikeshare.demo', role: 'owner', phone: '9876500014' },
  { name: 'Arjun Patel', email: 'owner5@bikeshare.demo', role: 'owner', phone: '9876500015' },
  { name: 'Platform Administrator', email: 'admin@bikeshare.demo', role: 'admin', phone: '9876500099' }
];

const bikeTemplates = [
  ['Honda', 'Activa 6G', 'Scooter', 450, 'Koramangala'],
  ['TVS', 'Jupiter 125', 'Scooter', 425, 'Indiranagar'],
  ['Royal Enfield', 'Classic 350', 'Cruiser', 950, 'Viman Nagar'],
  ['Yamaha', 'MT-15', 'Sports', 850, 'Banjara Hills'],
  ['Honda', 'Shine 125', 'Commuter', 400, 'Andheri West'],
  ['Bajaj', 'Pulsar 150', 'Commuter', 500, 'Salt Lake'],
  ['TVS', 'Apache RTR 200', 'Sports', 700, 'Hitech City'],
  ['Royal Enfield', 'Himalayan 450', 'Adventure', 1200, 'Mysore Road'],
  ['Honda', 'CB350', 'Cruiser', 1000, 'Kalyani Nagar'],
  ['Yamaha', 'FZ-FI', 'Commuter', 550, 'Powai']
];

const dateAt = (daysFromToday, hour = 10) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date;
};

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bikeshare';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB');

  try {
    const demoEmails = demoUsers.map(user => user.email);
    const oldUsers = await User.find({ email: { $in: demoEmails } }).select('_id');
    const oldBikes = await Bike.find({ registrationNumber: /^DEMO-/ }).select('_id');
    const oldBookings = await Booking.find({
      $or: [
        { renter: { $in: oldUsers.map(user => user._id) } },
        { owner: { $in: oldUsers.map(user => user._id) } },
        { bike: { $in: oldBikes.map(bike => bike._id) } }
      ]
    }).select('_id');
    const bookingIds = oldBookings.map(booking => booking._id);
    const userIds = oldUsers.map(user => user._id);
    const bikeIds = oldBikes.map(bike => bike._id);

    await Promise.all([
      Review.deleteMany({ booking: { $in: bookingIds } }),
      Notification.deleteMany({ user: { $in: userIds } }),
      CashPayment.deleteMany({ booking: { $in: bookingIds } }),
      SecurityDeposit.deleteMany({ booking: { $in: bookingIds } }),
      Dispute.deleteMany({ booking: { $in: bookingIds } }),
      Report.deleteMany({ reportedBy: { $in: userIds } }),
      Inspection.deleteMany({ booking: { $in: bookingIds } }),
      Availability.deleteMany({ bike: { $in: bikeIds } }),
      Booking.deleteMany({ _id: { $in: bookingIds } }),
      Bike.deleteMany({ _id: { $in: bikeIds } }),
      User.deleteMany({ _id: { $in: userIds } })
    ]);

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const users = await User.insertMany(demoUsers.map(user => ({
      ...user,
      passwordHash,
      isVerified: true,
      rating: user.role === 'renter' ? 4.6 : 4.8,
      numReviews: user.role === 'admin' ? 0 : 3
    })));
    const byEmail = Object.fromEntries(users.map(user => [user.email, user]));
    const owners = demoUsers.filter(user => user.role === 'owner').map(user => byEmail[user.email]);
    const renters = demoUsers.filter(user => user.role === 'renter').map(user => byEmail[user.email]);

    const bikes = await Bike.insertMany(bikeTemplates.map(([brand, model, type, pricePerDay, area], index) => ({
      owner: owners[index % owners.length]._id,
      brand,
      model,
      type,
      year: 2021 + (index % 5),
      registrationNumber: `DEMO-${String(index + 1).padStart(3, '0')}`,
      description: `Well-maintained ${brand} ${model} available for convenient city rides in ${area}.`,
      pricePerDay,
      securityDeposit: pricePerDay * 2,
      location: { type: 'Point', coordinates: [77.5946 + index / 100, 12.9716 + index / 100], area },
      condition: index % 3 === 0 ? 'Excellent' : 'Very Good',
      isApproved: true,
      isAvailable: index !== 7,
      images: []
    })));

    const statuses = ['COMPLETED', 'ACTIVE', 'CASH_PAYMENT_CONFIRMED', 'CASH_PAYMENT_PENDING', 'APPROVED', 'PENDING', 'REJECTED', 'CANCELLED', 'DISPUTED', 'COMPLETED'];
    const bookings = [];
    for (let index = 0; index < 20; index += 1) {
      const bike = bikes[index % bikes.length];
      const renter = renters[index % renters.length];
      const owner = owners.find(candidate => candidate._id.equals(bike.owner));
      const status = statuses[index % statuses.length];
      const startOffset = status === 'COMPLETED' || status === 'CANCELLED' || status === 'REJECTED' ? -45 + index : index + 2;
      const startDate = dateAt(startOffset);
      const endDate = dateAt(startOffset + 3);
      const rentalAmount = bike.pricePerDay * 3;
      const securityDeposit = bike.securityDeposit;
      bookings.push({
        renter: renter._id,
        bike: bike._id,
        owner: owner._id,
        startDate,
        endDate,
        rentalAmount,
        securityDeposit,
        totalCash: rentalAmount + securityDeposit,
        status,
        otp: ['ACTIVE', 'CASH_PAYMENT_CONFIRMED'].includes(status) ? String(100000 + index) : undefined,
        rentalStartTime: ['ACTIVE', 'COMPLETED', 'DISPUTED'].includes(status) ? startDate : undefined,
        rentalEndTime: status === 'COMPLETED' ? endDate : undefined
      });
    }
    const createdBookings = await Booking.insertMany(bookings);

    const paymentStatuses = ['RECEIVED', 'RECEIVED', 'RECEIVED', 'PENDING', 'NOT_RECEIVED', 'DISPUTED', 'RECEIVED', 'PENDING', 'RECEIVED', 'RECEIVED'];
    await CashPayment.insertMany(createdBookings.slice(0, 10).map((booking, index) => ({
      booking: booking._id,
      amount: booking.totalCash,
      paymentMethod: 'CASH',
      status: paymentStatuses[index],
      confirmedBy: paymentStatuses[index] === 'RECEIVED' ? booking.owner : undefined,
      confirmedAt: paymentStatuses[index] === 'RECEIVED' ? dateAt(-index, 13) : undefined,
      notes: paymentStatuses[index] === 'NOT_RECEIVED' ? 'Renter has not completed the in-person handover.' : 'Demo cash payment record.'
    })));

    await SecurityDeposit.insertMany(createdBookings.slice(0, 10).map((booking, index) => ({
      booking: booking._id,
      amount: booking.securityDeposit,
      status: index === 8 ? 'DISPUTED' : index === 0 ? 'REFUNDED_DIRECTLY_BY_OWNER' : 'HELD_BY_OWNER',
      refundMethod: 'DIRECT_CASH',
      refundedAt: index === 0 ? dateAt(-2, 15) : undefined,
      notes: index === 8 ? 'Demo damage dispute awaiting admin review.' : 'Demo security deposit record.'
    })));

    const completedBookings = createdBookings.filter(booking => booking.status === 'COMPLETED');
    await Review.insertMany(completedBookings.slice(0, 6).map((booking, index) => ({
      booking: booking._id,
      bike: booking.bike,
      fromUser: booking.renter,
      toUser: booking.owner,
      reviewerRole: 'renter',
      rating: 4 + (index % 2),
      bikeConditionRating: 4 + (index % 2),
      ownerRating: 5,
      overallRating: 4 + (index % 2),
      category: 'bike',
      comment: ['Smooth pickup and a clean bike.', 'The Classic was comfortable for a weekend ride.', 'Owner was responsive and punctual.'][index % 3]
    })));

    await Notification.insertMany(createdBookings.slice(0, 15).map((booking, index) => ({
      user: index % 2 === 0 ? booking.renter : booking.owner,
      booking: booking._id,
      title: ['Booking Approved', 'Cash Payment Pending', 'Rental Completed', 'New Rental Request'][index % 4],
      message: `Demo notification for booking ${booking._id.toString().slice(-6)}.`,
      type: ['BOOKING_APPROVED', 'CASH_PAYMENT_PENDING', 'RETURN_COMPLETED', 'BOOKING_REQUESTED'][index % 4],
      link: index % 2 === 0 ? '/my-bookings' : '/rental-requests',
      isRead: index % 3 === 0,
      readAt: index % 3 === 0 ? dateAt(-index, 16) : undefined
    })));

    await Dispute.create({
      booking: createdBookings[8]._id,
      raisedBy: createdBookings[8].renter,
      reason: 'Demo damage dispute for admin review.',
      status: 'OPEN'
    });
    await Report.create({
      reportedBy: renters[0]._id,
      targetType: 'booking',
      targetBooking: createdBookings[8]._id,
      reason: 'damage',
      description: 'Demo report attached to the disputed booking.',
      status: 'PENDING'
    });

    await Inspection.insertMany(createdBookings.slice(0, 4).map((booking, index) => ({
      booking: booking._id,
      phase: index === 1 ? 'AFTER' : 'BEFORE',
      uploadedBy: booking.owner,
      images: { front: '', back: '', left: '', right: '', odometer: '', damage: '' }
    })));

    await Availability.insertMany(bikes.map((bike, index) => ({
      bike: bike._id,
      blockedDates: index === 7 ? [dateAt(2), dateAt(3), dateAt(4)] : []
    })));

    console.log(`Seeded ${users.length} users, ${bikes.length} bikes, ${createdBookings.length} bookings, reviews, notifications, cash payments, deposits, disputes, reports, inspections, and availability records.`);
    console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = seed;
