const https = require('https');

const LIBRE_TRANSLATE_URL = 'https://libretranslate.com/translate';

class TranslateService {
  /**
   * Traduz texto usando a API pública do LibreTranslate
   */
  async translate(text, targetLang = 'pt', sourceLang = 'en') {
    if (!text || text.length > 2000) {
      throw new Error('Texto muito longo para tradução (máx. 2000 caracteres)');
    }

    const body = JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text',
    });

    return new Promise((resolve, reject) => {
      const req = https.request(LIBRE_TRANSLATE_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                reject(new Error(parsed.error));
              } else {
                resolve(parsed.translatedText);
              }
            } catch {
              reject(new Error('Falha ao processar resposta da tradução'));
            }
          });
        }
      );

      req.on('error', (err) => {
        reject(new Error(`Erro na tradução: ${err.message}`));
      });

      req.write(body);
      req.end();
    });
  }
}

module.exports = new TranslateService();
