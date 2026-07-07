// Mock do banco de dados (sem instanciar Sequelize real — evita dependência de sqlite3)
jest.mock('../src/config/database', () => ({
  query: jest.fn().mockResolvedValue([]),
  getQueryInterface: () => ({}),
  define: () => ({}),
}));

// Mock das models
jest.mock('../src/models', () => require('./__mocks__/models'));

// Mock das variáveis de ambiente
jest.mock('../src/config/environment', () => ({
  jwt: {
    secret: 'test-secret-key',
    refreshSecret: 'test-refresh-secret-key',
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  port: 3001,
  nodeEnv: 'test',
}));
