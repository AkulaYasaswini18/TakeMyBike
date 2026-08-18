const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const notificationController = require('../controllers/notificationController');

// GET /api/notifications/mine - get notifications and unread count
router.get('/mine', authenticate, notificationController.getMyNotifications);

// PUT /api/notifications/read-all - mark all as read
router.put('/read-all', authenticate, notificationController.markAllAsRead);

// PUT /api/notifications/:id/read - mark single as read
router.put('/:id/read', authenticate, notificationController.markAsRead);

module.exports = router;
