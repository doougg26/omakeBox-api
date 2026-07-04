const { Router } = require('express');
const trackingController = require('../controllers/TrackingController');
const authMiddleware = require('../middlewares/auth');

const router = Router();

router.use(authMiddleware);

router.get('/stats', trackingController.getStats);
router.get('/', trackingController.getMyTrackings);
router.get('/:animeId', trackingController.getTrackingByAnime);
router.post('/:animeId', trackingController.upsertTracking);
router.patch('/:animeId', trackingController.upsertTracking);
router.post('/:animeId/watch-episode', trackingController.watchEpisode);
router.get('/:animeId/details', trackingController.getTrackingDetails);
router.delete('/:animeId', trackingController.removeTracking);

module.exports = router;
