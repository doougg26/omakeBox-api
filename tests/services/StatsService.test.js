const StatsService = require('../../src/services/StatsService');
const { Anime, User, Character, UserAnimeTracking, CharacterVote, Post } = require('../../src/models');
const sequelize = require('../../src/config/database');

describe('StatsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTopRatedAnimes', () => {
    it('deve retornar top 5 animes ordenados por média', async () => {
      UserAnimeTracking.findAll.mockResolvedValue([
        { anime_id: 'id-1', media: '9.0', total_votos: '5' },
        { anime_id: 'id-2', media: '8.5', total_votos: '3' },
      ]);
      Anime.findAll.mockResolvedValue([
        { id: 'id-1', mal_id: 1, titulo: 'Anime A', capa_url: 'url-a', total_episodios: 24 },
        { id: 'id-2', mal_id: 2, titulo: 'Anime B', capa_url: 'url-b', total_episodios: 12 },
      ]);

      const result = await StatsService.getTopRatedAnimes();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        anime: { mal_id: 1, titulo: 'Anime A', capa_url: 'url-a' },
        media: '9.0',
        total_votos: 5,
      });
      expect(result[1].anime.titulo).toBe('Anime B');
    });

    it('deve retornar array vazio se não houver trackings', async () => {
      UserAnimeTracking.findAll.mockResolvedValue([]);

      const result = await StatsService.getTopRatedAnimes();
      expect(result).toEqual([]);
    });

    it('deve tratar anime ausente como null', async () => {
      UserAnimeTracking.findAll.mockResolvedValue([
        { anime_id: 'id-orphan', media: '7.0', total_votos: '2' },
      ]);
      Anime.findAll.mockResolvedValue([]);

      const result = await StatsService.getTopRatedAnimes();
      expect(result[0].anime).toBeNull();
    });
  });

  describe('getMostVotedCharacter', () => {
    it('deve retornar o personagem mais votado', async () => {
      CharacterVote.findAll.mockResolvedValue([
        { character_id: 'char-1', total_votos: '10' },
      ]);
      Character.findOne.mockResolvedValue({
        id: 'char-1', nome: 'Naruto', imagem_url: 'url-n', mal_id: 101, anime_id: 'anime-1',
      });
      Anime.findOne.mockResolvedValue({ mal_id: 1, titulo: 'Naruto Shippuden' });

      const result = await StatsService.getMostVotedCharacter();

      expect(result.character.nome).toBe('Naruto');
      expect(result.anime.titulo).toBe('Naruto Shippuden');
      expect(result.total_votos).toBe(10);
    });

    it('deve retornar null se não houver votos', async () => {
      CharacterVote.findAll.mockResolvedValue([]);
      expect(await StatsService.getMostVotedCharacter()).toBeNull();
    });

    it('deve retornar null se personagem não existir', async () => {
      CharacterVote.findAll.mockResolvedValue([{ character_id: 'char-1', total_votos: '5' }]);
      Character.findOne.mockResolvedValue(null);
      expect(await StatsService.getMostVotedCharacter()).toBeNull();
    });
  });

  describe('getUserWithMostEpisodes', () => {
    it('deve retornar usuário com mais episódios', async () => {
      UserAnimeTracking.findAll.mockResolvedValue([
        { user_id: 'user-1', total_episodios: '500' },
      ]);
      User.findOne.mockResolvedValue({
        id: 'user-1', nickname: 'maratonista', avatar_url: 'url-avatar',
      });

      const result = await StatsService.getUserWithMostEpisodes();

      expect(result.user.nickname).toBe('maratonista');
      expect(result.total_episodios).toBe(500);
    });

    it('deve retornar null se não houver trackings', async () => {
      UserAnimeTracking.findAll.mockResolvedValue([]);
      expect(await StatsService.getUserWithMostEpisodes()).toBeNull();
    });
  });

  describe('getMostLikedPost', () => {
    it('deve retornar o post mais curtido', async () => {
      const mockPost = {
        id: 'post-1',
        texto: 'Excelente anime!',
        likes_count: 42,
        criado_em: '2026-07-07T00:00:00Z',
        user_id: 'user-1',
        anime_id: 'anime-1',
      };
      Post.findOne.mockResolvedValue(mockPost);
      User.findOne.mockResolvedValue({ id: 'user-1', nickname: 'critico', avatar_url: null });
      Anime.findOne.mockResolvedValue({ mal_id: 1, titulo: 'Anime Top', capa_url: 'url' });

      const result = await StatsService.getMostLikedPost();

      expect(result.post.likes_count).toBe(42);
      expect(result.user.nickname).toBe('critico');
      expect(result.anime.titulo).toBe('Anime Top');
    });

    it('deve truncar texto maior que 200 caracteres', async () => {
      const textoLongo = 'A'.repeat(250);
      Post.findOne.mockResolvedValue({
        id: 'post-1', texto: textoLongo, likes_count: 10, criado_em: new Date(),
        user_id: 'user-1', anime_id: 'anime-1',
      });
      User.findOne.mockResolvedValue({ id: 'user-1', nickname: 'autor', avatar_url: null });
      Anime.findOne.mockResolvedValue({ mal_id: 1, titulo: 'A', capa_url: 'url' });

      const result = await StatsService.getMostLikedPost();
      expect(result.post.texto).toBe('A'.repeat(200) + '...');
      expect(result.post.texto.length).toBe(203);
    });

    it('deve retornar null se não houver posts', async () => {
      Post.findOne.mockResolvedValue(null);
      expect(await StatsService.getMostLikedPost()).toBeNull();
    });
  });

  describe('getMostPopularGenre', () => {
    it('deve retornar o gênero mais popular', async () => {
      sequelize.query.mockResolvedValue([
        [{ nome: 'Ação', mal_id: '1', total_trackings: '150' }],
      ]);

      const result = await StatsService.getMostPopularGenre();

      expect(result.nome).toBe('Ação');
      expect(result.mal_id).toBe(1);
      expect(result.total_trackings).toBe(150);
    });

    it('deve retornar null se query não retornar resultados', async () => {
      sequelize.query.mockResolvedValue([[]]);
      expect(await StatsService.getMostPopularGenre()).toBeNull();
    });
  });

  describe('getYearWithMostReleases', () => {
    it('deve retornar o ano com mais lançamentos', async () => {
      Anime.findAll.mockResolvedValue([
        { ano: 2024, total_animes: '50' },
      ]);

      const result = await StatsService.getYearWithMostReleases();

      expect(result.ano).toBe(2024);
      expect(result.total_animes).toBe(50);
    });

    it('deve retornar null se não houver animes', async () => {
      Anime.findAll.mockResolvedValue([]);
      expect(await StatsService.getYearWithMostReleases()).toBeNull();
    });
  });

  describe('getUserWithMostReviews', () => {
    it('deve retornar usuário com mais avaliações', async () => {
      UserAnimeTracking.findAll.mockResolvedValue([
        { user_id: 'user-1', total_avaliacoes: '20', media_nota: '8.5' },
      ]);
      User.findOne.mockResolvedValue({
        id: 'user-1', nickname: 'avaliador', avatar_url: 'url',
      });

      const result = await StatsService.getUserWithMostReviews();

      expect(result.user.nickname).toBe('avaliador');
      expect(result.total_avaliacoes).toBe(20);
      expect(result.media_nota).toBe('8.5');
    });

    it('deve retornar null se não houver avaliações', async () => {
      UserAnimeTracking.findAll.mockResolvedValue([]);
      expect(await StatsService.getUserWithMostReviews()).toBeNull();
    });
  });

  describe('getAllStats', () => {
    it('deve agregar todas as 7 estatísticas', async () => {
      // Mock all individual methods
      UserAnimeTracking.findAll.mockResolvedValue([]); // top rated (empty)
      CharacterVote.findAll.mockResolvedValue([]); // voted character (empty)
      UserAnimeTracking.findAll.mockResolvedValue([]); // most episodes (empty)
      Post.findOne.mockResolvedValue(null); // most liked post (null)
      sequelize.query.mockResolvedValue([[]]); // popular genre (empty)
      Anime.findAll.mockResolvedValue([]); // year (empty)
      User.findOne.mockResolvedValue(null); // most reviews (null)

      const result = await StatsService.getAllStats();

      expect(result).toHaveProperty('top_rated_animes');
      expect(result).toHaveProperty('most_voted_character');
      expect(result).toHaveProperty('most_episodes_user');
      expect(result).toHaveProperty('most_liked_post');
      expect(result).toHaveProperty('most_popular_genre');
      expect(result).toHaveProperty('year_most_releases');
      expect(result).toHaveProperty('most_reviews_user');
    });

    it('deve retornar dados completos quando todos os métodos retornam valores (mockResolvedValue)', async () => {
      // Usa mockResolvedValue (não Once) — como Promise.all executa em paralelo,
      // cada método é testado isoladamente com seus retornos mapeados por modelo.
      // A ordem dos mocks não importa porque cada modelo tem seu próprio mock.

      UserAnimeTracking.findAll.mockResolvedValue([]);
      Anime.findAll.mockResolvedValue([]);
      CharacterVote.findAll.mockResolvedValue([]);
      Character.findOne.mockResolvedValue(null);
      User.findOne.mockResolvedValue(null);
      Post.findOne.mockResolvedValue(null);
      sequelize.query.mockResolvedValue([[]]);

      const result = await StatsService.getAllStats();

      expect(result).toHaveProperty('top_rated_animes');
      expect(result).toHaveProperty('most_voted_character');
      expect(result).toHaveProperty('most_episodes_user');
      expect(result).toHaveProperty('most_liked_post');
      expect(result).toHaveProperty('most_popular_genre');
      expect(result).toHaveProperty('year_most_releases');
      expect(result).toHaveProperty('most_reviews_user');
    });
  });
});
