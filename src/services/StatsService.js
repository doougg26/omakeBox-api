const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { Anime, User, Character, UserAnimeTracking, CharacterVote, Post } = require('../models');

class StatsService {
  /**
   * Retorna as 4 estatísticas principais da plataforma
   */
  async getAllStats() {
    const [topAnimes, topCharacter, topUser, topPost, topGenre, topYear, topReviewer] = await Promise.all([
      this.getTopRatedAnimes(),
      this.getMostVotedCharacter(),
      this.getUserWithMostEpisodes(),
      this.getMostLikedPost(),
      this.getMostPopularGenre(),
      this.getYearWithMostReleases(),
      this.getUserWithMostReviews(),
    ]);

    return {
      top_rated_animes: topAnimes,
      most_voted_character: topCharacter,
      most_episodes_user: topUser,
      most_liked_post: topPost,
      most_popular_genre: topGenre,
      year_most_releases: topYear,
      most_reviews_user: topReviewer,
    };
  }

  /**
   * Top 5 animes com maior média de nota (mínimo 2 avaliações)
   */
  async getTopRatedAnimes(limit = 5) {
    const results = await UserAnimeTracking.findAll({
      attributes: [
        'anime_id',
        [Sequelize.fn('AVG', Sequelize.col('nota')), 'media'],
        [Sequelize.fn('COUNT', Sequelize.col('nota')), 'total_votos'],
      ],
      where: {
        nota: { [Sequelize.Op.ne]: null },
      },
      group: ['anime_id'],
      having: Sequelize.literal('COUNT(nota) >= 2'),
      order: [[Sequelize.literal('media'), 'DESC']],
      limit,
      raw: true,
    });

    if (results.length === 0) return [];

    const animeIds = results.map((r) => r.anime_id);
    const animes = await Anime.findAll({
      where: { id: animeIds },
      attributes: ['id', 'mal_id', 'titulo', 'capa_url', 'total_episodios'],
      raw: true,
    });
    const animeMap = Object.fromEntries(animes.map((a) => [a.id, a]));

    return results.map((r) => ({
      anime: animeMap[r.anime_id]
        ? {
            mal_id: animeMap[r.anime_id].mal_id,
            titulo: animeMap[r.anime_id].titulo,
            capa_url: animeMap[r.anime_id].capa_url,
          }
        : null,
      media: parseFloat(r.media).toFixed(1),
      total_votos: parseInt(r.total_votos, 10),
    }));
  }

  /**
   * Personagem mais votado globalmente
   */
  async getMostVotedCharacter() {
    const result = await CharacterVote.findAll({
      attributes: [
        'character_id',
        [Sequelize.fn('COUNT', Sequelize.col('character_id')), 'total_votos'],
      ],
      group: ['character_id'],
      order: [[Sequelize.literal('total_votos'), 'DESC']],
      limit: 1,
      raw: true,
    });

    if (result.length === 0) return null;

    const character = await Character.findOne({
      where: { id: result[0].character_id },
      attributes: ['id', 'nome', 'imagem_url', 'mal_id', 'anime_id'],
      raw: true,
    });

    if (!character) return null;

    const anime = await Anime.findOne({
      where: { id: character.anime_id },
      attributes: ['mal_id', 'titulo'],
      raw: true,
    });

    return {
      character: {
        nome: character.nome,
        imagem_url: character.imagem_url,
        mal_id: character.mal_id,
      },
      anime: anime ? { mal_id: anime.mal_id, titulo: anime.titulo } : null,
      total_votos: parseInt(result[0].total_votos, 10),
    };
  }

  /**
   * Usuário com mais episódios assistidos
   */
  async getUserWithMostEpisodes() {
    const result = await UserAnimeTracking.findAll({
      attributes: [
        'user_id',
        [Sequelize.fn('SUM', Sequelize.col('ultimo_episodio_assistido')), 'total_episodios'],
      ],
      group: ['user_id'],
      order: [[Sequelize.literal('total_episodios'), 'DESC']],
      limit: 1,
      raw: true,
    });

    if (result.length === 0) return null;

    const user = await User.findOne({
      where: { id: result[0].user_id },
      attributes: ['id', 'nickname', 'avatar_url'],
      raw: true,
    });

    if (!user) return null;

    return {
      user: {
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      },
      total_episodios: parseInt(result[0].total_episodios, 10),
    };
  }

  /**
   * Post mais curtido
   */
  async getMostLikedPost() {
    const post = await Post.findOne({
      order: [['likes_count', 'DESC']],
      attributes: ['id', 'texto', 'likes_count', 'criado_em', 'user_id', 'anime_id'],
    });

    if (!post) return null;

    const [user, anime] = await Promise.all([
      User.findOne({
        where: { id: post.user_id },
        attributes: ['id', 'nickname', 'avatar_url'],
        raw: true,
      }),
      Anime.findOne({
        where: { id: post.anime_id },
        attributes: ['mal_id', 'titulo', 'capa_url'],
        raw: true,
      }),
    ]);

    return {
      post: {
        id: post.id,
        texto: post.texto.length > 200 ? post.texto.substring(0, 200) + '...' : post.texto,
        likes_count: post.likes_count,
        criado_em: post.criado_em,
      },
      user: user ? { nickname: user.nickname, avatar_url: user.avatar_url } : null,
      anime: anime ? { mal_id: anime.mal_id, titulo: anime.titulo, capa_url: anime.capa_url } : null,
    };
  }
  /**
   * Gênero mais popular (gênero com mais trackings por usuários)
   */
  async getMostPopularGenre() {
    const [result] = await sequelize.query(`
      SELECT
        g->>'name' AS nome,
        g->>'mal_id' AS mal_id,
        COUNT(uat.id) AS total_trackings
      FROM user_anime_trackings uat
      JOIN animes a ON a.id = uat.anime_id
      CROSS JOIN LATERAL jsonb_array_elements(a.generos) AS g
      WHERE a.generos IS NOT NULL AND a.generos::text <> '[]'
      GROUP BY g->>'name', g->>'mal_id'
      ORDER BY total_trackings DESC
      LIMIT 1
    `);

    if (!result || result.length === 0) return null;

    return {
      nome: result[0].nome,
      mal_id: parseInt(result[0].mal_id, 10),
      total_trackings: parseInt(result[0].total_trackings, 10),
    };
  }

  /**
   * Ano com mais lançamentos de animes no banco
   */
  async getYearWithMostReleases() {
    const result = await Anime.findAll({
      attributes: [
        'ano',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_animes'],
      ],
      where: {
        ano: { [Sequelize.Op.ne]: null },
      },
      group: ['ano'],
      order: [[Sequelize.literal('total_animes'), 'DESC']],
      limit: 1,
      raw: true,
    });

    if (result.length === 0) return null;

    return {
      ano: result[0].ano,
      total_animes: parseInt(result[0].total_animes, 10),
    };
  }

  /**
   * Usuário com mais avaliações (notas atribuídas)
   */
  async getUserWithMostReviews() {
    const result = await UserAnimeTracking.findAll({
      attributes: [
        'user_id',
        [Sequelize.fn('COUNT', Sequelize.col('nota')), 'total_avaliacoes'],
        [Sequelize.fn('AVG', Sequelize.col('nota')), 'media_nota'],
      ],
      where: {
        nota: { [Sequelize.Op.ne]: null },
      },
      group: ['user_id'],
      having: Sequelize.literal('COUNT(nota) >= 1'),
      order: [[Sequelize.literal('total_avaliacoes'), 'DESC']],
      limit: 1,
      raw: true,
    });

    if (result.length === 0) return null;

    const user = await User.findOne({
      where: { id: result[0].user_id },
      attributes: ['id', 'nickname', 'avatar_url'],
      raw: true,
    });

    if (!user) return null;

    return {
      user: {
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      },
      total_avaliacoes: parseInt(result[0].total_avaliacoes, 10),
      media_nota: parseFloat(result[0].media_nota).toFixed(1),
    };
  }
}

module.exports = new StatsService();
