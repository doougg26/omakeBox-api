const { Router } = require('express');
const userController = require('../controllers/UserController');
const trackingController = require('../controllers/TrackingController');
const feedController = require('../controllers/FeedController');
const authMiddleware = require('../middlewares/auth');

const router = Router();

router.get('/me', authMiddleware, userController.getMe);
router.patch('/me', authMiddleware, userController.updateMe);
router.get('/:nickname', userController.getProfile);
router.get('/:nickname/trackings', trackingController.getUserTrackingsByNickname);
router.get('/:nickname/posts', feedController.getUserPostsByNickname);
router.get('/:nickname/stats', trackingController.getStatsByNickname);

module.exports = router;
