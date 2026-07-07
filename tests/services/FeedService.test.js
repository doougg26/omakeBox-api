const FeedService = require('../../src/services/FeedService');
const PostRepository = require('../../src/repositories/PostRepository');
const CommentRepository = require('../../src/repositories/CommentRepository');
const AnimeRepository = require('../../src/repositories/AnimeRepository');
const UserRepository = require('../../src/repositories/UserRepository');
const NotificationService = require('../../src/services/NotificationService');
const OnboardingService = require('../../src/services/OnboardingService');

jest.mock('../../src/repositories/PostRepository');
jest.mock('../../src/repositories/CommentRepository');
jest.mock('../../src/repositories/AnimeRepository');
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/services/NotificationService');
jest.mock('../../src/services/OnboardingService');

describe('FeedService', () => {
  const userId = 'user-uuid-1';
  const postId = 'post-uuid-1';
  const animeMalId = 21;
  const animeId = 'anime-uuid-1';

  const mockAnime = { id: animeId, mal_id: animeMalId, titulo: 'One Piece', capa_url: 'url' };
  const mockUser = { id: userId, nickname: 'testuser', avatar_url: null };

  const mockPost = {
    id: postId,
    texto: 'Great anime!',
    marcado_como_spoiler: false,
    likes_count: 5,
    criado_em: new Date('2026-07-01'),
    user_id: userId,
    anime_id: animeId,
    User: mockUser,
    Anime: mockAnime,
    Comments: [],
    save: jest.fn().mockResolvedValue({}),
    toJSON: undefined,
  };

  const mockComments = [
    {
      id: 'comment-uuid-1',
      texto: 'Concordo!',
      criado_em: new Date(),
      user_id: 'other-user',
      User: { id: 'other-user', nickname: 'other', avatar_url: null },
    },
  ];

  const mockPostWithComments = {
    ...mockPost,
    Comments: mockComments,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('deve criar post com anime existente', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      PostRepository.create.mockResolvedValue(mockPost);
      PostRepository.findByIdWithDetails.mockResolvedValue(mockPost);
      CommentRepository.countByPost.mockResolvedValue(0);

      const result = await FeedService.createPost(userId, {
        animeMalId,
        texto: 'Great anime!',
        marcado_como_spoiler: false,
      });

      expect(result.texto).toBe('Great anime!');
      expect(PostRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        anime_id: animeId,
        texto: 'Great anime!',
        marcado_como_spoiler: false,
      });
    });

    it('deve sincronizar anime da Jikan se não existir localmente', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(null);
      OnboardingService.syncAnimeFromJikan.mockResolvedValue(mockAnime);
      PostRepository.create.mockResolvedValue(mockPost);
      PostRepository.findByIdWithDetails.mockResolvedValue(mockPost);
      CommentRepository.countByPost.mockResolvedValue(0);

      await FeedService.createPost(userId, {
        animeMalId,
        texto: 'Great anime!',
      });

      expect(OnboardingService.syncAnimeFromJikan).toHaveBeenCalledWith(animeMalId);
    });

    it('deve criar post com spoiler marcado como true', async () => {
      AnimeRepository.findByMalId.mockResolvedValue(mockAnime);
      PostRepository.create.mockResolvedValue({ ...mockPost, marcado_como_spoiler: true });
      PostRepository.findByIdWithDetails.mockResolvedValue({ ...mockPost, marcado_como_spoiler: true });
      CommentRepository.countByPost.mockResolvedValue(0);

      const result = await FeedService.createPost(userId, {
        animeMalId,
        texto: 'Plot twist!',
        marcado_como_spoiler: true,
      });

      expect(PostRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ marcado_como_spoiler: true })
      );
    });
  });

  describe('getFeed', () => {
    it('deve retornar feed paginado com contagem de comentários', async () => {
      const posts = [mockPost];
      PostRepository.findAllWithDetails.mockResolvedValue(posts);
      CommentRepository.countByPost.mockResolvedValue(0);

      const result = await FeedService.getFeed(1, 20);

      expect(result.posts).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.has_more).toBe(false);
      expect(result.posts[0].comment_count).toBe(0);
    });

    it('deve marcar has_more como true se resultados >= limit', async () => {
      const manyPosts = Array.from({ length: 20 }, (_, i) => ({
        ...mockPost,
        id: `post-${i}`,
      }));
      PostRepository.findAllWithDetails.mockResolvedValue(manyPosts);
      CommentRepository.countByPost.mockResolvedValue(2);

      const result = await FeedService.getFeed(1, 20);

      expect(result.pagination.has_more).toBe(true);
    });

    it('deve serializar post com dados do usuário e anime', async () => {
      PostRepository.findAllWithDetails.mockResolvedValue([mockPost]);
      CommentRepository.countByPost.mockResolvedValue(3);

      const result = await FeedService.getFeed(1, 20);

      const post = result.posts[0];
      expect(post.user.nickname).toBe('testuser');
      expect(post.anime.titulo).toBe('One Piece');
      expect(post.comment_count).toBe(3);
    });
  });

  describe('getPostById', () => {
    it('deve retornar post com comentários', async () => {
      PostRepository.findByIdWithDetails.mockResolvedValue(mockPostWithComments);
      CommentRepository.countByPost.mockResolvedValue(1);

      const result = await FeedService.getPostById(postId);

      expect(result.id).toBe(postId);
      expect(result.comments).toHaveLength(1);
      expect(result.comment_count).toBe(1);
    });

    it('deve lançar erro se post não existir', async () => {
      PostRepository.findByIdWithDetails.mockResolvedValue(null);

      await expect(
        FeedService.getPostById('post-inexistente')
      ).rejects.toThrow('Post não encontrado');
    });
  });

  describe('likePost', () => {
    it('deve incrementar likes_count', async () => {
      PostRepository.findById.mockResolvedValue({ ...mockPost, likes_count: 5 });
      NotificationService.createNotification.mockResolvedValue({});

      const result = await FeedService.likePost('other-user', postId);

      expect(result.likes_count).toBe(6);
      expect(mockPost.save).toHaveBeenCalledWith({ fields: ['likes_count'] });
    });

    it('deve notificar dono do post', async () => {
      PostRepository.findById.mockResolvedValue(mockPost);
      NotificationService.createNotification.mockResolvedValue({});

      await FeedService.likePost('other-user', postId);

      expect(NotificationService.createNotification).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          tipo: 'curtida',
          referencia_tipo: 'post',
        })
      );
    });

    it('não deve notificar se o próprio usuário curtir', async () => {
      PostRepository.findById.mockResolvedValue(mockPost);

      await FeedService.likePost(userId, postId);

      expect(NotificationService.createNotification).not.toHaveBeenCalled();
    });

    it('deve lançar erro se post não existir', async () => {
      PostRepository.findById.mockResolvedValue(null);

      await expect(
        FeedService.likePost(userId, 'post-inexistente')
      ).rejects.toThrow('Post não encontrado');
    });
  });

  describe('addComment', () => {
    it('deve adicionar comentário e retornar post atualizado', async () => {
      PostRepository.findById.mockResolvedValue(mockPost);
      CommentRepository.create.mockResolvedValue({ id: 'comment-uuid-1' });
      PostRepository.findByIdWithDetails.mockResolvedValue(mockPostWithComments);
      CommentRepository.countByPost.mockResolvedValue(1);
      NotificationService.createNotification.mockResolvedValue({});

      const result = await FeedService.addComment(userId, postId, 'Concordo!');

      expect(CommentRepository.create).toHaveBeenCalledWith({
        post_id: postId,
        user_id: userId,
        texto: 'Concordo!',
      });
      expect(result.comments).toBeDefined();
    });

    it('deve notificar dono do post sobre comentário', async () => {
      PostRepository.findById.mockResolvedValue(mockPost);
      CommentRepository.create.mockResolvedValue({});
      PostRepository.findByIdWithDetails.mockResolvedValue(mockPost);
      CommentRepository.countByPost.mockResolvedValue(0);
      NotificationService.createNotification.mockResolvedValue({});

      await FeedService.addComment('other-user', postId, 'Comentário!');

      expect(NotificationService.createNotification).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ tipo: 'comentario' })
      );
    });

    it('deve lançar erro se post não existir', async () => {
      PostRepository.findById.mockResolvedValue(null);

      await expect(
        FeedService.addComment(userId, 'post-inexistente', 'Texto')
      ).rejects.toThrow('Post não encontrado');
    });
  });

  describe('deletePost', () => {
    it('deve remover post do autor', async () => {
      PostRepository.findById.mockResolvedValue(mockPost);
      PostRepository.delete.mockResolvedValue(1);

      const result = await FeedService.deletePost(userId, postId);

      expect(result.message).toBe('Post removido');
      expect(PostRepository.delete).toHaveBeenCalledWith({ id: postId });
    });

    it('deve lançar erro se não for o autor', async () => {
      PostRepository.findById.mockResolvedValue(mockPost);

      await expect(
        FeedService.deletePost('outro-usuario', postId)
      ).rejects.toThrow('Você não pode remover este post');
    });

    it('deve lançar erro se post não existir', async () => {
      PostRepository.findById.mockResolvedValue(null);

      await expect(
        FeedService.deletePost(userId, 'post-inexistente')
      ).rejects.toThrow('Post não encontrado');
    });
  });

  describe('getUserPosts', () => {
    it('deve listar posts do usuário', async () => {
      PostRepository.findByUser.mockResolvedValue([mockPost]);
      CommentRepository.countByPost.mockResolvedValue(0);

      const result = await FeedService.getUserPosts(userId);

      expect(result).toHaveLength(1);
      expect(result[0].texto).toBe('Great anime!');
      expect(PostRepository.findByUser).toHaveBeenCalledWith(userId, 1, 20);
    });

    it('deve retornar lista vazia', async () => {
      PostRepository.findByUser.mockResolvedValue([]);

      const result = await FeedService.getUserPosts(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserPostsByNickname', () => {
    it('deve listar posts pelo nickname', async () => {
      UserRepository.findByNickname.mockResolvedValue({ id: userId });
      PostRepository.findByUser.mockResolvedValue([mockPost]);
      CommentRepository.countByPost.mockResolvedValue(0);

      const result = await FeedService.getUserPostsByNickname('testuser');

      expect(result).toHaveLength(1);
    });

    it('deve lançar erro se usuário não existir', async () => {
      UserRepository.findByNickname.mockResolvedValue(null);

      await expect(
        FeedService.getUserPostsByNickname('inexistente')
      ).rejects.toThrow('Usuário não encontrado');
    });
  });
});
