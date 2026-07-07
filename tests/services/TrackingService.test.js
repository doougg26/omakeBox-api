const TrackingService = require('../../src/services/TrackingService');
const AnimeRepository = require('../../src/repositories/AnimeRepository');
const UserAnimeTrackingRepository = require('../../src/repositories/UserAnimeTrackingRepository');
const UserRepository = require('../../src/repositories/UserRepository');
const EpisodeWatchHistoryRepository = require('../../src/repositories/EpisodeWatchHistoryRepository');
const OnboardingService = require('../../src/services/OnboardingService');
const { Anime } = require('../../src/models');

jest.mock('../../src/repositories/AnimeRepository');
jest.mock('../../src/repositories/UserAnimeTrackingRepository');
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/repositories/EpisodeWatchHistoryRepository');
jest.mock('../../src/services/OnboardingService');

describe('TrackingService', () => {
  const userId = 'user-uuid-123';
  const animeMalId = 21;
  const animeId = 'anime-uuid-456';
  const mockAnime = { id: animeId, mal_id: animeMalId, titulo: 'One Piece', capa_url: 'url', total_episodios: 100, sinopse: 'Piratas...', generos: [{ mal_id: 1, name: 'Ação' }], status: 'finalizado', temporada: 'summer', ano: 1999 };
  const mockTracking = { id: 'tracking-uuid-789', user_id: userId, anime_id: animeId, status: 'assistindo', ultimo_episodio_assistido: 50, nota: 8, impressao_texto: 'Muito bom!', criado_em: new Date('2026-01-01'), atualizado_em: new Date('2026-07-01') };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTracking', () => {
    it('deve retornar tracking quando existe', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue(mockTracking);

      const result = await TrackingService.getTracking(userId, animeMalId);

      expect(result.id).toBe(mockTracking.id);
      expect(result.status).toBe('assistindo');
      expect(result.ultimo_episodio_assistido).toBe(50);
    });

    it('deve retornar null se anime não existir', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(null);
      expect(await TrackingService.getTracking(userId, animeMalId)).toBeNull();
    });

    it('deve retornar null se tracking não existir', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue(null);
      expect(await TrackingService.getTracking(userId, animeMalId)).toBeNull();
    });
  });

  describe('upsertTracking', () => {
    it('deve criar novo tracking quando não existe', async () => {
      // Primeira chamada (upsert): anime existe, tracking não existe
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime
        .mockResolvedValueOnce(null)          // upsert: verifica existente
        .mockResolvedValueOnce(mockTracking); // getTracking: tracking agora existe
      UserAnimeTrackingRepository.create.mockResolvedValue(mockTracking);

      const result = await TrackingService.upsertTracking(userId, animeMalId, {
        status: 'assistindo',
        nota: 9,
      });

      expect(UserAnimeTrackingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          anime_id: animeId,
          status: 'assistindo',
          nota: 9,
        })
      );
      expect(result).toBeDefined();
    });

    it('deve sincronizar da Jikan se anime não existir localmente', async () => {
      AnimeRepository.findByMalId.mockResolvedValueOnce(null);
      OnboardingService.syncAnimeFromJikan.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime
        .mockResolvedValueOnce(null)          // upsert
        .mockResolvedValueOnce(mockTracking); // getTracking
      UserAnimeTrackingRepository.create.mockResolvedValue(mockTracking);

      await TrackingService.upsertTracking(userId, animeMalId, { status: 'assistindo' });

      expect(OnboardingService.syncAnimeFromJikan).toHaveBeenCalledWith(animeMalId);
    });

    it('deve atualizar tracking existente', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime
        .mockResolvedValueOnce(mockTracking)   // upsert
        .mockResolvedValueOnce(mockTracking);  // getTracking
      UserAnimeTrackingRepository.update.mockResolvedValue([1]);

      await TrackingService.upsertTracking(userId, animeMalId, { nota: 10 });

      expect(UserAnimeTrackingRepository.update).toHaveBeenCalled();
      expect(UserAnimeTrackingRepository.create).not.toHaveBeenCalled();
    });

    it('deve registrar histórico de episódios quando avançar', async () => {
      const existingTracking = { ...mockTracking, ultimo_episodio_assistido: 5 };
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime
        .mockResolvedValueOnce(existingTracking) // upsert
        .mockResolvedValueOnce(existingTracking);// getTracking
      UserAnimeTrackingRepository.update.mockResolvedValue([1]);
      EpisodeWatchHistoryRepository.create.mockResolvedValue({});

      await TrackingService.upsertTracking(userId, animeMalId, { ultimo_episodio_assistido: 8 });

      // Deve registrar eps 6, 7, 8
      expect(EpisodeWatchHistoryRepository.create).toHaveBeenCalledTimes(3);
      expect(EpisodeWatchHistoryRepository.create).toHaveBeenNthCalledWith(1, {
        user_id: userId, anime_id: animeId, episode_number: 6, criado_em: expect.any(Date),
      });
      expect(EpisodeWatchHistoryRepository.create).toHaveBeenNthCalledWith(3, {
        user_id: userId, anime_id: animeId, episode_number: 8, criado_em: expect.any(Date),
      });
    });

    it('deve marcar como completo se atingir total de episódios', async () => {
      const anime = { ...mockAnime, total_episodios: 10 };
      const createdTracking = { ...mockTracking, status: 'completo', ultimo_episodio_assistido: 10 };
      AnimeRepository.findByMalId.mockResolvedValue(anime);
      UserAnimeTrackingRepository.findByUserAndAnime
        .mockResolvedValueOnce(null)           // upsert
        .mockResolvedValueOnce(createdTracking);// getTracking
      UserAnimeTrackingRepository.create.mockResolvedValue(createdTracking);

      await TrackingService.upsertTracking(userId, animeMalId, {
        ultimo_episodio_assistido: 10,
      });

      expect(UserAnimeTrackingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completo' })
      );
    });
  });

  describe('watchEpisode', () => {
    it('deve incrementar episódio em tracking existente', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue(mockTracking);
      UserAnimeTrackingRepository.update.mockResolvedValue([1]);
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime); // getTracking
      EpisodeWatchHistoryRepository.create.mockResolvedValue({});

      const result = await TrackingService.watchEpisode(userId, animeMalId);

      expect(UserAnimeTrackingRepository.update).toHaveBeenCalledWith(
        { user_id: userId, anime_id: animeId },
        expect.objectContaining({ ultimo_episodio_assistido: 51 })
      );
      expect(EpisodeWatchHistoryRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        anime_id: animeId,
        episode_number: 51,
        criado_em: expect.any(Date),
      });
    });

    it('deve criar novo tracking se não existir ao marcar episódio', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime
        .mockResolvedValueOnce(null)          // watchEpisode
        .mockResolvedValueOnce(mockTracking); // getTracking
      UserAnimeTrackingRepository.create.mockResolvedValue(mockTracking);
      EpisodeWatchHistoryRepository.create.mockResolvedValue({});

      await TrackingService.watchEpisode(userId, animeMalId);

      expect(UserAnimeTrackingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          anime_id: animeId,
          status: 'assistindo',
          ultimo_episodio_assistido: 1,
        })
      );
    });

    it('deve marcar como completo se atingir total de episódios', async () => {
      const anime = { ...mockAnime, total_episodios: 50 };
      const trackingEp50 = { ...mockTracking, ultimo_episodio_assistido: 49 };
      AnimeRepository.findByMalId.mockResolvedValue(anime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue(trackingEp50);
      UserAnimeTrackingRepository.update.mockResolvedValue([1]);
      AnimeRepository.findByMalId.mockResolvedValue(anime); // getTracking
      EpisodeWatchHistoryRepository.create.mockResolvedValue({});

      await TrackingService.watchEpisode(userId, animeMalId);

      expect(UserAnimeTrackingRepository.update).toHaveBeenCalledWith(
        { user_id: userId, anime_id: animeId },
        expect.objectContaining({ ultimo_episodio_assistido: 50, status: 'completo' })
      );
    });
  });

  describe('getTrackingDetails', () => {
    it('deve retornar detalhes com tracking e histórico', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue(mockTracking);
      EpisodeWatchHistoryRepository.getHistorySummary.mockResolvedValue([
        { episode_number: 50, assistido_em: new Date() },
        { episode_number: 49, assistido_em: new Date() },
      ]);

      const result = await TrackingService.getTrackingDetails(userId, animeMalId);

      expect(result.anime.mal_id).toBe(animeMalId);
      expect(result.tracking.id).toBe(mockTracking.id);
      expect(result.tracking.progresso_percentual).toBe(50); // 50/100
      expect(result.tracking.episodios_restantes).toBe(50);
      expect(result.history).toHaveLength(2);
    });

    it('deve retornar tracking null se não existir', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue(null);

      const result = await TrackingService.getTrackingDetails(userId, animeMalId);

      expect(result.tracking).toBeNull();
      expect(result.history).toEqual([]);
      expect(result.anime.mal_id).toBe(animeMalId);
    });

    it('deve calcular progresso 0% se total_episodios for nulo', async () => {
      const anime = { ...mockAnime, total_episodios: null };
      AnimeRepository.findByMalId.mockResolvedValue(anime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue(mockTracking);
      EpisodeWatchHistoryRepository.getHistorySummary.mockResolvedValue([]);

      const result = await TrackingService.getTrackingDetails(userId, animeMalId);

      expect(result.tracking.progresso_percentual).toBe(0);
      expect(result.tracking.episodios_restantes).toBeNull();
    });
  });

  describe('getTrackingStats', () => {
    it('deve calcular estatísticas com trackings variados', async () => {
      UserAnimeTrackingRepository.findAllByUser.mockResolvedValue([
        { status: 'completo', ultimo_episodio_assistido: 100, nota: 9 },
        { status: 'completo', ultimo_episodio_assistido: 24, nota: 7 },
        { status: 'assistindo', ultimo_episodio_assistido: 50, nota: null },
        { status: 'planejo_assistir', ultimo_episodio_assistido: 0, nota: null },
        { status: 'abandonado', ultimo_episodio_assistido: 10, nota: 5 },
        { status: 'em_pausa', ultimo_episodio_assistido: 30, nota: 8 },
      ]);

      const result = await TrackingService.getTrackingStats(userId);

      expect(result.total_animes).toBe(6);
      expect(result.total_episodios_assistidos).toBe(214);
      expect(result.total_animes_completos).toBe(2);
      expect(result.total_assistindo).toBe(1);
      expect(result.total_planejados).toBe(1);
      expect(result.total_abandonados).toBe(1);
      expect(result.total_pausados).toBe(1);
      expect(result.total_com_avaliacao).toBe(4);
      expect(result.media_nota).toBe('7.3');
      expect(result.tempo_gasto.minutos).toBe(214 * 24);
      expect(result.tempo_gasto.label).toContain('d');
    });

    it('deve retornar estatísticas vazias se não houver trackings', async () => {
      UserAnimeTrackingRepository.findAllByUser.mockResolvedValue([]);

      const result = await TrackingService.getTrackingStats(userId);

      expect(result.total_animes).toBe(0);
      expect(result.total_episodios_assistidos).toBe(0);
      expect(result.total_animes_completos).toBe(0);
      expect(result.media_nota).toBeNull();
    });
  });

  describe('getUserTrackingsByNickname', () => {
    it('deve retornar trackings do usuário pelo nickname', async () => {
      UserRepository.findByNickname.mockResolvedValue({ id: userId, nickname: 'teste' });
      UserAnimeTrackingRepository.findAllByUser.mockResolvedValue([mockTracking]);
      AnimeRepository.findById.mockResolvedValue(mockAnime);

      const result = await TrackingService.getUserTrackingsByNickname('teste');

      expect(result).toHaveLength(1);
      expect(result[0].tracking.id).toBe(mockTracking.id);
      expect(result[0].anime.mal_id).toBe(animeMalId);
    });

    it('deve lançar erro se usuário não existir', async () => {
      UserRepository.findByNickname.mockResolvedValue(null);

      await expect(
        TrackingService.getUserTrackingsByNickname('inexistente')
      ).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('getTrackingStatsByNickname', () => {
    it('deve retornar stats pelo nickname', async () => {
      UserRepository.findByNickname.mockResolvedValue({ id: userId, nickname: 'teste' });
      UserAnimeTrackingRepository.findAllByUser.mockResolvedValue([]);

      const result = await TrackingService.getTrackingStatsByNickname('teste');

      expect(result.total_animes).toBe(0);
    });
  });

  describe('removeTracking', () => {
    it('deve remover tracking existente', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.delete = jest.fn().mockResolvedValue(1);

      const result = await TrackingService.removeTracking(userId, animeMalId);

      expect(result.message).toBe('Tracking removido');
      expect(UserAnimeTrackingRepository.delete).toHaveBeenCalledWith({
        user_id: userId,
        anime_id: animeId,
      });
    });

    it('deve lançar erro se anime não existir', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(null);

      await expect(
        TrackingService.removeTracking(userId, animeMalId)
      ).rejects.toThrow('Anime não encontrado');
    });
  });
});
