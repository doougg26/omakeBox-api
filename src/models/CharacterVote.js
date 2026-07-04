const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class CharacterVote extends Model {}

CharacterVote.init(
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
    character_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'characters', key: 'id' },
    },
    anime_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'animes', key: 'id' },
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'CharacterVote',
    tableName: 'character_votes',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'anime_id'],
      },
    ],
  }
);

module.exports = CharacterVote;
