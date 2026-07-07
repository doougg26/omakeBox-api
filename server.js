require('./src/config/environment');

const path = require('path');
const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/database');
const { runMigrations } = require('./src/config/migrator');
const routes = require('./src/routes');
const errorHandler = require('./src/middlewares/errorHandler');
const env = require('./src/config/environment');

const app = express();

// Middlewares globais
app.use(cors({
  origin: env.cors.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos - uploads de avatar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api', routes);

// Tratamento de erros
app.use(errorHandler);

// Inicialização
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexão com PostgreSQL estabelecida');

    // Executa migrations pendentes
    await runMigrations();

    // Fallback: garante colunas que podem faltar em DB criado por sync() antigo
    try {
      await sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;');
      await sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;');
      await sequelize.query("ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"links_sociais\" JSONB DEFAULT '[]';");
      await sequelize.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_personagem_id";');
    } catch (err) {
      console.warn('  ⚠ Aviso: falha ao ajustar colunas users (ignorado):', err.message);
    }

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
