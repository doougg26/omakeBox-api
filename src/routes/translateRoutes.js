const { Router } = require('express');
const translateController = require('../controllers/TranslateController');

const router = Router();

router.post('/translate', translateController.translate);

module.exports = router;
