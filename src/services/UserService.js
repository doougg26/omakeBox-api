const UserRepository = require('../repositories/UserRepository');
const AppError = require('../utils/AppError');

class UserService {
  async _serializeUser(user, includeEmail = false) {
    return {
      id: user.id,
      nickname: user.nickname,
      ...(includeEmail ? { email: user.email } : {}),
      bio: user.bio,
      links_sociais: user.links_sociais,
      anime_favorito_id: user.anime_favorito_id,
      avatar_url: user.avatar_url,
      avatar: user.avatar_url ? { tipo: 'custom', imagem_url: user.avatar_url } : null,
      criado_em: user.criado_em,
    };
  }

  async getProfile(nickname) {
    const user = await UserRepository.findByNickname(nickname);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }
    return this._serializeUser(user, false);
  }

  async getMe(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }
    return this._serializeUser(user, true);
  }

  async updateProfile(userId, data) {
    const allowedFields = ['bio', 'links_sociais', 'anime_favorito_id', 'avatar_url'];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('Nenhum campo válido para atualizar', 400);
    }

    await UserRepository.updateProfile(userId, updateData);
    return this.getMe(userId);
  }

  async setAvatarUrl(userId, avatarUrl) {
    await UserRepository.updateProfile(userId, { avatar_url: avatarUrl });
    return this.getMe(userId);
  }

  async removeAvatar(userId) {
    await UserRepository.updateProfile(userId, { avatar_url: null });
    return this.getMe(userId);
  }
}

module.exports = new UserService();
