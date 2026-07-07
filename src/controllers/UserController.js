const userService = require('../services/UserService');
const AppError = require('../utils/AppError');

class UserController {
  async getProfile(req, res, next) {
    try {
      const { nickname } = req.params;
      const profile = await userService.getProfile(nickname);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await userService.getMe(req.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req, res, next) {
    try {
      const { nickname, bio, links_sociais } = req.body;

      if (nickname !== undefined && typeof nickname !== 'string') {
        throw new AppError('Nickname inválido', 400);
      }
      if (bio !== undefined && typeof bio !== 'string') {
        throw new AppError('Bio inválida', 400);
      }
      if (links_sociais !== undefined && !Array.isArray(links_sociais)) {
        throw new AppError('Links sociais inválidos', 400);
      }

      // Monta payload apenas com campos enviados (evita undefined sobrescrever dados)
      const updateData = {};
      if (nickname !== undefined) updateData.nickname = nickname;
      if (bio !== undefined) updateData.bio = bio;
      if (links_sociais !== undefined) updateData.links_sociais = links_sociais;

      const user = await userService.updateProfile(req.userId, updateData);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
