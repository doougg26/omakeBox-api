const { Router } = require('express');
const { apiLimiter } = require('../middlewares/rateLimiter');
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
const statsRoutes = require('./statsRoutes');

const router = Router();

// Health check (fora do rate limiter para monitoramento)
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limiter geral para toda a API
router.use(apiLimiter);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/anime', animeRoutes);
router.use('/anime', communityRoutes);
router.use('/tracking', trackingRoutes);
router.use('/feed', feedRoutes);
router.use('/connections', connectionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stats', statsRoutes);
router.use('/', translateRoutes);

module.exports = router;
