'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Extensão UUID
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // ─── animes ───────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "animes" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "mal_id" INTEGER NOT NULL UNIQUE,
        "titulo" VARCHAR(255) NOT NULL,
        "capa_url" VARCHAR(500),
        "sinopse" TEXT,
        "status" VARCHAR(30),
        "generos" JSONB DEFAULT '[]',
        "estudios" JSONB DEFAULT '[]',
        "total_episodios" INTEGER,
        "temporada" VARCHAR(20),
        "ano" SMALLINT,
        "ultima_sincronizacao" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // ─── users ────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "nickname" VARCHAR(30) NOT NULL UNIQUE,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "senha_hash" VARCHAR(60) NOT NULL,
        "anime_favorito_id" UUID REFERENCES "animes"("id") ON DELETE SET NULL,
        "avatar_url" TEXT,
        "bio" TEXT,
        "links_sociais" JSONB DEFAULT '[]',
        "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ─── characters ───────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "characters" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "mal_id" INTEGER NOT NULL UNIQUE,
        "nome" VARCHAR(255) NOT NULL,
        "imagem_url" VARCHAR(500),
        "anime_id" UUID NOT NULL REFERENCES "animes"("id") ON DELETE CASCADE
      );
    `);

    // ─── user_anime_trackings ─────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "user_anime_trackings" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "anime_id" UUID NOT NULL REFERENCES "animes"("id") ON DELETE CASCADE,
        "status" VARCHAR(20) NOT NULL DEFAULT 'planejo_assistir',
        "ultimo_episodio_assistido" INTEGER DEFAULT 0,
        "nota" SMALLINT,
        "impressao_texto" VARCHAR(500),
        "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "atualizado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ─── episode_watch_history ────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "episode_watch_history" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "anime_id" UUID NOT NULL REFERENCES "animes"("id") ON DELETE CASCADE,
        "episode_number" INTEGER NOT NULL,
        "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ─── character_votes ──────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "character_votes" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "character_id" UUID NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
        "anime_id" UUID NOT NULL REFERENCES "animes"("id") ON DELETE CASCADE,
        "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ─── posts ────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "posts" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "anime_id" UUID NOT NULL REFERENCES "animes"("id") ON DELETE CASCADE,
        "texto" TEXT NOT NULL,
        "marcado_como_spoiler" BOOLEAN NOT NULL DEFAULT false,
        "likes_count" INTEGER NOT NULL DEFAULT 0,
        "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ─── comments ─────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "comments" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "post_id" UUID NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "texto" VARCHAR(1000) NOT NULL,
        "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ─── connections ──────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "connections" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "solicitante_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "destinatario_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" VARCHAR(10) NOT NULL DEFAULT 'pendente',
        "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ─── notifications ────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "tipo" VARCHAR(30) NOT NULL,
        "referencia_tipo" VARCHAR(20) NOT NULL,
        "referencia_id" UUID NOT NULL,
        "lida" BOOLEAN NOT NULL DEFAULT false,
        "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('connections');
    await queryInterface.dropTable('comments');
    await queryInterface.dropTable('posts');
    await queryInterface.dropTable('character_votes');
    await queryInterface.dropTable('episode_watch_history');
    await queryInterface.dropTable('user_anime_trackings');
    await queryInterface.dropTable('characters');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('animes');
  },
};
