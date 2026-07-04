const AppError = require('../utils/AppError');
const AnimeRepository = require('../repositories/AnimeRepository');
const UserAnimeTrackingRepository = require('../repositories/UserAnimeTrackingRepository');
const UserRepository = require('../repositories/UserRepository');
const EpisodeWatchHistoryRepository = require('../repositories/EpisodeWatchHistoryRepository');
const OnboardingService = require('./OnboardingService');

class TrackingService {
  /**
   * Inicia ou atualiza o tracking de um anime
   */
  async upsertTracking(userId, animeMalId, data) {
    let anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) {
      anime = await OnboardingService.syncAnimeFromJikan(animeMalId);
    }

    const existing = await UserAnimeTrackingRepository.findByUserAndAnime(
      userId,
      anime.id
    );

    const updateData = {};
    const allowedFields = ['status', 'ultimo_episodio_assistido', 'nota', 'impressao_texto'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    // Registrar histórico se episódios foram alterados
    if (data.ultimo_episodio_assistido !== undefined) {
      const oldEp = existing?.ultimo_episodio_assistido || 0;
      const newEp = data.ultimo_episodio_assistido;
      if (newEp > oldEp) {
        for (let ep = oldEp + 1; ep <= newEp; ep++) {
          await EpisodeWatchHistoryRepository.create({
            user_id: userId,
            anime_id: anime.id,
            episode_number: ep,
            criado_em: new Date(),
          });
        }
      }

      // Auto-marcar como 'assistindo' se definiu episódios sem status
      if (data.status === undefined) {
        if (!existing) {
          updateData.status = 'assistindo';
        }
        const isComplete = anime.total_episodios && data.ultimo_episodio_assistido >= anime.total_episodios;
        if (isComplete && existing?.status !== 'completo') {
          updateData.status = 'completo';
        }
      }
    }

    updateData.atualizado_em = new Date();

    if (existing) {
      await UserAnimeTrackingRepository.update(
        { user_id: userId, anime_id: anime.id },
        updateData
      );
    } else {
      await UserAnimeTrackingRepository.create({
        user_id: userId,
        anime_id: anime.id,
        status: data.status || 'planejo_assistir',
        ...updateData,
      });
    }

    return this.getTracking(userId, animeMalId);
  }

  /**
   * Retorna o tracking do usuário para um anime específico
   */
  async getTracking(userId, animeMalId) {
    const anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) return null;

    const tracking = await UserAnimeTrackingRepository.findByUserAndAnime(
      userId,
      anime.id
    );

    if (!tracking) return null;

    return {
      id: tracking.id,
      status: tracking.status,
      ultimo_episodio_assistido: tracking.ultimo_episodio_assistido,
      nota: tracking.nota,
      impressao_texto: tracking.impressao_texto,
      criado_em: tracking.criado_em,
      atualizado_em: tracking.atualizado_em,
    };
  }

  /**
   * Retorna trackings públicos de um usuário pelo nickname
   */
  async getUserTrackingsByNickname(nickname) {
    const user = await UserRepository.findByNickname(nickname);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }
    return this.getUserTrackings(user.id);
  }

  /**
   * Retorna stats públicas de um usuário pelo nickname
   */
  async getTrackingStatsByNickname(nickname) {
    const user = await UserRepository.findByNickname(nickname);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }
    return this.getTrackingStats(user.id);
  }

  /**
   * Retorna todos os trackings do usuário
   */
  async getUserTrackings(userId) {
    const trackings = await UserAnimeTrackingRepository.findAllByUser(userId);
    const results = [];

    for (const t of trackings) {
      const anime = await AnimeRepository.findById(t.anime_id, {
        attributes: ['id', 'mal_id', 'titulo', 'capa_url', 'total_episodios'],
      });
      results.push({
        tracking: {
          id: t.id,
          status: t.status,
          ultimo_episodio_assistido: t.ultimo_episodio_assistido,
          nota: t.nota,
          impressao_texto: t.impressao_texto,
          criado_em: t.criado_em,
          atualizado_em: t.atualizado_em,
        },
        anime: anime
          ? {
              id: anime.id,
              mal_id: anime.mal_id,
              titulo: anime.titulo,
              capa_url: anime.capa_url,
              total_episodios: anime.total_episodios,
            }
          : null,
      });
    }

    return results;
  }

  /**
   * Marca o próximo episódio como assistido (incrementa o contador)
   */
  async watchEpisode(userId, animeMalId) {
    let anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) {
      anime = await OnboardingService.syncAnimeFromJikan(animeMalId);
    }

    const existing = await UserAnimeTrackingRepository.findByUserAndAnime(
      userId,
      anime.id
    );

    const currentEp = existing?.ultimo_episodio_assistido || 0;
    const nextEp = currentEp + 1;

    // Registrar histórico
    await EpisodeWatchHistoryRepository.create({
      user_id: userId,
      anime_id: anime.id,
      episode_number: nextEp,
      criado_em: new Date(),
    });

    const isComplete = anime.total_episodios && nextEp >= anime.total_episodios;

    const updateData = {
      ultimo_episodio_assistido: nextEp,
      status: isComplete ? 'completo' : (existing?.status || 'assistindo'),
      atualizado_em: new Date(),
    };

    if (existing) {
      await UserAnimeTrackingRepository.update(
        { user_id: userId, anime_id: anime.id },
        updateData
      );
    } else {
      await UserAnimeTrackingRepository.create({
        user_id: userId,
        anime_id: anime.id,
        status: 'assistindo',
        ultimo_episodio_assistido: nextEp,
        atualizado_em: new Date(),
      });
    }

    return this.getTracking(userId, animeMalId);
  }

  /**
   * Retorna detalhes completos do tracking incluindo histórico de episódios
   */
  async getTrackingDetails(userId, animeMalId) {
    let anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) {
      anime = await OnboardingService.syncAnimeFromJikan(animeMalId);
    }

    const tracking = await UserAnimeTrackingRepository.findByUserAndAnime(
      userId,
      anime.id
    );

    if (!tracking) {
      return {
        anime: {
          mal_id: anime.mal_id,
          titulo: anime.titulo,
          capa_url: anime.capa_url,
          total_episodios: anime.total_episodios,
          sinopse: anime.sinopse,
        },
        tracking: null,
        history: [],
      };
    }

    const history = await EpisodeWatchHistoryRepository.getHistorySummary(userId, anime.id);

    const totalEp = anime.total_episodios;
    const watchedEp = tracking.ultimo_episodio_assistido || 0;
    const percent = totalEp > 0 ? Math.min(Math.round((watchedEp / totalEp) * 100), 100) : 0;

    return {
      anime: {
        mal_id: anime.mal_id,
        titulo: anime.titulo,
        capa_url: anime.capa_url,
        total_episodios: totalEp,
        sinopse: anime.sinopse,
        generos: anime.generos,
        status: anime.status,
        temporada: anime.temporada,
        ano: anime.ano,
      },
      tracking: {
        id: tracking.id,
        status: tracking.status,
        ultimo_episodio_assistido: watchedEp,
        nota: tracking.nota,
        impressao_texto: tracking.impressao_texto,
        criado_em: tracking.criado_em,
        atualizado_em: tracking.atualizado_em,
        progresso_percentual: percent,
        episodios_restantes: totalEp ? Math.max(0, totalEp - watchedEp) : null,
      },
      history,
    };
  }

  /**
   * Retorna estatísticas agregadas de tracking do usuário
   */
  async getTrackingStats(userId) {
    const trackings = await UserAnimeTrackingRepository.findAllByUser(userId);

    let totalEpisodiosAssistidos = 0;
    let totalAnimesCompletos = 0;
    let totalComNota = 0;
    let somaNotas = 0;
    let totalAnimes = trackings.length;
    let totalPausados = 0;
    let totalAbandonados = 0;
    let totalPlanejados = 0;
    let totalAssistindo = 0;

    for (const t of trackings) {
      totalEpisodiosAssistidos += t.ultimo_episodio_assistido || 0;

      switch (t.status) {
        case 'completo':
          totalAnimesCompletos++;
          break;
        case 'assistindo':
          totalAssistindo++;
          break;
        case 'planejo_assistir':
          totalPlanejados++;
          break;
        case 'abandonado':
          totalAbandonados++;
          break;
        case 'em_pausa':
          totalPausados++;
          break;
      }

      if (t.nota) {
        totalComNota++;
        somaNotas += t.nota;
      }
    }

    // Tempo estimado: ~24 min por episódio
    const tempoMinutos = totalEpisodiosAssistidos * 24;
    const tempoHoras = Math.floor(tempoMinutos / 60);
    const tempoDias = Math.floor(tempoHoras / 24);

    const mediaNota = totalComNota > 0 ? (somaNotas / totalComNota).toFixed(1) : null;

    return {
      total_animes: totalAnimes,
      total_episodios_assistidos: totalEpisodiosAssistidos,
      total_animes_completos: totalAnimesCompletos,
      total_assistindo: totalAssistindo,
      total_planejados: totalPlanejados,
      total_abandonados: totalAbandonados,
      total_pausados: totalPausados,
      total_com_avaliacao: totalComNota,
      media_nota: mediaNota,
      tempo_gasto: {
        minutos: tempoMinutos,
        horas: tempoHoras,
        dias: tempoDias,
        label: tempoDias >= 1
          ? `${tempoDias}d ${tempoHoras % 24}h`
          : `${tempoHoras}h ${tempoMinutos % 60}min`,
      },
    };
  }

  /**
   * Remove o tracking de um anime
   */
  async removeTracking(userId, animeMalId) {
    const anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) throw new AppError('Anime não encontrado', 404);

    await UserAnimeTrackingRepository.delete({
      user_id: userId,
      anime_id: anime.id,
    });

    return { message: 'Tracking removido' };
  }
}

module.exports = new TrackingService();
