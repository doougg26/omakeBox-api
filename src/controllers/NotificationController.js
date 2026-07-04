const notificationService = require('../services/NotificationService');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const result = await notificationService.getNotifications(req.userId, page);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.userId);
      res.json({ unread_count: count });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      const result = await notificationService.markAsRead(req.userId, notificationId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
