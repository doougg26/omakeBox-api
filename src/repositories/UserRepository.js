const BaseRepository = require('./BaseRepository');
const { User } = require('../models');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.findOne({ where: { email } });
  }

  async findByNickname(nickname) {
    return this.findOne({ where: { nickname } });
  }

  async findByNicknameOrEmail(identifier) {
    return this.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { nickname: identifier },
          { email: identifier },
        ],
      },
    });
  }

  async updateProfile(userId, data) {
    return this.update({ id: userId }, data);
  }
}

module.exports = new UserRepository();
