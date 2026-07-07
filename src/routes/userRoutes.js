const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/UserController');
const avatarController = require('../controllers/AvatarController');
const onboardingController = require('../controllers/OnboardingController');
const trackingController = require('../controllers/TrackingController');
const feedController = require('../controllers/FeedController');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// Configuração do multer para upload de avatar
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/avatars'),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagem não suportado. Use: jpg, png, gif, webp'));
    }
  },
});

router.get('/me', authMiddleware, userController.getMe);
router.patch('/me', authMiddleware, userController.updateMe);
router.post('/me/favorite-anime', authMiddleware, onboardingController.setFavoriteAnime);
// Avatar endpoints - URL ou upload
router.post('/me/avatar/url', authMiddleware, avatarController.setAvatarUrl);
router.post('/me/avatar/upload', authMiddleware, upload.single('avatar'), avatarController.uploadAvatar);
router.delete('/me/avatar', authMiddleware, avatarController.removeAvatar);
router.get('/:nickname', userController.getProfile);
router.get('/:nickname/trackings', trackingController.getUserTrackingsByNickname);
router.get('/:nickname/posts', feedController.getUserPostsByNickname);
router.get('/:nickname/stats', trackingController.getStatsByNickname);

module.exports = router;
