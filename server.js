require('./src/config/environment');

const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/database');
const routes = require('./src/routes');
const errorHandler = require('./src/middlewares/errorHandler');
const env = require('./src/config/environment');

const app = express();

// Middlewares globais
app.use(cors({
  origin: env.cors.frontendUrl,
  credentials: true,
}));
app.use(express.json());

// Rotas
app.use('/api', routes);

// Tratamento de erros
app.use(errorHandler);

// Inicialização
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexão com PostgreSQL estabelecida');

    // Sincroniza modelos (cria tabelas se não existirem)
    await sequelize.sync({ alter: false });
    console.log('✓ Modelos sincronizados com o banco');

    app.listen(env.port, () => {
      console.log(`✓ Servidor rodando em http://localhost:${env.port}`);
      console.log(`  Ambiente: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error('✗ Erro ao iniciar servidor:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
