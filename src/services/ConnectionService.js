const ConnectionRepository = require('../repositories/ConnectionRepository');
const UserRepository = require('../repositories/UserRepository');
const NotificationService = require('./NotificationService');
const AppError = require('../utils/AppError');

class ConnectionService {
  /**
   * Envia uma solicitação de conexão
   */
  async sendRequest(userId, targetUserId) {
    if (userId === targetUserId) {
      throw new AppError('Você não pode se conectar com você mesmo', 400);
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Verifica se já existe conexão ou solicitação
    const existing = await ConnectionRepository.findByUsers(userId, targetUserId);
    if (existing) {
      if (existing.status === 'aceita') {
        throw new AppError('Você já está conectado com este usuário', 409);
      }
      if (existing.status === 'pendente') {
        if (existing.solicitante_id === userId) {
          throw new AppError('Solicitação já enviada', 409);
        }
        // Se o usuário recebeu uma solicitação, aceita automaticamente
        return this.acceptRequest(userId, existing.id);
      }
    }

    const connection = await ConnectionRepository.create({
      solicitante_id: userId,
      destinatario_id: targetUserId,
      status: 'pendente',
    });

    // Notifica o destinatário
    await NotificationService.createNotification(targetUserId, {
      tipo: 'solicitacao_conexao',
      referencia_tipo: 'user',
      referencia_id: userId,
    }).catch(() => {});

    return { id: connection.id, status: 'pendente' };
  }

  /**
   * Aceita uma solicitação de conexão
   */
  async acceptRequest(userId, connectionId) {
    const connection = await ConnectionRepository.findById(connectionId);
    if (!connection) throw new AppError('Solicitação não encontrada', 404);
    if (connection.destinatario_id !== userId) {
      throw new AppError('Você não pode aceitar esta solicitação', 403);
    }
    if (connection.status !== 'pendente') {
      throw new AppError('Solicitação já processada', 409);
    }

    await ConnectionRepository.update({ id: connectionId }, { status: 'aceita' });

    // Notifica o solicitante
    await NotificationService.createNotification(connection.solicitante_id, {
      tipo: 'conexao_aceita',
      referencia_tipo: 'user',
      referencia_id: userId,
    }).catch(() => {});

    return { id: connection.id, status: 'aceita' };
  }

  /**
   * Rejeita/remove uma conexão
   */
  async removeConnection(userId, connectionId) {
    const connection = await ConnectionRepository.findById(connectionId);
    if (!connection) throw new AppError('Conexão não encontrada', 404);

    if (connection.solicitante_id !== userId && connection.destinatario_id !== userId) {
      throw new AppError('Você não pode remover esta conexão', 403);
    }

    await ConnectionRepository.delete({ id: connectionId });
    return { message: 'Conexão removida' };
  }

  /**
   * Lista conexões do usuário
   */
  async getConnections(userId) {
    return ConnectionRepository.getConnections(userId);
  }

  /**
   * Lista solicitações pendentes recebidas
   */
  async getPendingRequests(userId) {
    return ConnectionRepository.findPendingByUser(userId);
  }
}

module.exports = new ConnectionService();
