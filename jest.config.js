module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/repositories/**/*.js',
    'src/utils/**/*.js',
    '!src/**/index.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFiles: ['<rootDir>/tests/setup.js'],
};
