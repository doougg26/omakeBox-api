const { Router } = require('express');
const animeController = require('../controllers/AnimeController');

const router = Router();

router.get('/trending', animeController.getTrending);
router.get('/search', animeController.search);
router.get('/season', animeController.getSeason);

// GET /anime/:id agora é tratado pelas communityRoutes com dados enriquecidos

module.exports = router;
