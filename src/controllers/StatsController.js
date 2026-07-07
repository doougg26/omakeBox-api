const statsService = require('../services/StatsService');

class StatsController {
  async getAllStats(req, res, next) {
    try {
      const stats = await statsService.getAllStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StatsController();
