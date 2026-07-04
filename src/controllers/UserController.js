const userService = require('../services/UserService');

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
      const user = await userService.updateProfile(req.userId, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
