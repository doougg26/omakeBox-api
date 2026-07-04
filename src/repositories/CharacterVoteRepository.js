const BaseRepository = require('./BaseRepository');
const { Sequelize } = require('sequelize');
const { CharacterVote, Character } = require('../models');

class CharacterVoteRepository extends BaseRepository {
  constructor() {
    super(CharacterVote);
  }

  async findByUserAndAnime(userId, animeId) {
    return this.findOne({
      where: { user_id: userId, anime_id: animeId },
    });
  }

  async getRankingByAnime(animeId) {
    // Primeiro pega a contagem de votos agrupada por personagem
    const counts = await CharacterVote.findAll({
      attributes: [
        'character_id',
        [Sequelize.fn('COUNT', Sequelize.col('character_id')), 'votos'],
      ],
      where: { anime_id: animeId },
      group: ['character_id'],
      order: [[Sequelize.literal('votos'), 'DESC']],
      raw: true,
    });

    // Depois busca os dados dos personagens
    const characterIds = counts.map((c) => c.character_id);
    if (characterIds.length === 0) return [];

    const characters = await Character.findAll({
      where: { id: characterIds },
      attributes: ['id', 'nome', 'imagem_url', 'mal_id'],
      raw: true,
    });
    const charMap = Object.fromEntries(characters.map((c) => [c.id, c]));

    // Combina os dados
    return counts.map((c) => ({
      character_id: c.character_id,
      votos: parseInt(c.votos, 10),
      character: charMap[c.character_id] || null,
    }));
  }

  async getUserVote(userId, animeId) {
    return this.findOne({
      where: { user_id: userId, anime_id: animeId },
      include: [{ model: Character, attributes: ['id', 'nome', 'imagem_url'] }],
    });
  }
}

module.exports = new CharacterVoteRepository();
