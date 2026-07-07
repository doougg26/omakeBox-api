const translateService = require('../services/TranslateService');

class TranslateController {
  async translate(req, res, next) {
    try {
      const { text, target, source } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Texto é obrigatório' });
      }

      if (text.length > 2000) {
        return res.status(400).json({ error: 'Texto muito longo (máx. 2000 caracteres)' });
      }

      const translated = await translateService.translate(
        text,
        target || 'pt',
        source || 'en'
      );

      res.json({ translatedText: translated });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TranslateController();
