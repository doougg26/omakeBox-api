const crypto = require('crypto');

require('dotenv').config({ quiet: true });

/** Gera uma chave aleatória segura para fallback (apenas desenvolvimento) */
function randomKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || randomKey(),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || randomKey(),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'https://omake-box.vercel.app',
  },
};
