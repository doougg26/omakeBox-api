const BaseRepository = require('./BaseRepository');
const { Comment, User } = require('../models');

const USER_WITH_AVATAR = {
  model: User,
  attributes: ['id', 'nickname', 'avatar_url'],
};

class CommentRepository extends BaseRepository {
  constructor() {
    super(Comment);
  }

  async findByPost(postId) {
    return this.findAll({
      where: { post_id: postId },
      include: [USER_WITH_AVATAR],
      order: [['criado_em', 'ASC']],
    });
  }

  async countByPost(postId) {
    return this.model.count({ where: { post_id: postId } });
  }
}

module.exports = new CommentRepository();
