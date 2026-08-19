const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

require('../config/env')();

async function seedAdmin() {
  const shouldManageConnection = mongoose.connection.readyState === 0;
  try {
    if (shouldManageConnection) {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bikeshare';
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB');
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@bikeshare.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const adminName = process.env.ADMIN_NAME || 'Platform Administrator';
    const adminPhone = process.env.ADMIN_PHONE || '9999999999';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.role = 'admin';
      admin.isVerified = true;
      admin.passwordHash = passwordHash;
      admin.name = adminName;
      admin.phone = adminPhone;
      await admin.save();
      console.log(`✓ Admin user updated: ${adminEmail}`);
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'admin',
        phone: adminPhone,
        isVerified: true
      });
      console.log(`✓ Admin user created: ${adminEmail}`);
    }

    return admin;
  } catch (err) {
    console.error('Error seeding admin user:', err);
    throw err;
  } finally {
    if (shouldManageConnection && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('Admin seeding complete.');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = seedAdmin;
