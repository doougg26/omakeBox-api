const { Sequelize } = require('sequelize');

const dbConfig = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
};

// Neon/SSL requer SSL em produção
if (process.env.NODE_ENV === 'production') {
  dbConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
  dbConfig.pool = {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  };
}

let sequelize;

if (process.env.DATABASE_URL) {
  // Usa connection string (Neon, Render, etc.)
  sequelize = new Sequelize(process.env.DATABASE_URL, dbConfig);
} else {
  // Fallback: parâmetros individuais (desenvolvimento local)
  if (!process.env.DB_PASSWORD) {
    console.warn('⚠ DB_PASSWORD não definido. Configure um .env file.');
  }
  sequelize = new Sequelize(
    process.env.DB_NAME || 'omakebox',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      ...dbConfig,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
    }
  );
}

module.exports = sequelize;
