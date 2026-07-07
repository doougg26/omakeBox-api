'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ─── posts ────────────────────────────────────────────
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "posts_criado_em_idx" ON "posts" ("criado_em");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "posts_user_id_criado_em_idx" ON "posts" ("user_id", "criado_em");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "posts_anime_id_idx" ON "posts" ("anime_id");'
    );

    // ─── comments ─────────────────────────────────────────
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "comments_post_id_criado_em_idx" ON "comments" ("post_id", "criado_em");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "comments_user_id_idx" ON "comments" ("user_id");'
    );

    // ─── connections ──────────────────────────────────────
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "connections_unique_pair_idx" ON "connections" ("solicitante_id", "destinatario_id");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "connections_destinatario_status_idx" ON "connections" ("destinatario_id", "status", "criado_em");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "connections_solicitante_status_idx" ON "connections" ("solicitante_id", "status", "criado_em");'
    );

    // ─── notifications ────────────────────────────────────
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "notifications_user_id_criado_em_idx" ON "notifications" ("user_id", "criado_em");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "notifications_user_id_lida_idx" ON "notifications" ("user_id", "lida");'
    );

    // ─── user_anime_trackings ─────────────────────────────
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "uat_unique_user_anime_idx" ON "user_anime_trackings" ("user_id", "anime_id");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "uat_user_id_atualizado_em_idx" ON "user_anime_trackings" ("user_id", "atualizado_em");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "uat_anime_id_idx" ON "user_anime_trackings" ("anime_id");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "uat_anime_id_status_idx" ON "user_anime_trackings" ("anime_id", "status");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "uat_anime_id_nota_idx" ON "user_anime_trackings" ("anime_id", "nota");'
    );

    // ─── episode_watch_history ────────────────────────────
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "ewh_user_anime_criado_idx" ON "episode_watch_history" ("user_id", "anime_id", "criado_em");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "ewh_user_anime_ep_idx" ON "episode_watch_history" ("user_id", "anime_id", "episode_number");'
    );

    // ─── character_votes ──────────────────────────────────
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "cv_user_anime_unique_idx" ON "character_votes" ("user_id", "anime_id");'
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('character_votes', 'cv_user_anime_unique_idx');
    await queryInterface.removeIndex('episode_watch_history', 'ewh_user_anime_ep_idx');
    await queryInterface.removeIndex('episode_watch_history', 'ewh_user_anime_criado_idx');
    await queryInterface.removeIndex('user_anime_trackings', 'uat_unique_user_anime_idx');
    await queryInterface.removeIndex('user_anime_trackings', 'uat_anime_id_nota_idx');
    await queryInterface.removeIndex('user_anime_trackings', 'uat_anime_id_status_idx');
    await queryInterface.removeIndex('user_anime_trackings', 'uat_anime_id_idx');
    await queryInterface.removeIndex('user_anime_trackings', 'uat_user_id_atualizado_em_idx');
    await queryInterface.removeIndex('notifications', 'notifications_user_id_lida_idx');
    await queryInterface.removeIndex('notifications', 'notifications_user_id_criado_em_idx');
    await queryInterface.removeIndex('connections', 'connections_unique_pair_idx');
    await queryInterface.removeIndex('connections', 'connections_solicitante_status_idx');
    await queryInterface.removeIndex('connections', 'connections_destinatario_status_idx');
    await queryInterface.removeIndex('comments', 'comments_user_id_idx');
    await queryInterface.removeIndex('comments', 'comments_post_id_criado_em_idx');
    await queryInterface.removeIndex('posts', 'posts_anime_id_idx');
    await queryInterface.removeIndex('posts', 'posts_user_id_criado_em_idx');
    await queryInterface.removeIndex('posts', 'posts_criado_em_idx');
  },
};
