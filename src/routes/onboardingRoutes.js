const { Router } = require('express');
const onboardingController = require('../controllers/OnboardingController');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  setFavoriteAnimeSchema,
} = require('../validators/communityValidators');

const router = Router();

// Todas as rotas de onboarding exigem autenticação
router.use(authMiddleware);

// Define o anime favorito (sincroniza da Jikan)
router.post('/favorite-anime', validate(setFavoriteAnimeSchema), onboardingController.setFavoriteAnime);

module.exports = router;
