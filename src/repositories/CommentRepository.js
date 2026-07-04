const BaseRepository = require('./BaseRepository');
const { Comment, User } = require('../models');

class CommentRepository extends BaseRepository {
  constructor() {
    super(Comment);
  }

  async findByPost(postId) {
    return this.findAll({
      where: { post_id: postId },
      include: [
        { model: User, attributes: ['id', 'nickname'] },
      ],
      order: [['criado_em', 'ASC']],
    });
  }

  async countByPost(postId) {
    return this.model.count({ where: { post_id: postId } });
  }
}

module.exports = new CommentRepository();
