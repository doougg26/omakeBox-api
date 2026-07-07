const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nickname: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    senha_hash: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    anime_favorito_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'animes', key: 'id' },
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    links_sociais: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false,
    underscored: true,
  }
);

module.exports = User;
