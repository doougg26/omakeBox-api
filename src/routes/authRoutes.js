const { Router } = require('express');
const authController = require('../controllers/AuthController');
const validate = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
} = require('../validators/authValidators');

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);

module.exports = router;
