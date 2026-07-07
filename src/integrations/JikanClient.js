const https = require('https');

const JIKAN_BASE = 'https://api.jikan.moe/v4';

class JikanClient {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    this._staleWarned = new Set(); // evita repetir warnings do mesmo endpoint
  }

  _getCacheKey(endpoint) {
    return `${JIKAN_BASE}${endpoint}`;
  }

  /** Retorna dados frescos (dentro do TTL) */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }
    return null;
  }

  /** Retorna qualquer dado em cache, mesmo expirado (stale) */
  _getStaleFromCache(key) {
    const cached = this.cache.get(key);
    return cached || null;
  }

  _setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Fetch com stale-while-revalidate:
   * - Cache fresco → devolve imediatamente
   * - API falha + cache expirado → devolve cache (stale)
   * - API falha + sem cache → reject
   */
  async _fetch(endpoint) {
    const cacheKey = this._getCacheKey(endpoint);
    const fresh = this._getFromCache(cacheKey);
    if (fresh) {
      return fresh.data;
    }

    // Tenta buscar da API
    try {
      const data = await this._fetchFromApi(endpoint);
      this._setCache(cacheKey, data);
      return data;
    } catch (apiErr) {
      // API falhou — tenta cache expirado como fallback
      const stale = this._getStaleFromCache(cacheKey);
      if (stale) {
        if (!this._staleWarned.has(cacheKey)) {
          this._staleWarned.add(cacheKey);
          console.warn(`[Jikan] API indisponível, usando cache expirado para: ${endpoint}`);
        }
        const staleData = { ...stale.data, _stale: true };
        return staleData;
      }
      throw apiErr;
    }
  }

  /** Requisição HTTP real à Jikan API */
  _fetchFromApi(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${JIKAN_BASE}${endpoint}`;

      https
        .get(url, { headers: { 'User-Agent': 'OmakeBox/1.0' } }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);

              if (parsed.status && parsed.status >= 400) {
                const msg = parsed.message || `Jikan API retornou status ${parsed.status}`;
                reject(new Error(msg));
                return;
              }

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

  async getAnimeByGenre(genreId, page = 1) {
    return this._fetch(`/anime?genres=${genreId}&page=${page}&limit=25&order_by=popularity&sort=asc`);
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
