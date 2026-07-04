const { Router } = require('express');
const onboardingController = require('../controllers/OnboardingController');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  setFavoriteAnimeSchema,
  setAvatarSchema,
} = require('../validators/communityValidators');

const router = Router();

// Todas as rotas de onboarding exigem autenticação
router.use(authMiddleware);

// Define o anime favorito (sincroniza da Jikan)
router.post('/favorite-anime', validate(setFavoriteAnimeSchema), onboardingController.setFavoriteAnime);

// Define o avatar (personagem do anime favorito)
router.post('/avatar', validate(setAvatarSchema), onboardingController.setAvatar);

// Lista opções de avatar (personagens do anime favorito)
router.get('/avatar-options', onboardingController.getAvatarOptions);

module.exports = router;
