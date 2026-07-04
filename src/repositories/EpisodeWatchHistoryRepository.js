const BaseRepository = require('./BaseRepository');
const { EpisodeWatchHistory } = require('../models');

class EpisodeWatchHistoryRepository extends BaseRepository {
  constructor() {
    super(EpisodeWatchHistory);
  }

  async findByUserAndAnime(userId, animeId) {
    return this.findAll({
      where: { user_id: userId, anime_id: animeId },
      order: [['criado_em', 'DESC']],
    });
  }

  async getHistorySummary(userId, animeId) {
    const { Sequelize } = require('sequelize');
    const history = await this.findAll({
      attributes: [
        'episode_number',
        [Sequelize.fn('MAX', Sequelize.col('criado_em')), 'assistido_em'],
      ],
      where: { user_id: userId, anime_id: animeId },
      group: ['episode_number'],
      order: [[Sequelize.fn('MAX', Sequelize.col('criado_em')), 'DESC']],
      raw: true,
    });
    return history.map((h) => ({
      episode_number: h.episode_number,
      assistido_em: h.assistido_em,
    }));
  }
}

module.exports = new EpisodeWatchHistoryRepository();
