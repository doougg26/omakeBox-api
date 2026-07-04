const NotificationRepository = require('../repositories/NotificationRepository');
const AppError = require('../utils/AppError');

class NotificationService {
  /**
   * Cria uma notificação para um usuário
   */
  async createNotification(userId, { tipo, referencia_tipo, referencia_id }) {
    const notification = await NotificationRepository.create({
      user_id: userId,
      tipo,
      referencia_tipo,
      referencia_id,
    });
    return notification;
  }

  /**
   * Lista notificações do usuário logado
   */
  async getNotifications(userId, page = 1) {
    const notifications = await NotificationRepository.findByUser(userId, page);
    const unreadCount = await NotificationRepository.getUnreadCount(userId);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        tipo: n.tipo,
        referencia_tipo: n.referencia_tipo,
        referencia_id: n.referencia_id,
        lida: n.lida,
        criado_em: n.criado_em,
      })),
      unread_count: unreadCount,
    };
  }

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(userId, notificationId) {
    const notification = await NotificationRepository.findById(notificationId);
    if (!notification) throw new AppError('Notificação não encontrada', 404);
    if (notification.user_id !== userId) {
      throw new AppError('Notificação não pertence a este usuário', 403);
    }

    await NotificationRepository.markAsRead(notificationId, userId);
    return { message: 'Notificação marcada como lida' };
  }

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(userId) {
    await NotificationRepository.markAllAsRead(userId);
    return { message: 'Todas as notificações marcadas como lidas' };
  }

  /**
   * Retorna contagem de não lidas
   */
  async getUnreadCount(userId) {
    return NotificationRepository.getUnreadCount(userId);
  }
}

module.exports = new NotificationService();
