const BaseRepository = require('./BaseRepository');
const { Connection, User } = require('../models');
const { Op } = require('sequelize');

class ConnectionRepository extends BaseRepository {
  constructor() {
    super(Connection);
  }

  async findPendingByUser(userId) {
    return this.findAll({
      where: { destinatario_id: userId, status: 'pendente' },
      include: [
        { model: User, as: 'Solicitante', attributes: ['id', 'nickname'] },
      ],
      order: [['criado_em', 'DESC']],
    });
  }

  async findAllByUser(userId) {
    return this.findAll({
      where: {
        [Op.or]: [
          { solicitante_id: userId },
          { destinatario_id: userId },
        ],
        status: 'aceita',
      },
      include: [
        { model: User, as: 'Solicitante', attributes: ['id', 'nickname'] },
        { model: User, as: 'Destinatario', attributes: ['id', 'nickname'] },
      ],
      order: [['criado_em', 'DESC']],
    });
  }

  async findByUsers(solicitanteId, destinatarioId) {
    return this.findOne({
      where: {
        [Op.or]: [
          { solicitante_id: solicitanteId, destinatario_id: destinatarioId },
          { solicitante_id: destinatarioId, destinatario_id: solicitanteId },
        ],
      },
    });
  }

  async findExistingRequest(solicitanteId, destinatarioId) {
    return this.findOne({
      where: {
        solicitante_id: solicitanteId,
        destinatario_id: destinatarioId,
      },
    });
  }

  async getConnections(userId) {
    const connections = await this.findAllByUser(userId);
    return connections.map((c) => {
      const friend = c.solicitante_id === userId ? c.Destinatario : c.Solicitante;
      return {
        id: c.id,
        user: {
          id: friend.id,
          nickname: friend.nickname,
        },
        criado_em: c.criado_em,
      };
    });
  }
}

module.exports = new ConnectionRepository();
