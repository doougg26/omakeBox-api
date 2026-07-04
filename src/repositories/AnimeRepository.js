const BaseRepository = require('./BaseRepository');
const { Anime } = require('../models');

class AnimeRepository extends BaseRepository {
  constructor() {
    super(Anime);
  }

  async findByMalId(malId, options = {}) {
    return this.findOne({ where: { mal_id: malId }, ...options });
  }

  async findOrCreateByMalId(malId, defaults) {
    return this.findOrCreate({ mal_id: malId }, defaults);
  }

  async searchByTitle(query) {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        titulo: {
          [Op.iLike]: `%${query}%`,
        },
      },
      limit: 20,
    });
  }
}

module.exports = new AnimeRepository();
