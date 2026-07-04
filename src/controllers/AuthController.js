const authService = require('../services/AuthService');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.validatedBody);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { identifier, senha } = req.validatedBody;
      const result = await authService.login(identifier, senha);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.validatedBody;
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
