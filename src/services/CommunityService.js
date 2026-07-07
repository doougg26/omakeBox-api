const AppError = require('../utils/AppError');
const AnimeRepository = require('../repositories/AnimeRepository');
const CharacterRepository = require('../repositories/CharacterRepository');
const CharacterVoteRepository = require('../repositories/CharacterVoteRepository');
const UserAnimeTrackingRepository = require('../repositories/UserAnimeTrackingRepository');
const OnboardingService = require('./OnboardingService');
const jikanClient = require('../integrations/JikanClient');
const { Character, User } = require('../models');

class CommunityService {
  /**
   * Retorna detalhes completos de um anime (sincroniza da Jikan se necessário)
   */
  async getAnimeDetails(malId) {
    let anime = await AnimeRepository.findByMalId(malId, {
      include: [{ model: Character, attributes: ['id', 'nome', 'imagem_url', 'mal_id'] }],
    });

    if (!anime) {
      anime = await OnboardingService.syncAnimeFromJikan(malId);
    }

    // Tenta buscar dados frescos da Jikan (sem falhar se der erro)
    try {
      const freshData = await jikanClient.getAnimeById(malId);
      const d = freshData.data;
      if (d) {
        await AnimeRepository.update(
          { mal_id: malId },
          {
            sinopse: d.synopsis || anime.sinopse,
            capa_url:
              d.images?.jpg?.large_image_url || d.images?.jpg?.image_url || anime.capa_url,
            total_episodios: d.episodes ?? anime.total_episodios,
            temporada: d.season || anime.temporada,
            ano: d.year || anime.ano,
            generos:
              d.genres?.map((g) => ({ id: g.mal_id, nome: g.name })) || anime.generos,
            estudios:
              d.studios?.map((s) => ({ id: s.mal_id, nome: s.name })) || anime.estudios,
            status: d.status ? this._normalizeStatus(d.status) : anime.status,
            ultima_sincronizacao: new Date(),
          }
        );
      }
    } catch (e) {
      // Continua com dados do cache
    }

    const result = await AnimeRepository.findByMalId(malId, {
      include: [{ model: Character, attributes: ['id', 'nome', 'imagem_url', 'mal_id'] }],
    });

    return result;
  }

  /**
   * Vota em um personagem (1 voto por usuário por anime)
   */
  async voteCharacter(userId, animeMalId, characterMalId) {
    // Garante que o anime existe no cache
    let anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) {
      anime = await OnboardingService.syncAnimeFromJikan(animeMalId);
    }

    // Garante que o personagem existe no cache
    let character = await CharacterRepository.findByMalId(characterMalId);
    if (!character) {
      const response = await jikanClient.getAnimeCharacters(animeMalId);
      const charData = response.data?.find((c) => c.character?.mal_id === characterMalId);
      if (!charData) throw new AppError('Personagem não encontrado', 404);

      const c = charData.character;
      character = await CharacterRepository.create({
        mal_id: c.mal_id,
        nome: c.name,
        imagem_url: c.images?.jpg?.image_url,
        anime_id: anime.id,
      });
    }

    // Remove voto anterior se existir
    const existingVote = await CharacterVoteRepository.findByUserAndAnime(
      userId,
      anime.id
    );
    if (existingVote) {
      if (existingVote.character_id === character.id) {
        throw new AppError('Você já votou neste personagem', 409);
      }
      await CharacterVoteRepository.delete({ id: existingVote.id });
    }

    // Cria novo voto
    const vote = await CharacterVoteRepository.create({
      user_id: userId,
      character_id: character.id,
      anime_id: anime.id,
    });

    return {
      id: vote.id,
      character: {
        id: character.id,
        nome: character.nome,
        imagem_url: character.imagem_url,
      },
    };
  }

  /**
   * Retorna o ranking de personagens de um anime
   */
  async getCharacterRanking(animeMalId) {
    const anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) throw new AppError('Anime não encontrado', 404);

    const ranking = await CharacterVoteRepository.getRankingByAnime(anime.id);

    return ranking.map((r) => ({
      character_id: r.character_id,
      nome: r.character?.nome || 'Desconhecido',
      imagem_url: r.character?.imagem_url,
      votos: parseInt(r.votos, 10),
    }));
  }

  /**
   * Retorna o voto do usuário para um anime
   */
  async getUserVote(userId, animeMalId) {
    const anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) return null;

    return CharacterVoteRepository.getUserVote(userId, anime.id);
  }

  /**
   * Atribui nota a um anime (via tracking)
   */
  async rateAnime(userId, animeMalId, nota) {
    if (nota < 0 || nota > 10) {
      throw new AppError('Nota deve ser entre 0 e 10', 400);
    }

    let anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) {
      anime = await OnboardingService.syncAnimeFromJikan(animeMalId);
    }

    const existing = await UserAnimeTrackingRepository.findByUserAndAnime(
      userId,
      anime.id
    );

    if (existing) {
      await UserAnimeTrackingRepository.update(
        { user_id: userId, anime_id: anime.id },
        { nota, atualizado_em: new Date() }
      );
    } else {
      await UserAnimeTrackingRepository.create({
        user_id: userId,
        anime_id: anime.id,
        status: 'planejo_assistir',
        nota,
      });
    }

    const media = await UserAnimeTrackingRepository.getAverageRating(anime.id);
    return {
      media: media?.media ? parseFloat(media.media).toFixed(1) : null,
      total_votos: parseInt(media?.total || 0, 10),
    };
  }

  /**
   * Retorna a média de notas de um anime
   */
  async getAnimeRating(animeMalId) {
    const anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) {
      return { media: null, total_votos: 0 };
    }

    const media = await UserAnimeTrackingRepository.getAverageRating(anime.id);
    return {
      media: media?.media ? parseFloat(media.media).toFixed(1) : null,
      total_votos: parseInt(media?.total || 0, 10),
    };
  }

  /**
   * Adiciona uma review/impressão textual
   */
  async addReview(userId, animeMalId, texto) {
    if (!texto || texto.length > 500) {
      throw new AppError('Texto da impressão deve ter no máximo 500 caracteres', 400);
    }

    let anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) {
      anime = await OnboardingService.syncAnimeFromJikan(animeMalId);
    }

    const existing = await UserAnimeTrackingRepository.findByUserAndAnime(
      userId,
      anime.id
    );

    if (existing) {
      await UserAnimeTrackingRepository.update(
        { user_id: userId, anime_id: anime.id },
        { impressao_texto: texto, atualizado_em: new Date() }
      );
    } else {
      await UserAnimeTrackingRepository.create({
        user_id: userId,
        anime_id: anime.id,
        status: 'planejo_assistir',
        impressao_texto: texto,
      });
    }

    return { message: 'Impressão salva com sucesso' };
  }

  /**
   * Retorna as reviews de um anime com regra de visibilidade
   * Só mostra o texto completo para quem completou todos os episódios
   */
  async getReviews(animeMalId, currentUserId = null) {
    const anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) {
      return [];
    }

    const trackings = await UserAnimeTrackingRepository.findAllByAnime(anime.id);
    const totalEpisodios = anime.total_episodios;

    // Se o usuário atual completou o anime, ele vê os textos completos
    let userCompleted = false;
    if (currentUserId) {
      const userTracking = await UserAnimeTrackingRepository.findByUserAndAnime(
        currentUserId,
        anime.id
      );
      userCompleted =
        userTracking?.status === 'completo' ||
        (totalEpisodios &&
          userTracking?.ultimo_episodio_assistido >= totalEpisodios);
    }

    // Carrega todos os usuários de uma vez para evitar N+1 queries
    const userIds = trackings
      .filter((t) => t.impressao_texto)
      .map((t) => t.user_id);

    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'nickname'],
      raw: true,
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const reviews = [];
    for (const tracking of trackings) {
      if (!tracking.impressao_texto) continue;

      const user = userMap[tracking.user_id];

      reviews.push({
        id: tracking.id,
        user: {
          id: user?.id,
          nickname: user?.nickname || 'Desconhecido',
        },
        texto:
          !currentUserId || !userCompleted
            ? null
            : tracking.impressao_texto,
        bloqueado: !userCompleted,
        progresso_necessario: !userCompleted && totalEpisodios
          ? `${Math.min(tracking.ultimo_episodio_assistido || 0, totalEpisodios)}/${totalEpisodios} episódios`
          : null,
        nota: tracking.nota,
        criado_em: tracking.criado_em,
      });
    }

    return reviews;
  }

  /**
   * Retorna lista de personagens de um anime (do cache ou Jikan)
   */
  async getCharacters(animeMalId) {
    let anime = await AnimeRepository.findByMalId(animeMalId, {
      include: [{ model: Character, attributes: ['id', 'nome', 'imagem_url', 'mal_id'] }],
    });

    if (!anime) {
      anime = await OnboardingService.syncAnimeFromJikan(animeMalId);
    }

    // Se não tem personagens cacheados, busca da Jikan
    if (!anime.Characters || anime.Characters.length === 0) {
      await OnboardingService.syncCharactersFromJikan(anime.id, anime.mal_id);

      anime = await AnimeRepository.findByMalId(animeMalId, {
        include: [{ model: Character, attributes: ['id', 'nome', 'imagem_url', 'mal_id'] }],
      });
    }

    return (anime.Characters || []).map((c) => ({
      id: c.id,
      mal_id: c.mal_id,
      nome: c.nome,
      imagem_url: c.imagem_url,
    }));
  }

  _normalizeStatus(status) {
    const map = {
      'Currently Airing': 'em_exibicao',
      'Finished Airing': 'finalizado',
      'Not yet aired': 'anunciado',
    };
    return map[status] || status;
  }
}

module.exports = new CommunityService();
