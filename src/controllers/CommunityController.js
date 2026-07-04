const communityService = require('../services/CommunityService');

class CommunityController {
  async getAnimeDetails(req, res, next) {
    try {
      const { id: malId } = req.params;
      const anime = await communityService.getAnimeDetails(malId);

      const rating = await communityService.getAnimeRating(malId);

      res.json({
        ...anime.toJSON?.() || anime,
        rating,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCharacters(req, res, next) {
    try {
      const { id: malId } = req.params;
      const characters = await communityService.getCharacters(malId);
      res.json(characters);
    } catch (err) {
      next(err);
    }
  }

  async voteCharacter(req, res, next) {
    try {
      const { id: animeMalId, charId: characterMalId } = req.params;
      const result = await communityService.voteCharacter(
        req.userId,
        animeMalId,
        parseInt(characterMalId, 10)
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getCharacterRanking(req, res, next) {
    try {
      const { id: animeMalId } = req.params;
      const ranking = await communityService.getCharacterRanking(animeMalId);
      res.json(ranking);
    } catch (err) {
      next(err);
    }
  }

  async getUserVote(req, res, next) {
    try {
      const { id: animeMalId } = req.params;
      const vote = await communityService.getUserVote(req.userId, animeMalId);
      res.json(vote || { character: null });
    } catch (err) {
      next(err);
    }
  }

  async rateAnime(req, res, next) {
    try {
      const { id: animeMalId } = req.params;
      const { nota } = req.body;
      const result = await communityService.rateAnime(req.userId, animeMalId, nota);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAnimeRating(req, res, next) {
    try {
      const { id: animeMalId } = req.params;
      const rating = await communityService.getAnimeRating(animeMalId);
      res.json(rating);
    } catch (err) {
      next(err);
    }
  }

  async addReview(req, res, next) {
    try {
      const { id: animeMalId } = req.params;
      const { texto } = req.body;
      const result = await communityService.addReview(req.userId, animeMalId, texto);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getReviews(req, res, next) {
    try {
      const { id: animeMalId } = req.params;
      const userId = req.userId || null;
      const reviews = await communityService.getReviews(animeMalId, userId);
      res.json(reviews);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CommunityController();
