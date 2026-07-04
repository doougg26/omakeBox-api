const jwt = require('jsonwebtoken');
const env = require('../config/environment');

/**
 * Middleware de autenticação OPCIONAL.
 * Extrai o userId do JWT se o token for fornecido e válido,
 * mas NÃO bloqueia a requisição se não houver token.
 * Usado em rotas públicas que precisam saber se o usuário está logado
 * (ex: reviews com regra de visibilidade).
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next();
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.userId = decoded.sub;
    req.userNickname = decoded.nickname;
  } catch (err) {
    // Token inválido ou expirado — apenas continua sem usuário
  }

  next();
}

module.exports = optionalAuth;
