const BaseRepository = require('./BaseRepository');
const { Notification } = require('../models');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async findByUser(userId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    return this.findAll({
      where: { user_id: userId },
      order: [['criado_em', 'DESC']],
      limit,
      offset,
    });
  }

  async getUnreadCount(userId) {
    return this.model.count({
      where: { user_id: userId, lida: false },
    });
  }

  async markAsRead(id, userId) {
    return this.update({ id, user_id: userId }, { lida: true });
  }

  async markAllAsRead(userId) {
    return this.update({ user_id: userId, lida: false }, { lida: true });
  }
}

module.exports = new NotificationRepository();
