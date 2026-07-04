const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Post extends Model {}

Post.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    anime_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'animes', key: 'id' },
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    marcado_como_spoiler: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    likes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Post',
    tableName: 'posts',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Post;
