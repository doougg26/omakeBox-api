const BaseRepository = require('./BaseRepository');
const { Character } = require('../models');

class CharacterRepository extends BaseRepository {
  constructor() {
    super(Character);
  }

  async findByMalId(malId) {
    return this.findOne({ where: { mal_id: malId } });
  }

  async findByAnimeId(animeId) {
    return this.findAll({ where: { anime_id: animeId } });
  }

  async findOrCreateByMalId(malId, defaults) {
    return this.findOrCreate({ mal_id: malId }, defaults);
  }
}

module.exports = new CharacterRepository();
