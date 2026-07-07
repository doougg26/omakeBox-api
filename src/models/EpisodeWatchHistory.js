const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class EpisodeWatchHistory extends Model {}

EpisodeWatchHistory.init(
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
    episode_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'EpisodeWatchHistory',
    tableName: 'episode_watch_history',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'ewh_user_anime_criado_idx',
        fields: ['user_id', 'anime_id', 'criado_em'],
      },
      {
        name: 'ewh_user_anime_ep_idx',
        fields: ['user_id', 'anime_id', 'episode_number'],
      },
    ],
  }
);

module.exports = EpisodeWatchHistory;
