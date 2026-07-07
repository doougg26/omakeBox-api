const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class UserAnimeTracking extends Model {}

UserAnimeTracking.init(
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
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'planejo_assistir',
    },
    ultimo_episodio_assistido: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    nota: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      validate: { min: 0, max: 10 },
    },
    impressao_texto: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    atualizado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'UserAnimeTracking',
    tableName: 'user_anime_trackings',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'anime_id'],
      },
      {
        name: 'uat_user_id_atualizado_em_idx',
        fields: ['user_id', 'atualizado_em'],
      },
      {
        name: 'uat_anime_id_idx',
        fields: ['anime_id'],
      },
      {
        name: 'uat_anime_id_status_idx',
        fields: ['anime_id', 'status'],
      },
      {
        name: 'uat_anime_id_nota_idx',
        fields: ['anime_id', 'nota'],
      },
    ],
  }
);

module.exports = UserAnimeTracking;
