const { Router } = require('express');
const statsController = require('../controllers/StatsController');

const router = Router();

router.get('/', statsController.getAllStats);

module.exports = router;
