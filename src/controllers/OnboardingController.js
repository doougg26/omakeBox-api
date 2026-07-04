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

  async setAvatar(req, res, next) {
    try {
      const { characterMalId } = req.body;
      const result = await onboardingService.setAvatar(req.userId, characterMalId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAvatarOptions(req, res, next) {
    try {
      const options = await onboardingService.getAvatarOptions(req.userId);
      res.json(options);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OnboardingController();
