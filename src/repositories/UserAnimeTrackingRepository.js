const BaseRepository = require('./BaseRepository');
const { UserAnimeTracking } = require('../models');

class UserAnimeTrackingRepository extends BaseRepository {
  constructor() {
    super(UserAnimeTracking);
  }

  async findByUserAndAnime(userId, animeId) {
    return this.findOne({
      where: { user_id: userId, anime_id: animeId },
    });
  }

  async findAllByUser(userId) {
    return this.findAll({
      where: { user_id: userId },
      order: [['atualizado_em', 'DESC']],
    });
  }

  async findAllByAnime(animeId) {
    return this.findAll({
      where: { anime_id: animeId },
    });
  }

  async getUsersWithCompletedTracking(animeId) {
    return this.findAll({
      where: {
        anime_id: animeId,
        status: 'completo',
      },
    });
  }

  async getAverageRating(animeId) {
    const result = await UserAnimeTracking.findOne({
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('nota')), 'media'],
        [require('sequelize').fn('COUNT', require('sequelize').col('nota')), 'total'],
      ],
      where: {
        anime_id: animeId,
        nota: { [require('sequelize').Op.ne]: null },
      },
      raw: true,
    });
    return result;
  }
}

module.exports = new UserAnimeTrackingRepository();
