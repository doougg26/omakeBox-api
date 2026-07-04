const { Router } = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const animeRoutes = require('./animeRoutes');
const onboardingRoutes = require('./onboardingRoutes');
const communityRoutes = require('./communityRoutes');
const trackingRoutes = require('./trackingRoutes');
const translateRoutes = require('./translateRoutes');
const feedRoutes = require('./feedRoutes');
const connectionRoutes = require('./connectionRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/anime', animeRoutes);
router.use('/anime', communityRoutes);
router.use('/tracking', trackingRoutes);
router.use('/feed', feedRoutes);
router.use('/connections', connectionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', translateRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
