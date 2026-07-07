const path = require('path');
const fs = require('fs');
const userService = require('../services/UserService');
const AppError = require('../utils/AppError');

const AVATARS_DIR = path.join(__dirname, '../../uploads/avatars');

// Garante que o diretório de uploads existe
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

class AvatarController {
  /**
   * Define avatar por URL da internet
   */
  async setAvatarUrl(req, res, next) {
    try {
      const { avatar_url } = req.body;

      if (!avatar_url || typeof avatar_url !== 'string') {
        throw new AppError('URL do avatar é obrigatória', 400);
      }

      // Validação básica de URL
      if (!avatar_url.startsWith('http://') && !avatar_url.startsWith('https://')) {
        throw new AppError('URL deve começar com http:// ou https://', 400);
      }

      // Validação básica de extensão de imagem
      const ext = path.extname(avatar_url.split('?')[0]).toLowerCase();
      if (ext && !['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        throw new AppError('URL deve apontar para uma imagem (jpg, png, gif, webp)', 400);
      }

      const user = await userService.setAvatarUrl(req.userId, avatar_url);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Faz upload de arquivo de imagem como avatar
   */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('Nenhum arquivo enviado', 400);
      }

      // Monta a URL pública do arquivo
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const user = await userService.setAvatarUrl(req.userId, avatarUrl);

      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove o avatar customizado (volta a mostrar iniciais)
   */
  async removeAvatar(req, res, next) {
    try {
      const user = await userService.removeAvatar(req.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AvatarController();
