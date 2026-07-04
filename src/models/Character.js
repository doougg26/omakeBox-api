const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Character extends Model {}

Character.init(
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
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    imagem_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    anime_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'animes', key: 'id' },
    },
  },
  {
    sequelize,
    modelName: 'Character',
    tableName: 'characters',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Character;
