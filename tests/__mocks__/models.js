// Mock dos modelos Sequelize para testes unitários
// Cada modelo tem suas próprias funções mock independentes

const { Sequelize } = require('sequelize');

const createModelMock = (name) => ({
  name,
  findOne: jest.fn(),
  findAll: jest.fn(),
  findOrCreate: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  upsert: jest.fn(),
  sequelize: { fn: Sequelize.fn, col: Sequelize.col, literal: Sequelize.literal, Op: Sequelize.Op },
});

const Anime = createModelMock('Anime');
const User = createModelMock('User');
const Character = createModelMock('Character');
const UserAnimeTracking = createModelMock('UserAnimeTracking');
const CharacterVote = createModelMock('CharacterVote');
const Post = createModelMock('Post');
const Comment = createModelMock('Comment');
const Connection = createModelMock('Connection');
const Notification = createModelMock('Notification');

module.exports = {
  Anime,
  User,
  Character,
  UserAnimeTracking,
  CharacterVote,
  Post,
  Comment,
  Connection,
  Notification,
};
