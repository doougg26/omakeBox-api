const rateLimit = require('express-rate-limit');

/**
 * Rate limiter geral para a API.
 * 100 requisições por minuto por IP.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
});

/**
 * Rate limiter estrito para rotas de autenticação (login, register).
 * 5 tentativas por minuto por IP — proteção contra brute force.
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 1 minuto.' },
});

module.exports = { apiLimiter, authLimiter };
