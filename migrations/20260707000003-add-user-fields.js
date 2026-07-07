'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adiciona colunas que faltam na tabela users (criada por sync() antes destas features)
    const tableInfo = await queryInterface.describeTable('users');

    if (!tableInfo.avatar_url) {
      await queryInterface.addColumn('users', 'avatar_url', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log('  + coluna avatar_url adicionada');
    }

    if (!tableInfo.bio) {
      await queryInterface.addColumn('users', 'bio', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log('  + coluna bio adicionada');
    }

    if (!tableInfo.links_sociais) {
      await queryInterface.addColumn('users', 'links_sociais', {
        type: Sequelize.JSONB,
        defaultValue: [],
      });
      console.log('  + coluna links_sociais adicionada');
    }

    // Remove coluna legado (avatar via personagem Jikan)
    if (tableInfo.avatar_personagem_id) {
      await queryInterface.removeColumn('users', 'avatar_personagem_id');
      console.log('  - coluna avatar_personagem_id removida');
    }

    // Corrige tipo da senha_hash se necessário (de STRING(255) para STRING(60))
    if (tableInfo.senha_hash && tableInfo.senha_hash.type !== 'CHARACTER(60)') {
      // apenas log, não altera tipo para evitar perda de dados
      console.log('  ~ coluna senha_hash existe (tipo: ' + tableInfo.senha_hash.type + ')');
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverte: recria avatar_personagem_id, remove colunas novas
    const tableInfo = await queryInterface.describeTable('users');

    if (tableInfo.avatar_url) {
      await queryInterface.removeColumn('users', 'avatar_url');
    }
    if (tableInfo.bio) {
      await queryInterface.removeColumn('users', 'bio');
    }
    if (tableInfo.links_sociais) {
      await queryInterface.removeColumn('users', 'links_sociais');
    }
    if (!tableInfo.avatar_personagem_id) {
      await queryInterface.addColumn('users', 'avatar_personagem_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'characters', key: 'id' },
      });
    }
  },
};
