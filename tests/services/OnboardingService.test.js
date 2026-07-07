const OnboardingService = require('../../src/services/OnboardingService');
const UserRepository = require('../../src/repositories/UserRepository');
const AnimeRepository = require('../../src/repositories/AnimeRepository');
const CharacterRepository = require('../../src/repositories/CharacterRepository');
const jikanClient = require('../../src/integrations/JikanClient');
const { Anime, User, Character } = require('../../src/models');

jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/repositories/AnimeRepository');
jest.mock('../../src/repositories/CharacterRepository');
jest.mock('../../src/integrations/JikanClient');

describe('OnboardingService', () => {
  const malId = 21;
  const animeId = 'anime-uuid-1';
  const userId = 'user-uuid-1';

  const mockAnimeData = {
    mal_id: 21,
    title: 'One Piece',
    titles: [{ title: 'One Piece' }],
    synopsis: 'Piratas...',
    images: { jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/123.jpg', image_url: 'https://cdn.myanimelist.net/images/anime/123t.jpg' } },
    episodes: 100,
    status: 'Currently Airing',
    season: 'summer',
    year: 1999,
    genres: [{ mal_id: 1, name: 'Ação' }, { mal_id: 2, name: 'Aventura' }],
    studios: [{ mal_id: 1, name: 'Toei Animation' }],
  };

  const mockAnime = {
    id: animeId,
    mal_id: malId,
    titulo: 'One Piece',
    capa_url: 'https://cdn.myanimelist.net/images/anime/123.jpg',
    sinopse: 'Piratas...',
    status: 'em_exibicao',
    generos: [{ id: 1, nome: 'Ação' }],
    estudios: [{ id: 1, nome: 'Toei Animation' }],
    total_episodios: 100,
    temporada: 'summer',
    ano: 1999,
    ultima_sincronizacao: new Date(),
  };

  const mockCharacterData = [
    {
      character: {
        mal_id: 1,
        name: 'Monkey D. Luffy',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/1.jpg' } },
      },
    },
    {
      character: {
        mal_id: 2,
        name: 'Roronoa Zoro',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/2.jpg' } },
      },
    },
  ];

  const mockCharacter = {
    id: 'char-uuid-1',
    mal_id: 1,
    nome: 'Monkey D. Luffy',
    imagem_url: 'https://cdn.myanimelist.net/images/characters/1.jpg',
    anime_id: animeId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncAnimeFromJikan', () => {
    it('deve retornar anime existente sem chamar Jikan', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);

      const result = await OnboardingService.syncAnimeFromJikan(malId);

      expect(result.id).toBe(animeId);
      expect(jikanClient.getAnimeById).not.toHaveBeenCalled();
    });

    it('deve sincronizar anime da Jikan e criar no cache local', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(null);
      jikanClient.getAnimeById.mockResolvedValue({ data: mockAnimeData });
      AnimeRepository.create.mockResolvedValue(mockAnime);

      const result = await OnboardingService.syncAnimeFromJikan(malId);

      expect(jikanClient.getAnimeById).toHaveBeenCalledWith(malId);
      expect(AnimeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mal_id: 21,
          titulo: 'One Piece',
          total_episodios: 100,
          temporada: 'summer',
          ano: 1999,
        })
      );
      expect(result.titulo).toBe('One Piece');
    });

    it('deve lançar erro se anime não for encontrado na Jikan', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(null);
      jikanClient.getAnimeById.mockResolvedValue({ data: null });

      await expect(
        OnboardingService.syncAnimeFromJikan(999999)
      ).rejects.toThrow('Anime não encontrado na Jikan API');
    });

    it('deve normalizar status da Jikan corretamente', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(null);
      jikanClient.getAnimeById.mockResolvedValue({
        data: { ...mockAnimeData, status: 'Finished Airing' },
      });
      AnimeRepository.create.mockResolvedValue({ ...mockAnime, status: 'finalizado' });

      const result = await OnboardingService.syncAnimeFromJikan(malId);

      expect(AnimeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'finalizado' })
      );
    });
  });

  describe('syncCharactersFromJikan', () => {
    it('deve retornar personagens existentes sem chamar Jikan', async () => {
      CharacterRepository.findByAnimeId.mockResolvedValue([mockCharacter]);

      const result = await OnboardingService.syncCharactersFromJikan(animeId, malId);

      expect(result).toHaveLength(1);
      expect(jikanClient.getAnimeCharacters).not.toHaveBeenCalled();
    });

    it('deve sincronizar personagens da Jikan', async () => {
      CharacterRepository.findByAnimeId.mockResolvedValue([]);
      jikanClient.getAnimeCharacters.mockResolvedValue({ data: mockCharacterData });
      CharacterRepository.findOrCreateByMalId.mockResolvedValue([mockCharacter]);

      const result = await OnboardingService.syncCharactersFromJikan(animeId, malId);

      expect(jikanClient.getAnimeCharacters).toHaveBeenCalledWith(malId);
      expect(CharacterRepository.findOrCreateByMalId).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('deve limitar a 20 personagens', async () => {
      const manyCharacters = Array.from({ length: 30 }, (_, i) => ({
        character: {
          mal_id: i + 1,
          name: `Character ${i + 1}`,
          images: { jpg: { image_url: null } },
        },
      }));

      CharacterRepository.findByAnimeId.mockResolvedValue([]);
      jikanClient.getAnimeCharacters.mockResolvedValue({ data: manyCharacters });
      CharacterRepository.findOrCreateByMalId.mockResolvedValue([{ id: 'char-uuid' }]);

      await OnboardingService.syncCharactersFromJikan(animeId, malId);

      // Deve chamar findOrCreateByMalId no máximo 20 vezes
      expect(CharacterRepository.findOrCreateByMalId).toHaveBeenCalledTimes(20);
    });

    it('deve ignorar entradas sem character', async () => {
      CharacterRepository.findByAnimeId.mockResolvedValue([]);
      jikanClient.getAnimeCharacters.mockResolvedValue({
        data: [
          { character: null },
          { character: { mal_id: 1, name: 'Luffy', images: { jpg: { image_url: null } } } },
        ],
      });
      CharacterRepository.findOrCreateByMalId.mockResolvedValue([mockCharacter]);

      const result = await OnboardingService.syncCharactersFromJikan(animeId, malId);

      expect(CharacterRepository.findOrCreateByMalId).toHaveBeenCalledTimes(1);
    });
  });

  describe('setFavoriteAnime', () => {
    it('deve definir anime favorito e sincronizar personagens', async () => {
      AnimeRepository.findByMalId
        .mockResolvedValueOnce(null)   // syncAnimeFromJikan: não existe
        .mockResolvedValueOnce(mockAnime); // syncAnimeFromJikan: cria
      jikanClient.getAnimeById.mockResolvedValue({ data: mockAnimeData });
      AnimeRepository.create.mockResolvedValue(mockAnime);
      UserRepository.updateProfile.mockResolvedValue([1]);
      CharacterRepository.findByAnimeId.mockResolvedValue([]);
      jikanClient.getAnimeCharacters.mockResolvedValue({ data: mockCharacterData });
      CharacterRepository.findOrCreateByMalId.mockResolvedValue([mockCharacter]);
      UserRepository.findById.mockResolvedValue({
        id: userId,
        nickname: 'testuser',
        anime_favorito_id: animeId,
      });

      const result = await OnboardingService.setFavoriteAnime(userId, malId);

      expect(result.anime.mal_id).toBe(malId);
      expect(result.user.anime_favorito_id).toBe(animeId);
      expect(UserRepository.updateProfile).toHaveBeenCalledWith(userId, {
        anime_favorito_id: animeId,
      });
    });
  });
});
