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
      // Se for erro da Jikan API, retorna mensagem amigável
      if (err.message && err.message.includes('Jikan')) {
        return res.status(503).json({
          error: 'Serviço de busca temporariamente indisponível',
          detail: 'A fonte de dados (MyAnimeList) está inacessível no momento. Tente novamente mais tarde.',
        });
      }
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

  async getByGenre(req, res, next) {
    try {
      const { genre, page } = req.query;
      if (!genre) {
        return res.status(400).json({ error: 'Parâmetro genre é obrigatório' });
      }
      const results = await jikanClient.getAnimeByGenre(parseInt(genre, 10), parseInt(page, 10) || 1);
      res.json(results);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnimeController();
