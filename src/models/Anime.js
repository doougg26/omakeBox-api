const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Anime extends Model {}

Anime.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    capa_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    sinopse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    generos: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    estudios: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    total_episodios: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    temporada: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    ano: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    ultima_sincronizacao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Anime',
    tableName: 'animes',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Anime;
