const { Router } = require('express');
const communityController = require('../controllers/CommunityController');
const authMiddleware = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const validate = require('../middlewares/validate');
const {
  rateAnimeSchema,
  reviewSchema,
} = require('../validators/communityValidators');

const router = Router();

// Detalhes do anime (público)
router.get('/:id', communityController.getAnimeDetails);

// Personagens (público)
router.get('/:id/characters', communityController.getCharacters);

// Ranking de personagens (público)
router.get('/:id/characters/ranking', communityController.getCharacterRanking);

// Votar em personagem (autenticado)
router.post(
  '/:id/characters/:charId/vote',
  authMiddleware,
  communityController.voteCharacter
);

// Voto do usuário (autenticado)
router.get('/:id/my-vote', authMiddleware, communityController.getUserVote);

// Avaliar anime (autenticado)
router.post('/:id/rating', authMiddleware, validate(rateAnimeSchema), communityController.rateAnime);

// Média de notas (público)
router.get('/:id/rating', communityController.getAnimeRating);

// Adicionar review (autenticado)
router.post('/:id/reviews', authMiddleware, validate(reviewSchema), communityController.addReview);

// Listar reviews (público, com regra de visibilidade)
// Usa optionalAuth para identificar o usuário logado sem bloquear anônimos
router.get('/:id/reviews', optionalAuth, communityController.getReviews);

module.exports = router;
