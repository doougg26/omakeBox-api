const AppError = require('../utils/AppError');
const UserRepository = require('../repositories/UserRepository');
const AnimeRepository = require('../repositories/AnimeRepository');
const CharacterRepository = require('../repositories/CharacterRepository');
const jikanClient = require('../integrations/JikanClient');
const { User, Anime, Character } = require('../models');

class OnboardingService {
  /**
   * Sincroniza um anime da Jikan API para o cache local e retorna o registro
   */
  async syncAnimeFromJikan(malId) {
    const existing = await AnimeRepository.findByMalId(malId);
    if (existing) {
      return existing;
    }

    const response = await jikanClient.getAnimeById(malId);
    const animeData = response.data;

    if (!animeData) {
      throw new AppError('Anime não encontrado na Jikan API', 404);
    }

    const anime = await AnimeRepository.create({
      mal_id: animeData.mal_id,
      titulo: animeData.title || animeData.titles?.[0]?.title || 'Sem título',
      capa_url: animeData.images?.jpg?.large_image_url || animeData.images?.jpg?.image_url,
      sinopse: animeData.synopsis,
      status: animeData.status ? this._normalizeStatus(animeData.status) : null,
      generos: animeData.genres?.map((g) => ({ id: g.mal_id, nome: g.name })) || [],
      estudios: animeData.studios?.map((s) => ({ id: s.mal_id, nome: s.name })) || [],
      total_episodios: animeData.episodes,
      temporada: animeData.season,
      ano: animeData.year,
      ultima_sincronizacao: new Date(),
    });

    return anime;
  }

  /**
   * Sincroniza os personagens de um anime da Jikan API para o cache local
   */
  async syncCharactersFromJikan(animeId, malId) {
    const existingCharacters = await CharacterRepository.findByAnimeId(animeId);
    if (existingCharacters.length > 0) {
      return existingCharacters;
    }

    const response = await jikanClient.getAnimeCharacters(malId);
    const charactersData = response.data || [];

    const characters = [];
    for (const charData of charactersData.slice(0, 20)) {
      const character = charData.character;
      if (!character) continue;

      const [created] = await CharacterRepository.findOrCreateByMalId(
        character.mal_id,
        {
          mal_id: character.mal_id,
          nome: character.name,
          imagem_url: character.images?.jpg?.image_url,
          anime_id: animeId,
        }
      );
      characters.push(created);
    }

    return characters;
  }

  /**
   * Define o anime favorito do usuário e sincroniza dados da Jikan
   */
  async setFavoriteAnime(userId, malId) {
    const anime = await this.syncAnimeFromJikan(malId);

    // Não reseta mais avatar ao mudar anime favorito
    await UserRepository.updateProfile(userId, {
      anime_favorito_id: anime.id,
    });

    // Sincroniza personagens em background
    this.syncCharactersFromJikan(anime.id, malId).catch((err) => {
      console.warn('Erro ao sincronizar personagens:', err.message);
    });

    const user = await UserRepository.findById(userId, {
      include: [
        { model: Anime, as: 'animeFavorito', attributes: ['id', 'titulo', 'capa_url', 'mal_id'] },
      ],
    });

    return {
      anime: {
        id: anime.id,
        mal_id: anime.mal_id,
        titulo: anime.titulo,
        capa_url: anime.capa_url,
      },
      user: {
        id: user.id,
        nickname: user.nickname,
        anime_favorito_id: user.anime_favorito_id,
      },
    };
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

module.exports = new OnboardingService();
