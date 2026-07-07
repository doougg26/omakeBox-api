const CommunityService = require('../../src/services/CommunityService');
const AnimeRepository = require('../../src/repositories/AnimeRepository');
const CharacterRepository = require('../../src/repositories/CharacterRepository');
const CharacterVoteRepository = require('../../src/repositories/CharacterVoteRepository');
const UserAnimeTrackingRepository = require('../../src/repositories/UserAnimeTrackingRepository');
const OnboardingService = require('../../src/services/OnboardingService');
const jikanClient = require('../../src/integrations/JikanClient');
const { User, Anime, Character } = require('../../src/models');

jest.mock('../../src/repositories/AnimeRepository');
jest.mock('../../src/repositories/CharacterRepository');
jest.mock('../../src/repositories/CharacterVoteRepository');
jest.mock('../../src/repositories/UserAnimeTrackingRepository');
jest.mock('../../src/services/OnboardingService');
jest.mock('../../src/integrations/JikanClient');

describe('CommunityService', () => {
  const userId = 'user-uuid-1';
  const animeMalId = 21;
  const animeId = 'anime-uuid-1';
  const characterMalId = 1;
  const characterId = 'char-uuid-1';

  const mockAnime = {
    id: animeId,
    mal_id: animeMalId,
    titulo: 'One Piece',
    capa_url: 'url',
    sinopse: 'Piratas...',
    total_episodios: 100,
    status: 'finalizado',
    generos: [{ id: 1, nome: 'Ação' }],
    temporada: 'summer',
    ano: 1999,
    Characters: [],
    ultima_sincronizacao: new Date(),
  };

  const mockCharacter = {
    id: characterId,
    mal_id: characterMalId,
    nome: 'Monkey D. Luffy',
    imagem_url: 'url',
    anime_id: animeId,
  };

  const mockVote = {
    id: 'vote-uuid-1',
    user_id: userId,
    character_id: characterId,
    anime_id: animeId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnimeDetails', () => {
    it('deve retornar detalhes do anime do cache local', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);

      const result = await CommunityService.getAnimeDetails(animeMalId);

      expect(result.mal_id).toBe(animeMalId);
      expect(AnimeRepository.findByMalId).toHaveBeenCalledTimes(2);
    });

    it('deve sincronizar da Jikan se anime não existir', async () => {
      AnimeRepository.findByMalId
        .mockResolvedValueOnce(null)      // primeira chamada: não existe
        .mockResolvedValueOnce(mockAnime); // depois de sync
      OnboardingService.syncAnimeFromJikan.mockResolvedValue(mockAnime);

      const result = await CommunityService.getAnimeDetails(animeMalId);

      expect(OnboardingService.syncAnimeFromJikan).toHaveBeenCalledWith(animeMalId);
      expect(result.id).toBe(animeId);
    });

    it('deve tentar atualizar dados frescos da Jikan sem falhar', async () => {
      const freshData = {
        data: {
          synopsis: 'Sinopse atualizada',
          images: { jpg: { large_image_url: 'nova_capa.jpg' } },
          episodes: 100,
          season: 'summer',
          year: 1999,
          genres: [{ mal_id: 1, name: 'Ação' }],
          studios: [{ mal_id: 1, name: 'Toei' }],
          status: 'Currently Airing',
        },
      };
      AnimeRepository.findByMalId
        .mockResolvedValueOnce(mockAnime)   // primeira: existe
        .mockResolvedValueOnce(mockAnime);  // depois do update
      jikanClient.getAnimeById.mockResolvedValue(freshData);
      AnimeRepository.update.mockResolvedValue([1]);

      const result = await CommunityService.getAnimeDetails(animeMalId);

      expect(AnimeRepository.update).toHaveBeenCalled();
      expect(result.mal_id).toBe(animeMalId);
    });

    it('deve continuar com cache se Jikan falhar', async () => {
      AnimeRepository.findByMalId
        .mockResolvedValueOnce(mockAnime)
        .mockResolvedValueOnce(mockAnime);
      jikanClient.getAnimeById.mockRejectedValue(new Error('API down'));

      const result = await CommunityService.getAnimeDetails(animeMalId);

      expect(result.id).toBe(animeId);
    });
  });

  describe('voteCharacter', () => {
    it('deve votar em personagem com sucesso', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      CharacterRepository.findByMalId.mockResolvedValue(mockCharacter);
      CharacterVoteRepository.findByUserAndAnime.mockResolvedValue(null);
      CharacterVoteRepository.create.mockResolvedValue(mockVote);

      const result = await CommunityService.voteCharacter(userId, animeMalId, characterMalId);

      expect(result.character.nome).toBe('Monkey D. Luffy');
      expect(CharacterVoteRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        character_id: characterId,
        anime_id: animeId,
      });
    });

    it('deve sincronizar personagem da Jikan se não existir no cache', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      CharacterRepository.findByMalId.mockResolvedValue(null);
      jikanClient.getAnimeCharacters.mockResolvedValue({
        data: [
          {
            character: {
              mal_id: characterMalId,
              name: 'Monkey D. Luffy',
              images: { jpg: { image_url: 'url' } },
            },
          },
        ],
      });
      CharacterRepository.create.mockResolvedValue(mockCharacter);
      CharacterVoteRepository.findByUserAndAnime.mockResolvedValue(null);
      CharacterVoteRepository.create.mockResolvedValue(mockVote);

      const result = await CommunityService.voteCharacter(userId, animeMalId, characterMalId);

      expect(jikanClient.getAnimeCharacters).toHaveBeenCalledWith(animeMalId);
      expect(result.character.nome).toBe('Monkey D. Luffy');
    });

    it('deve lançar erro se personagem não for encontrado na Jikan', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      CharacterRepository.findByMalId.mockResolvedValue(null);
      jikanClient.getAnimeCharacters.mockResolvedValue({ data: [] });

      await expect(
        CommunityService.voteCharacter(userId, animeMalId, 999999)
      ).rejects.toThrow('Personagem não encontrado');
    });

    it('deve remover voto anterior se existir', async () => {
      const existingVote = {
        id: 'old-vote',
        user_id: userId,
        character_id: 'old-char',
        anime_id: animeId,
      };
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      CharacterRepository.findByMalId.mockResolvedValue(mockCharacter);
      CharacterVoteRepository.findByUserAndAnime.mockResolvedValue(existingVote);
      CharacterVoteRepository.delete.mockResolvedValue(1);
      CharacterVoteRepository.create.mockResolvedValue(mockVote);

      await CommunityService.voteCharacter(userId, animeMalId, characterMalId);

      expect(CharacterVoteRepository.delete).toHaveBeenCalledWith({ id: 'old-vote' });
    });

    it('deve lançar erro se já votou neste personagem', async () => {
      const existingVote = {
        id: 'existing-vote',
        character_id: characterId,
      };
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      CharacterRepository.findByMalId.mockResolvedValue(mockCharacter);
      CharacterVoteRepository.findByUserAndAnime.mockResolvedValue(existingVote);

      await expect(
        CommunityService.voteCharacter(userId, animeMalId, characterMalId)
      ).rejects.toThrow('Você já votou neste personagem');
    });
  });

  describe('getCharacterRanking', () => {
    it('deve retornar ranking de personagens', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      CharacterVoteRepository.getRankingByAnime.mockResolvedValue([
        {
          character_id: characterId,
          votos: '5',
          character: { nome: 'Monkey D. Luffy', imagem_url: 'url' },
        },
      ]);

      const result = await CommunityService.getCharacterRanking(animeMalId);

      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Monkey D. Luffy');
      expect(result[0].votos).toBe(5);
    });

    it('deve retornar ranking vazio', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      CharacterVoteRepository.getRankingByAnime.mockResolvedValue([]);

      const result = await CommunityService.getCharacterRanking(animeMalId);

      expect(result).toEqual([]);
    });

    it('deve lançar erro se anime não existir', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(null);

      await expect(
        CommunityService.getCharacterRanking(animeMalId)
      ).rejects.toThrow('Anime não encontrado');
    });
  });

  describe('getUserVote', () => {
    it('deve retornar voto do usuário', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      CharacterVoteRepository.getUserVote.mockResolvedValue(mockVote);

      const result = await CommunityService.getUserVote(userId, animeMalId);

      expect(result.id).toBe(mockVote.id);
    });

    it('deve retornar null se anime não existir', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(null);

      const result = await CommunityService.getUserVote(userId, animeMalId);

      expect(result).toBeNull();
    });
  });

  describe('rateAnime', () => {
    it('deve atribuir nota a anime existente (criar tracking)', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue(null);
      UserAnimeTrackingRepository.create.mockResolvedValue({});
      UserAnimeTrackingRepository.getAverageRating.mockResolvedValue({
        media: '7.5',
        total: 3,
      });

      const result = await CommunityService.rateAnime(userId, animeMalId, 8);

      expect(result.media).toBe('7.5');
      expect(result.total_votos).toBe(3);
      expect(UserAnimeTrackingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          anime_id: animeId,
          status: 'planejo_assistir',
          nota: 8,
        })
      );
    });

    it('deve atualizar nota de tracking existente', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue({
        id: 'tracking-uuid',
        nota: 5,
      });
      UserAnimeTrackingRepository.update.mockResolvedValue([1]);
      UserAnimeTrackingRepository.getAverageRating.mockResolvedValue({
        media: '8.0',
        total: 5,
      });

      const result = await CommunityService.rateAnime(userId, animeMalId, 9);

      expect(UserAnimeTrackingRepository.update).toHaveBeenCalled();
      expect(result.media).toBe('8.0');
    });

    it('deve lançar erro se nota for inválida', async () => {
      await expect(
        CommunityService.rateAnime(userId, animeMalId, -1)
      ).rejects.toThrow('Nota deve ser entre 0 e 10');

      await expect(
        CommunityService.rateAnime(userId, animeMalId, 11)
      ).rejects.toThrow('Nota deve ser entre 0 e 10');
    });
  });

  describe('getAnimeRating', () => {
    it('deve retornar média de notas', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.getAverageRating.mockResolvedValue({
        media: '7.5',
        total: 10,
      });

      const result = await CommunityService.getAnimeRating(animeMalId);

      expect(result.media).toBe('7.5');
      expect(result.total_votos).toBe(10);
    });

    it('deve retornar média nula se anime não existir', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(null);

      const result = await CommunityService.getAnimeRating(animeMalId);

      expect(result.media).toBeNull();
      expect(result.total_votos).toBe(0);
    });
  });

  describe('addReview', () => {
    it('deve adicionar impressão a tracking existente', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue({
        id: 'tracking-uuid',
      });
      UserAnimeTrackingRepository.update.mockResolvedValue([1]);

      const result = await CommunityService.addReview(userId, animeMalId, 'Muito bom!');

      expect(result.message).toBe('Impressão salva com sucesso');
      expect(UserAnimeTrackingRepository.update).toHaveBeenCalledWith(
        { user_id: userId, anime_id: animeId },
        { impressao_texto: 'Muito bom!', atualizado_em: expect.any(Date) }
      );
    });

    it('deve criar tracking novo se não existir', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue(null);
      UserAnimeTrackingRepository.create.mockResolvedValue({});

      await CommunityService.addReview(userId, animeMalId, 'Muito bom!');

      expect(UserAnimeTrackingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          anime_id: animeId,
          impressao_texto: 'Muito bom!',
        })
      );
    });

    it('deve lançar erro se texto for muito longo', async () => {
      await expect(
        CommunityService.addReview(userId, animeMalId, 'a'.repeat(501))
      ).rejects.toThrow('Texto da impressão deve ter no máximo 500 caracteres');
    });

    it('deve lançar erro se texto for vazio', async () => {
      await expect(
        CommunityService.addReview(userId, animeMalId, '')
      ).rejects.toThrow('Texto da impressão deve ter no máximo 500 caracteres');
    });
  });

  describe('getReviews', () => {
    it('deve retornar reviews bloqueadas para usuário não logado', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findAllByAnime.mockResolvedValue([
        {
          user_id: 'user-2',
          impressao_texto: 'Muito bom!',
          nota: 9,
          ultimo_episodio_assistido: 50,
          criado_em: new Date(),
        },
      ]);
      User.findAll.mockResolvedValue([
        { id: 'user-2', nickname: 'user2' },
      ]);

      const result = await CommunityService.getReviews(animeMalId, null);

      expect(result).toHaveLength(1);
      expect(result[0].texto).toBeNull();
      expect(result[0].bloqueado).toBe(true);
      expect(result[0].progresso_necessario).toContain('50/100');
    });

    it('deve mostrar texto completo para usuário que completou', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findAllByAnime.mockResolvedValue([
        {
          user_id: 'user-2',
          impressao_texto: 'Muito bom!',
          nota: 9,
          ultimo_episodio_assistido: 100,
          criado_em: new Date(),
        },
      ]);
      UserAnimeTrackingRepository.findByUserAndAnime.mockResolvedValue({
        status: 'completo',
        ultimo_episodio_assistido: 100,
      });
      User.findAll.mockResolvedValue([
        { id: 'user-2', nickname: 'user2' },
      ]);

      const result = await CommunityService.getReviews(animeMalId, userId);

      expect(result[0].texto).toBe('Muito bom!');
      expect(result[0].bloqueado).toBe(false);
    });

    it('deve retornar lista vazia se anime não existir', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(null);

      const result = await CommunityService.getReviews(animeMalId);

      expect(result).toEqual([]);
    });

    it('deve ignorar trackings sem impressao_texto', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      UserAnimeTrackingRepository.findAllByAnime.mockResolvedValue([
        { user_id: 'user-2', impressao_texto: null, nota: null, ultimo_episodio_assistido: 0 },
        { user_id: 'user-3', impressao_texto: 'Bom anime!', nota: 8, ultimo_episodio_assistido: 100 },
      ]);
      User.findAll.mockResolvedValue([
        { id: 'user-3', nickname: 'user3' },
      ]);

      const result = await CommunityService.getReviews(animeMalId);

      expect(result).toHaveLength(1);
    });
  });

  describe('getCharacters', () => {
    it('deve retornar personagens cacheados', async () => {
      AnimeRepository.findByMalId.mockResolvedValue({
        ...mockAnime,
        Characters: [mockCharacter],
      });

      const result = await CommunityService.getCharacters(animeMalId);

      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Monkey D. Luffy');
    });

    it('deve sincronizar personagens da Jikan se cache vazio', async () => {
      AnimeRepository.findByMalId
        .mockResolvedValueOnce({ ...mockAnime, Characters: [] })   // sem personagens
        .mockResolvedValueOnce({ ...mockAnime, Characters: [mockCharacter] }); // depois de sync
      OnboardingService.syncCharactersFromJikan.mockResolvedValue([mockCharacter]);

      const result = await CommunityService.getCharacters(animeMalId);

      expect(OnboardingService.syncCharactersFromJikan).toHaveBeenCalledWith(animeId, animeMalId);
      expect(result).toHaveLength(1);
    });
  });
});
