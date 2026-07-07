const trackingService = require('../services/TrackingService');
const AppError = require('../utils/AppError');

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
      const { status, nota, impressao_texto, ultimo_episodio_assistido } = req.body;

      if (status !== undefined && typeof status !== 'string') {
        throw new AppError('Status inválido', 400);
      }
      if (nota !== undefined && (typeof nota !== 'number' || nota < 0 || nota > 10)) {
        throw new AppError('Nota inválida (deve ser número entre 0 e 10)', 400);
      }
      if (impressao_texto !== undefined && typeof impressao_texto !== 'string') {
        throw new AppError('Impressão inválida', 400);
      }
      if (ultimo_episodio_assistido !== undefined && typeof ultimo_episodio_assistido !== 'number') {
        throw new AppError('Episódio inválido', 400);
      }

      // Monta payload apenas com campos enviados (evita undefined sobrescrever dados)
      const upsertData = {};
      if (status !== undefined) upsertData.status = status;
      if (nota !== undefined) upsertData.nota = nota;
      if (impressao_texto !== undefined) upsertData.impressao_texto = impressao_texto;
      if (ultimo_episodio_assistido !== undefined) upsertData.ultimo_episodio_assistido = ultimo_episodio_assistido;

      const result = await trackingService.upsertTracking(
        req.userId,
        animeId,
        upsertData
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
