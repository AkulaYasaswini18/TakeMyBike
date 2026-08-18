const Notification = require('../models/Notification');

// Helper to create an in-app notification safely
exports.createNotification = async (userId, { title, message, type = 'SYSTEM', link = '', booking = null }) => {
  try {
    if (!userId || !message) return null;
    const notif = await Notification.create({
      user: userId,
      title: title || 'BikeShare Notification',
      message,
      type,
      link,
      booking
    });
    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

// GET /api/notifications/mine - Get user's notifications
exports.getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/:id/read - Mark single notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: id, user: userId });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/read-all - Mark all notifications as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({
      message: 'All notifications marked as read'
    });
  } catch (err) {
    next(err);
  }
};
