const onboardingService = require('../services/OnboardingService');

class OnboardingController {
  async setFavoriteAnime(req, res, next) {
    try {
      const { malId } = req.body;
      const result = await onboardingService.setFavoriteAnime(req.userId, malId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

}

module.exports = new OnboardingController();
