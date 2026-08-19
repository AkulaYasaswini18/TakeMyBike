const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and 'admin' role
router.use(authenticate, authorize('admin'));

// Stats & Analytics
router.get('/stats', adminController.getStats);

// User Management
router.get('/users', adminController.getUsers);

// Bike Approvals & Inventory
router.get('/bikes', adminController.getBikes);
router.put('/bikes/:id/approve', adminController.approveBike);
router.put('/bikes/:id/reject', adminController.rejectBike);
router.put('/bikes/:id/suspend', adminController.suspendBike);

// Bookings & Payments (Read-Only)
router.get('/bookings', adminController.getBookings);
router.get('/payments', adminController.getPayments);

// Disputes & Reports
router.get('/disputes', adminController.getDisputes);
router.put('/disputes/:id', adminController.resolveDispute);
router.get('/reports', adminController.getReports);
router.put('/reports/:id', adminController.updateReport);

module.exports = router;
