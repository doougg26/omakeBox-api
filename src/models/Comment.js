const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Comment extends Model {}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'posts', key: 'id' },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    texto: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'comments_post_id_criado_em_idx',
        fields: ['post_id', 'criado_em'],
      },
      {
        name: 'comments_user_id_idx',
        fields: ['user_id'],
      },
    ],
  }
);

module.exports = Comment;
