const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const env = require('../config/environment');
const AppError = require('../utils/AppError');

class AuthService {
  async register({ nickname, email, senha }) {
    const existingEmail = await UserRepository.findByEmail(email);
    if (existingEmail) {
      throw new AppError('Email já cadastrado', 409);
    }

    const existingNickname = await UserRepository.findByNickname(nickname);
    if (existingNickname) {
      throw new AppError('Nickname já está em uso', 409);
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const user = await UserRepository.create({
      nickname,
      email,
      senha_hash,
    });

    const accessToken = this._generateAccessToken(user);
    const refreshToken = this._generateRefreshToken(user);

    return {
      user: this._sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login(identifier, senha) {
    const user = await UserRepository.findByNicknameOrEmail(identifier);
    if (!user) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const accessToken = this._generateAccessToken(user);
    const refreshToken = this._generateRefreshToken(user);

    return {
      user: this._sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, env.jwt.refreshSecret);
      const user = await UserRepository.findById(decoded.sub);

      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      const accessToken = this._generateAccessToken(user);
      const newRefreshToken = this._generateRefreshToken(user);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Token de refresh inválido ou expirado', 401);
    }
  }

  _generateAccessToken(user) {
    return jwt.sign(
      { sub: user.id, nickname: user.nickname },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );
  }

  _generateRefreshToken(user) {
    return jwt.sign(
      { sub: user.id },
      env.jwt.refreshSecret,
      { expiresIn: env.jwt.refreshExpiresIn }
    );
  }

  _sanitizeUser(user) {
    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      anime_favorito_id: user.anime_favorito_id,
      avatar_personagem_id: user.avatar_personagem_id,
      bio: user.bio,
      links_sociais: user.links_sociais,
      criado_em: user.criado_em,
    };
  }
}

module.exports = new AuthService();
module.exports.AppError = AppError;
