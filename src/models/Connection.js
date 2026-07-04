const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Connection extends Model {}

Connection.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    solicitante_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    destinatario_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'pendente',
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Connection',
    tableName: 'connections',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['solicitante_id', 'destinatario_id'],
      },
    ],
  }
);

module.exports = Connection;
