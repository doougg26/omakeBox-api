const trackingService = require('../services/TrackingService');

class TrackingController {
  async getUserTrackingsByNickname(req, res, next) {
    try {
      const { nickname } = req.params;
      const trackings = await trackingService.getUserTrackingsByNickname(nickname);
      res.json(trackings);
    } catch (err) {
      next(err);
    }
  }

  async getStatsByNickname(req, res, next) {
    try {
      const { nickname } = req.params;
      const stats = await trackingService.getTrackingStatsByNickname(nickname);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  async getMyTrackings(req, res, next) {
    try {
      const trackings = await trackingService.getUserTrackings(req.userId);
      res.json(trackings);
    } catch (err) {
      next(err);
    }
  }

  async getTrackingByAnime(req, res, next) {
    try {
      const { animeId } = req.params;
      const tracking = await trackingService.getTracking(req.userId, animeId);
      res.json(tracking || null);
    } catch (err) {
      next(err);
    }
  }

  async upsertTracking(req, res, next) {
    try {
      const { animeId } = req.params;
      const result = await trackingService.upsertTracking(
        req.userId,
        animeId,
        req.body
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async watchEpisode(req, res, next) {
    try {
      const { animeId } = req.params;
      const result = await trackingService.watchEpisode(req.userId, animeId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await trackingService.getTrackingStats(req.userId);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  async getTrackingDetails(req, res, next) {
    try {
      const { animeId } = req.params;
      const result = await trackingService.getTrackingDetails(req.userId, animeId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async removeTracking(req, res, next) {
    try {
      const { animeId } = req.params;
      const result = await trackingService.removeTracking(req.userId, animeId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TrackingController();
