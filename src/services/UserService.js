const UserRepository = require('../repositories/UserRepository');
const AppError = require('../utils/AppError');

class UserService {
  async getProfile(nickname) {
    const user = await UserRepository.findByNickname(nickname);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }
    return {
      id: user.id,
      nickname: user.nickname,
      bio: user.bio,
      links_sociais: user.links_sociais,
      anime_favorito_id: user.anime_favorito_id,
      avatar_personagem_id: user.avatar_personagem_id,
      criado_em: user.criado_em,
    };
  }

  async getMe(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }
    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      bio: user.bio,
      links_sociais: user.links_sociais,
      anime_favorito_id: user.anime_favorito_id,
      avatar_personagem_id: user.avatar_personagem_id,
      criado_em: user.criado_em,
    };
  }

  async updateProfile(userId, data) {
    const allowedFields = ['bio', 'links_sociais', 'anime_favorito_id', 'avatar_personagem_id'];
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
}

module.exports = new UserService();
