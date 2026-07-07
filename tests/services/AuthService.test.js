const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AuthService = require('../../src/services/AuthService');
const UserRepository = require('../../src/repositories/UserRepository');
const { User } = require('../../src/models');

jest.mock('../../src/repositories/UserRepository');

describe('AuthService', () => {
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    nickname: 'testuser',
    email: 'test@example.com',
    senha_hash: null, // will be set after hash
    anime_favorito_id: null,
    avatar_url: null,
    bio: null,
    links_sociais: null,
    criado_em: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByNickname.mockResolvedValue(null);
      UserRepository.create.mockResolvedValue({ ...mockUser, senha_hash: await bcrypt.hash('123456', 10) });

      const result = await AuthService.register({
        nickname: 'testuser',
        email: 'test@example.com',
        senha: '123456',
      });

      expect(result.user).toBeDefined();
      expect(result.user.nickname).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(UserRepository.create).toHaveBeenCalledTimes(1);
    });

    it('deve lançar erro se email já existir', async () => {
      UserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        AuthService.register({
          nickname: 'testuser',
          email: 'test@example.com',
          senha: '123456',
        })
      ).rejects.toThrow('Email já cadastrado');
    });

    it('deve lançar erro se nickname já existir', async () => {
      UserRepository.findByEmail.mockResolvedValue(null);
      UserRepository.findByNickname.mockResolvedValue(mockUser);

      await expect(
        AuthService.register({
          nickname: 'testuser',
          email: 'test@example.com',
          senha: '123456',
        })
      ).rejects.toThrow('Nickname já está em uso');
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso com credenciais válidas', async () => {
      const senha_hash = await bcrypt.hash('123456', 10);
      UserRepository.findByNicknameOrEmail.mockResolvedValue({
        ...mockUser,
        senha_hash,
      });

      const result = await AuthService.login('testuser', '123456');

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('deve lançar erro com senha inválida', async () => {
      const senha_hash = await bcrypt.hash('123456', 10);
      UserRepository.findByNicknameOrEmail.mockResolvedValue({
        ...mockUser,
        senha_hash,
      });

      await expect(
        AuthService.login('testuser', 'senha_errada')
      ).rejects.toThrow('Credenciais inválidas');
    });

    it('deve lançar erro se usuário não existir', async () => {
      UserRepository.findByNicknameOrEmail.mockResolvedValue(null);

      await expect(
        AuthService.login('inexistente', '123456')
      ).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('refreshToken', () => {
    it('deve renovar tokens com refresh token válido', async () => {
      const env = require('../../src/config/environment');

      UserRepository.findById.mockResolvedValue(mockUser);

      const refreshToken = jwt.sign(
        { sub: mockUser.id },
        env.jwt.refreshSecret,
        { expiresIn: '7d' }
      );

      const result = await AuthService.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('deve lançar erro com refresh token inválido', async () => {
      await expect(
        AuthService.refreshToken('token-invalido')
      ).rejects.toThrow('Token de refresh inválido ou expirado');
    });
  });
});
