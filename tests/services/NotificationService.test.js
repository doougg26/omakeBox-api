const NotificationService = require('../../src/services/NotificationService');
const NotificationRepository = require('../../src/repositories/NotificationRepository');

jest.mock('../../src/repositories/NotificationRepository');

describe('NotificationService', () => {
  const userId = 'user-uuid-1';
  const mockNotification = {
    id: 'notif-uuid-1',
    user_id: userId,
    tipo: 'curtida',
    referencia_tipo: 'post',
    referencia_id: 'post-uuid-1',
    lida: false,
    criado_em: new Date('2026-07-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('deve criar uma notificação com sucesso', async () => {
      NotificationRepository.create.mockResolvedValue(mockNotification);

      const result = await NotificationService.createNotification(userId, {
        tipo: 'curtida',
        referencia_tipo: 'post',
        referencia_id: 'post-uuid-1',
      });

      expect(result.id).toBe(mockNotification.id);
      expect(NotificationRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        tipo: 'curtida',
        referencia_tipo: 'post',
        referencia_id: 'post-uuid-1',
      });
    });

    it('deve criar notificação de comentário', async () => {
      NotificationRepository.create.mockResolvedValue({
        ...mockNotification,
        tipo: 'comentario',
      });

      const result = await NotificationService.createNotification(userId, {
        tipo: 'comentario',
        referencia_tipo: 'post',
        referencia_id: 'post-uuid-2',
      });

      expect(result.tipo).toBe('comentario');
    });

    it('deve criar notificação de conexão', async () => {
      NotificationRepository.create.mockResolvedValue({
        ...mockNotification,
        tipo: 'solicitacao_conexao',
        referencia_tipo: 'user',
        referencia_id: 'other-user-uuid',
      });

      const result = await NotificationService.createNotification(userId, {
        tipo: 'solicitacao_conexao',
        referencia_tipo: 'user',
        referencia_id: 'other-user-uuid',
      });

      expect(result.tipo).toBe('solicitacao_conexao');
    });
  });

  describe('getNotifications', () => {
    it('deve listar notificações com contagem de não-lidas', async () => {
      const notifications = [
        mockNotification,
        { ...mockNotification, id: 'notif-uuid-2', lida: true, tipo: 'conexao_aceita' },
      ];
      NotificationRepository.findByUser.mockResolvedValue(notifications);
      NotificationRepository.getUnreadCount.mockResolvedValue(1);

      const result = await NotificationService.getNotifications(userId, 1);

      expect(result.notifications).toHaveLength(2);
      expect(result.unread_count).toBe(1);
      expect(result.notifications[0].tipo).toBe('curtida');
      expect(result.notifications[0].lida).toBe(false);
      expect(NotificationRepository.findByUser).toHaveBeenCalledWith(userId, 1);
    });

    it('deve retornar lista vazia se não houver notificações', async () => {
      NotificationRepository.findByUser.mockResolvedValue([]);
      NotificationRepository.getUnreadCount.mockResolvedValue(0);

      const result = await NotificationService.getNotifications(userId, 1);

      expect(result.notifications).toEqual([]);
      expect(result.unread_count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida', async () => {
      NotificationRepository.findById.mockResolvedValue(mockNotification);
      NotificationRepository.markAsRead.mockResolvedValue([1]);

      const result = await NotificationService.markAsRead(userId, 'notif-uuid-1');

      expect(result.message).toBe('Notificação marcada como lida');
      expect(NotificationRepository.markAsRead).toHaveBeenCalledWith('notif-uuid-1', userId);
    });

    it('deve lançar erro se notificação não existir', async () => {
      NotificationRepository.findById.mockResolvedValue(null);

      await expect(
        NotificationService.markAsRead(userId, 'notif-inexistente')
      ).rejects.toThrow('Notificação não encontrada');
    });

    it('deve lançar erro se notificação não pertence ao usuário', async () => {
      NotificationRepository.findById.mockResolvedValue({
        ...mockNotification,
        user_id: 'outro-usuario',
      });

      await expect(
        NotificationService.markAsRead(userId, 'notif-uuid-1')
      ).rejects.toThrow('Notificação não pertence a este usuário');
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas as notificações como lidas', async () => {
      NotificationRepository.markAllAsRead.mockResolvedValue([3]);

      const result = await NotificationService.markAllAsRead(userId);

      expect(result.message).toBe('Todas as notificações marcadas como lidas');
      expect(NotificationRepository.markAllAsRead).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUnreadCount', () => {
    it('deve retornar contagem de não-lidas', async () => {
      NotificationRepository.getUnreadCount.mockResolvedValue(5);

      const result = await NotificationService.getUnreadCount(userId);

      expect(result).toBe(5);
    });

    it('deve retornar 0 se todas estiverem lidas', async () => {
      NotificationRepository.getUnreadCount.mockResolvedValue(0);

      const result = await NotificationService.getUnreadCount(userId);

      expect(result).toBe(0);
    });
  });
});
