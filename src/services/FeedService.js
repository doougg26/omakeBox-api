const PostRepository = require('../repositories/PostRepository');
const CommentRepository = require('../repositories/CommentRepository');
const AnimeRepository = require('../repositories/AnimeRepository');
const UserRepository = require('../repositories/UserRepository');
const NotificationService = require('./NotificationService');
const OnboardingService = require('./OnboardingService');
const AppError = require('../utils/AppError');

class FeedService {
  /**
   * Cria um novo post vinculado a um anime
   */
  async createPost(userId, { animeMalId, texto, marcado_como_spoiler }) {
    // Garante que o anime existe no cache local
    let anime = await AnimeRepository.findByMalId(animeMalId);
    if (!anime) {
      anime = await OnboardingService.syncAnimeFromJikan(animeMalId);
    }

    const post = await PostRepository.create({
      user_id: userId,
      anime_id: anime.id,
      texto,
      marcado_como_spoiler: marcado_como_spoiler || false,
    });

    return this.getPostById(post.id);
  }

  /**
   * Retorna o feed paginado com metadados de paginação
   */
  async getFeed(page = 1, limit = 20) {
    const posts = await PostRepository.findAllWithDetails(page, limit);

    // Para cada post, conta comentários e serializa
    const result = [];
    for (const post of posts) {
      const commentCount = await CommentRepository.countByPost(post.id);
      result.push(this._serializePost(post, commentCount));
    }

    // Estima se há mais páginas
    const hasMore = posts.length >= limit;

    return {
      posts: result,
      pagination: {
        page,
        limit,
        has_more: hasMore,
      },
    };
  }

  /**
   * Retorna um post específico com comentários
   */
  async getPostById(postId) {
    const post = await PostRepository.findByIdWithDetails(postId);
    if (!post) throw new AppError('Post não encontrado', 404);

    const commentCount = post.Comments?.length || 0;
    return this._serializePost(post, commentCount);
  }

  /**
   * Curtir um post (incrementa contador)
   */
  async likePost(userId, postId) {
    const post = await PostRepository.findById(postId);
    if (!post) throw new AppError('Post não encontrado', 404);

    // Sistema simplificado: incrementa likes_count (mecanismo binário)
    // Em produção, usar uma tabela de likes para controle de descurtida
    post.likes_count += 1;
    await post.save({ fields: ['likes_count'] });

    // Notifica o dono do post (se não for o próprio)
    if (post.user_id !== userId) {
      await NotificationService.createNotification(post.user_id, {
        tipo: 'curtida',
        referencia_tipo: 'post',
        referencia_id: post.id,
      }).catch(() => {});
    }

    return { likes_count: post.likes_count };
  }

  /**
   * Adiciona um comentário a um post
   */
  async addComment(userId, postId, texto) {
    const post = await PostRepository.findById(postId);
    if (!post) throw new AppError('Post não encontrado', 404);

    await CommentRepository.create({
      post_id: postId,
      user_id: userId,
      texto,
    });

    // Notifica o dono do post (se não for o próprio)
    if (post.user_id !== userId) {
      await NotificationService.createNotification(post.user_id, {
        tipo: 'comentario',
        referencia_tipo: 'post',
        referencia_id: post.id,
      }).catch(() => {});
    }

    return this.getPostById(postId);
  }

  /**
   * Remove um post (apenas o autor pode remover)
   */
  async deletePost(userId, postId) {
    const post = await PostRepository.findById(postId);
    if (!post) throw new AppError('Post não encontrado', 404);
    if (post.user_id !== userId) throw new AppError('Você não pode remover este post', 403);

    await PostRepository.delete({ id: postId });
    return { message: 'Post removido' };
  }

  /**
   * Lista posts de um usuário específico
   */
  async getUserPosts(userId, page = 1, limit = 20) {
    const posts = await PostRepository.findByUser(userId, page, limit);
    const result = [];
    for (const post of posts) {
      const commentCount = await CommentRepository.countByPost(post.id);
      result.push(this._serializePost(post, commentCount));
    }
    return result;
  }

  /**
   * Lista posts públicos de um usuário pelo nickname
   */
  async getUserPostsByNickname(nickname, page = 1, limit = 20) {
    const user = await UserRepository.findByNickname(nickname);
    if (!user) throw new AppError('Usuário não encontrado', 404);
    return this.getUserPosts(user.id, page, limit);
  }

  _serializeUser(user) {
    if (!user) return null;
    return { id: user.id, nickname: user.nickname, avatar: user.avatar_url ? { tipo: 'custom', imagem_url: user.avatar_url } : null };
  }

  _serializePost(post, commentCount = 0) {
    return {
      id: post.id,
      texto: post.texto,
      marcado_como_spoiler: post.marcado_como_spoiler,
      likes_count: post.likes_count,
      criado_em: post.criado_em,
      user: this._serializeUser(post.User),
      anime: post.Anime
        ? {
            id: post.Anime.id,
            mal_id: post.Anime.mal_id,
            titulo: post.Anime.titulo,
            capa_url: post.Anime.capa_url,
          }
        : null,
      comment_count: commentCount,
      comments: post.Comments
        ? post.Comments.map((c) => ({
            id: c.id,
            texto: c.texto,
            criado_em: c.criado_em,
            user: this._serializeUser(c.User),
          }))
        : [],
    };
  }
}

module.exports = new FeedService();
