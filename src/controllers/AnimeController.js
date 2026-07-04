const jikanClient = require('../integrations/JikanClient');

class AnimeController {
  async getTrending(req, res, next) {
    try {
      const { page } = req.query;
      const animes = await jikanClient.getTopAnime(parseInt(page, 10) || 1);
      res.json(animes);
    } catch (err) {
      next(err);
    }
  }

  async search(req, res, next) {
    try {
      const { q, page } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Parâmetro de busca (q) é obrigatório' });
      }
      const results = await jikanClient.searchAnime(q, parseInt(page, 10) || 1);
      res.json(results);
    } catch (err) {
      next(err);
    }
  }

  async getSeason(req, res, next) {
    try {
      const { year, season, page } = req.query;
      const results = await jikanClient.getSeasonalAnime(
        parseInt(year, 10),
        season,
        parseInt(page, 10) || 1
      );
      res.json(results);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const anime = await jikanClient.getAnimeById(id);
      res.json(anime);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnimeController();
