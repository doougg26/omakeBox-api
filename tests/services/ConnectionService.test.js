const ConnectionService = require('../../src/services/ConnectionService');
const ConnectionRepository = require('../../src/repositories/ConnectionRepository');
const UserRepository = require('../../src/repositories/UserRepository');
const NotificationService = require('../../src/services/NotificationService');

jest.mock('../../src/repositories/ConnectionRepository');
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/services/NotificationService');

describe('ConnectionService', () => {
  const userId = 'user-uuid-1';
  const targetUserId = 'user-uuid-2';
  const mockTargetUser = { id: targetUserId, nickname: 'targetuser' };
  const mockConnection = {
    id: 'conn-uuid-1',
    solicitante_id: userId,
    destinatario_id: targetUserId,
    status: 'pendente',
    criado_em: new Date(),
  };
  const mockAcceptedConnection = {
    ...mockConnection,
    status: 'aceita',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendRequest', () => {
    it('deve enviar solicitação de conexão com sucesso', async () => {
      UserRepository.findById.mockResolvedValue(mockTargetUser);
      ConnectionRepository.findByUsers.mockResolvedValue(null);
      ConnectionRepository.create.mockResolvedValue(mockConnection);
      NotificationService.createNotification.mockResolvedValue({});

      const result = await ConnectionService.sendRequest(userId, targetUserId);

      expect(result.status).toBe('pendente');
      expect(ConnectionRepository.create).toHaveBeenCalledWith({
        solicitante_id: userId,
        destinatario_id: targetUserId,
        status: 'pendente',
      });
    });

    it('deve lançar erro se tentar conectar com si mesmo', async () => {
      await expect(
        ConnectionService.sendRequest(userId, userId)
      ).rejects.toThrow('Você não pode se conectar com você mesmo');
    });

    it('deve lançar erro se usuário destino não existir', async () => {
      UserRepository.findById.mockResolvedValue(null);

      await expect(
        ConnectionService.sendRequest(userId, 'user-inexistente')
      ).rejects.toThrow('Usuário não encontrado');
    });

    it('deve lançar erro se já estiver conectado', async () => {
      UserRepository.findById.mockResolvedValue(mockTargetUser);
      ConnectionRepository.findByUsers.mockResolvedValue(mockAcceptedConnection);

      await expect(
        ConnectionService.sendRequest(userId, targetUserId)
      ).rejects.toThrow('Você já está conectado com este usuário');
    });

    it('deve lançar erro se solicitação já foi enviada', async () => {
      UserRepository.findById.mockResolvedValue(mockTargetUser);
      ConnectionRepository.findByUsers.mockResolvedValue(mockConnection);

      await expect(
        ConnectionService.sendRequest(userId, targetUserId)
      ).rejects.toThrow('Solicitação já enviada');
    });

    it('deve aceitar automaticamente se o usuário recebeu uma solicitação', async () => {
      const receivedRequest = {
        ...mockConnection,
        solicitante_id: targetUserId,
        destinatario_id: userId,
        status: 'pendente',
      };
      UserRepository.findById.mockResolvedValue(mockTargetUser);
      ConnectionRepository.findByUsers.mockResolvedValue(receivedRequest);
      ConnectionRepository.findById.mockResolvedValue(receivedRequest);
      ConnectionRepository.update.mockResolvedValue([1]);
      NotificationService.createNotification.mockResolvedValue({});

      const result = await ConnectionService.sendRequest(userId, targetUserId);

      expect(result.status).toBe('aceita');
    });
  });

  describe('acceptRequest', () => {
    it('deve aceitar solicitação pendente', async () => {
      ConnectionRepository.findById.mockResolvedValue(mockConnection);
      ConnectionRepository.update.mockResolvedValue([1]);
      NotificationService.createNotification.mockResolvedValue({});

      const result = await ConnectionService.acceptRequest(targetUserId, 'conn-uuid-1');

      expect(result.status).toBe('aceita');
      expect(ConnectionRepository.update).toHaveBeenCalledWith(
        { id: 'conn-uuid-1' },
        { status: 'aceita' }
      );
    });

    it('deve lançar erro se solicitação não existir', async () => {
      ConnectionRepository.findById.mockResolvedValue(null);

      await expect(
        ConnectionService.acceptRequest(targetUserId, 'conn-inexistente')
      ).rejects.toThrow('Solicitação não encontrada');
    });

    it('deve lançar erro se não for o destinatário', async () => {
      ConnectionRepository.findById.mockResolvedValue(mockConnection);

      await expect(
        ConnectionService.acceptRequest('outro-usuario', 'conn-uuid-1')
      ).rejects.toThrow('Você não pode aceitar esta solicitação');
    });

    it('deve lançar erro se solicitação já foi processada', async () => {
      ConnectionRepository.findById.mockResolvedValue(mockAcceptedConnection);

      await expect(
        ConnectionService.acceptRequest(targetUserId, 'conn-uuid-1')
      ).rejects.toThrow('Solicitação já processada');
    });
  });

  describe('removeConnection', () => {
    it('deve remover conexão como solicitante', async () => {
      ConnectionRepository.findById.mockResolvedValue(mockAcceptedConnection);
      ConnectionRepository.delete.mockResolvedValue(1);

      const result = await ConnectionService.removeConnection(userId, 'conn-uuid-1');

      expect(result.message).toBe('Conexão removida');
    });

    it('deve remover conexão como destinatário', async () => {
      ConnectionRepository.findById.mockResolvedValue(mockAcceptedConnection);

      const result = await ConnectionService.removeConnection(targetUserId, 'conn-uuid-1');

      expect(result.message).toBe('Conexão removida');
    });

    it('deve lançar erro se conexão não existir', async () => {
      ConnectionRepository.findById.mockResolvedValue(null);

      await expect(
        ConnectionService.removeConnection(userId, 'conn-inexistente')
      ).rejects.toThrow('Conexão não encontrada');
    });

    it('deve lançar erro se não for participante da conexão', async () => {
      ConnectionRepository.findById.mockResolvedValue(mockAcceptedConnection);

      await expect(
        ConnectionService.removeConnection('terceiro-usuario', 'conn-uuid-1')
      ).rejects.toThrow('Você não pode remover esta conexão');
    });
  });

  describe('getConnections', () => {
    it('deve listar conexões do usuário', async () => {
      const mockConnections = [
        {
          id: 'conn-uuid-1',
          solicitante_id: userId,
          destinatario_id: targetUserId,
          criado_em: new Date(),
          Solicitante: { id: userId, nickname: 'user1', avatar_url: null },
          Destinatario: { id: targetUserId, nickname: 'user2', avatar_url: null },
        },
      ];
      ConnectionRepository.getConnections.mockResolvedValue([
        {
          id: 'conn-uuid-1',
          user: { id: targetUserId, nickname: 'user2', avatar: null },
          criado_em: expect.any(Date),
        },
      ]);

      const result = await ConnectionService.getConnections(userId);

      expect(Array.isArray(result)).toBe(true);
    });

    it('deve retornar lista vazia se não houver conexões', async () => {
      ConnectionRepository.getConnections.mockResolvedValue([]);

      const result = await ConnectionService.getConnections(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getPendingRequests', () => {
    it('deve listar solicitações pendentes', async () => {
      const pendingRequests = [
        {
          id: 'conn-uuid-1',
          solicitante_id: targetUserId,
          destinatario_id: userId,
          status: 'pendente',
          criado_em: new Date(),
          Solicitante: { id: targetUserId, nickname: 'targetuser', avatar_url: null },
        },
      ];
      ConnectionRepository.findPendingByUser.mockResolvedValue(pendingRequests);

      const result = await ConnectionService.getPendingRequests(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('deve retornar lista vazia se não houver pendentes', async () => {
      ConnectionRepository.findPendingByUser.mockResolvedValue([]);

      const result = await ConnectionService.getPendingRequests(userId);

      expect(result).toEqual([]);
    });
  });
});
