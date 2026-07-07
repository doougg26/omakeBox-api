const User = require('./User');
const Anime = require('./Anime');
const Character = require('./Character');
const UserAnimeTracking = require('./UserAnimeTracking');
const EpisodeWatchHistory = require('./EpisodeWatchHistory');
const CharacterVote = require('./CharacterVote');
const Post = require('./Post');
const Comment = require('./Comment');
const Connection = require('./Connection');
const Notification = require('./Notification');

// User associations
User.hasMany(UserAnimeTracking, { foreignKey: 'user_id' });
User.hasMany(Post, { foreignKey: 'user_id' });
User.hasMany(Comment, { foreignKey: 'user_id' });
User.hasMany(CharacterVote, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });
User.belongsTo(Anime, { as: 'animeFavorito', foreignKey: 'anime_favorito_id' });
// Anime associations
Anime.hasMany(Character, { foreignKey: 'anime_id' });
Anime.hasMany(UserAnimeTracking, { foreignKey: 'anime_id' });
Anime.hasMany(CharacterVote, { foreignKey: 'anime_id' });
Anime.hasMany(Post, { foreignKey: 'anime_id' });
Anime.hasOne(User, { as: 'animeFavorito', foreignKey: 'anime_favorito_id' });

// Character associations
Character.belongsTo(Anime, { foreignKey: 'anime_id' });
Character.hasMany(CharacterVote, { foreignKey: 'character_id' });
// UserAnimeTracking associations
UserAnimeTracking.belongsTo(User, { foreignKey: 'user_id' });
UserAnimeTracking.belongsTo(Anime, { foreignKey: 'anime_id' });

// EpisodeWatchHistory associations
EpisodeWatchHistory.belongsTo(User, { foreignKey: 'user_id' });
EpisodeWatchHistory.belongsTo(Anime, { foreignKey: 'anime_id' });
User.hasMany(EpisodeWatchHistory, { foreignKey: 'user_id' });
Anime.hasMany(EpisodeWatchHistory, { foreignKey: 'anime_id' });

// CharacterVote associations
CharacterVote.belongsTo(User, { foreignKey: 'user_id' });
CharacterVote.belongsTo(Character, { foreignKey: 'character_id' });
CharacterVote.belongsTo(Anime, { foreignKey: 'anime_id' });

// Post associations
Post.belongsTo(User, { foreignKey: 'user_id' });
Post.belongsTo(Anime, { foreignKey: 'anime_id' });
Post.hasMany(Comment, { foreignKey: 'post_id' });

// Comment associations
Comment.belongsTo(Post, { foreignKey: 'post_id' });
Comment.belongsTo(User, { foreignKey: 'user_id' });

// Connection associations
Connection.belongsTo(User, { as: 'Solicitante', foreignKey: 'solicitante_id' });
Connection.belongsTo(User, { as: 'Destinatario', foreignKey: 'destinatario_id' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  Anime,
  Character,
  UserAnimeTracking,
  EpisodeWatchHistory,
  CharacterVote,
  Post,
  Comment,
  Connection,
  Notification,
};
