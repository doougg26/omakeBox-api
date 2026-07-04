const BaseRepository = require('./BaseRepository');
const { Post, User, Anime, Comment } = require('../models');

class PostRepository extends BaseRepository {
  constructor() {
    super(Post);
  }

  async findAllWithDetails(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.findAll({
      include: [
        { model: User, attributes: ['id', 'nickname'] },
        { model: Anime, attributes: ['id', 'mal_id', 'titulo', 'capa_url'] },
      ],
      order: [['criado_em', 'DESC']],
      limit,
      offset,
    });
  }

  async findByIdWithDetails(id) {
    return this.findById(id, {
      include: [
        { model: User, attributes: ['id', 'nickname'] },
        { model: Anime, attributes: ['id', 'mal_id', 'titulo', 'capa_url'] },
        {
          model: Comment,
          include: [{ model: User, attributes: ['id', 'nickname'] }],
          order: [['criado_em', 'ASC']],
        },
      ],
    });
  }

  async findByUser(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.findAll({
      where: { user_id: userId },
      include: [
        { model: Anime, attributes: ['id', 'mal_id', 'titulo', 'capa_url'] },
      ],
      order: [['criado_em', 'DESC']],
      limit,
      offset,
    });
  }
}

module.exports = new PostRepository();
