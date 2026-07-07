const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const sequelize = require('./database');

// Normaliza caminho para usar forward slashes (compatível com Windows + glob)
const migrationsDir = path.join(__dirname, '../../migrations').replace(/\\/g, '/');

const migrator = new Umzug({
  migrations: {
    glob: `${migrationsDir}/*.js`,
    resolve: ({ name, path: migrationPath }) => {
      const migration = require(migrationPath);
      return {
        name,
        up: async () => migration.up(sequelize.getQueryInterface(), sequelize.Sequelize),
        down: async () => migration.down(sequelize.getQueryInterface(), sequelize.Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({
    sequelize,
    tableName: 'SequelizeMeta',
  }),
  logger: {
    info: (msg) => console.log(`  ${msg}`),
    warn: (msg) => console.warn(`  ⚠ ${msg}`),
    error: (msg) => console.error(`  ✗ ${msg}`),
    debug: () => {},
  },
});

/**
 * Executa todas as migrations pendentes e retorna as executadas
 */
async function runMigrations() {
  const pending = await migrator.pending();
  if (pending.length === 0) {
    console.log('✓ Nenhuma migration pendente');
    return [];
  }

  console.log(`→ Executando ${pending.length} migration(s)...`);
  const executed = await migrator.up();
  console.log(`✓ ${executed.length} migration(s) executada(s)`);
  return executed;
}

module.exports = { migrator, runMigrations };
