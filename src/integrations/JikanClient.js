const https = require('https');

const JIKAN_BASE = 'https://api.jikan.moe/v4';

class JikanClient {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  _getCacheKey(endpoint) {
    return `${JIKAN_BASE}${endpoint}`;
  }

  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  _setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  _fetch(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${JIKAN_BASE}${endpoint}`;

      const cached = this._getFromCache(this._getCacheKey(endpoint));
      if (cached) {
        return resolve(cached);
      }

      https
        .get(url, { headers: { 'User-Agent': 'OmakeBox/1.0' } }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              this._setCache(this._getCacheKey(endpoint), parsed);
              resolve(parsed);
            } catch (err) {
              reject(new Error('Falha ao processar resposta da Jikan API'));
            }
          });
        })
        .on('error', (err) => {
          reject(new Error(`Erro na requisição à Jikan API: ${err.message}`));
        });
    });
  }

  async getTopAnime(page = 1) {
    return this._fetch(`/top/anime?page=${page}&limit=25`);
  }

  async searchAnime(query, page = 1) {
    return this._fetch(
      `/anime?q=${encodeURIComponent(query)}&page=${page}&limit=25&order_by=popularity&sort=asc`
    );
  }

  async getSeasonalAnime(year, season, page = 1) {
    const currentYear = year || new Date().getFullYear();
    const currentSeason = season || this._getCurrentSeason();
    return this._fetch(`/seasons/${currentYear}/${currentSeason}?page=${page}&limit=25`);
  }

  async getAnimeById(malId) {
    return this._fetch(`/anime/${malId}/full`);
  }

  async getAnimeCharacters(malId) {
    return this._fetch(`/anime/${malId}/characters`);
  }

  _getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }
}

module.exports = new JikanClient();
