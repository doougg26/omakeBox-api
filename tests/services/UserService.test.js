const UserService = require('../../src/services/UserService');
const UserRepository = require('../../src/repositories/UserRepository');

jest.mock('../../src/repositories/UserRepository');

describe('UserService', () => {
  const mockUser = {
    id: 'user-uuid-1',
    nickname: 'testuser',
    email: 'test@example.com',
    bio: 'Fã de animes',
    links_sociais: [{ nome: 'Twitter', url: 'https://twitter.com/testuser' }],
    anime_favorito_id: 'anime-uuid-1',
    avatar_url: null,
    criado_em: new Date('2026-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('deve retornar perfil público sem email', async () => {
      UserRepository.findByNickname.mockResolvedValue(mockUser);

      const result = await UserService.getProfile('testuser');

      expect(result.nickname).toBe('testuser');
      expect(result.email).toBeUndefined();
      expect(result.bio).toBe('Fã de animes');
      expect(result.links_sociais).toHaveLength(1);
    });

    it('deve retornar avatar quando avatar_url existe', async () => {
      UserRepository.findByNickname.mockResolvedValue({
        ...mockUser,
        avatar_url: 'https://example.com/avatar.jpg',
      });

      const result = await UserService.getProfile('testuser');

      expect(result.avatar).toEqual({
        tipo: 'custom',
        imagem_url: 'https://example.com/avatar.jpg',
      });
    });

    it('deve lançar erro se usuário não existir', async () => {
      UserRepository.findByNickname.mockResolvedValue(null);

      await expect(
        UserService.getProfile('inexistente')
      ).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('getMe', () => {
    it('deve retornar perfil completo com email', async () => {
      UserRepository.findById.mockResolvedValue(mockUser);

      const result = await UserService.getMe('user-uuid-1');

      expect(result.nickname).toBe('testuser');
      expect(result.email).toBe('test@example.com');
    });

    it('deve lançar erro se usuário não existir', async () => {
      UserRepository.findById.mockResolvedValue(null);

      await expect(
        UserService.getMe('user-inexistente')
      ).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar bio e links_sociais', async () => {
      UserRepository.updateProfile.mockResolvedValue([1]);
      UserRepository.findById.mockResolvedValue(mockUser);

      const result = await UserService.updateProfile('user-uuid-1', {
        bio: 'Nova biografia',
        links_sociais: [{ nome: 'GitHub', url: 'https://github.com/testuser' }],
      });

      expect(UserRepository.updateProfile).toHaveBeenCalledWith('user-uuid-1', {
        bio: 'Nova biografia',
        links_sociais: [{ nome: 'GitHub', url: 'https://github.com/testuser' }],
      });
      expect(result.nickname).toBe('testuser');
    });

    it('deve rejeitar campos não permitidos', async () => {
      UserRepository.updateProfile.mockResolvedValue([1]);
      UserRepository.findById.mockResolvedValue(mockUser);

      const result = await UserService.updateProfile('user-uuid-1', {
        bio: 'Nova bio',
        email: 'hack@example.com', // não permitido
      });

      // email não deve ser incluído no update
      expect(UserRepository.updateProfile).toHaveBeenCalledWith('user-uuid-1', {
        bio: 'Nova bio',
      });
    });

    it('deve lançar erro se nenhum campo válido for enviado', async () => {
      await expect(
        UserService.updateProfile('user-uuid-1', {})
      ).rejects.toThrow('Nenhum campo válido para atualizar');

      expect(UserRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('deve atualizar anime_favorito_id', async () => {
      UserRepository.updateProfile.mockResolvedValue([1]);
      UserRepository.findById.mockResolvedValue(mockUser);

      await UserService.updateProfile('user-uuid-1', {
        anime_favorito_id: 'anime-uuid-2',
      });

      expect(UserRepository.updateProfile).toHaveBeenCalledWith('user-uuid-1', {
        anime_favorito_id: 'anime-uuid-2',
      });
    });
  });

  describe('setAvatarUrl', () => {
    it('deve definir avatar por URL', async () => {
      UserRepository.updateProfile.mockResolvedValue([1]);
      UserRepository.findById.mockResolvedValue(mockUser);

      const result = await UserService.setAvatarUrl(
        'user-uuid-1',
        'https://example.com/avatar.jpg'
      );

      expect(UserRepository.updateProfile).toHaveBeenCalledWith('user-uuid-1', {
        avatar_url: 'https://example.com/avatar.jpg',
      });
      expect(result.nickname).toBe('testuser');
    });
  });

  describe('removeAvatar', () => {
    it('deve remover avatar', async () => {
      UserRepository.updateProfile.mockResolvedValue([1]);
      UserRepository.findById.mockResolvedValue(mockUser);

      const result = await UserService.removeAvatar('user-uuid-1');

      expect(UserRepository.updateProfile).toHaveBeenCalledWith('user-uuid-1', {
        avatar_url: null,
      });
      expect(result.nickname).toBe('testuser');
    });
  });
});
