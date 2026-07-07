const { Sequelize } = require('sequelize');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
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

const sequelize = new Sequelize(
  process.env.DB_NAME || 'omakebox',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  dbConfig
);

module.exports = sequelize;
