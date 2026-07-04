const { Router } = require('express');
const feedController = require('../controllers/FeedController');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createPostSchema,
  createCommentSchema,
} = require('../validators/feedValidators');

const router = Router();

// Feed público
router.get('/', feedController.getFeed);

// Posts do usuário logado (autenticado) — ANTES de /:postId para evitar conflito
router.get('/me/posts', authMiddleware, feedController.getUserPosts);

// Post específico (público)
router.get('/:postId', feedController.getPost);

// Criar post (autenticado)
router.post('/', authMiddleware, validate(createPostSchema), feedController.createPost);

// Remover post (autenticado - apenas autor)
router.delete('/:postId', authMiddleware, feedController.deletePost);

// Curtir post (autenticado)
router.post('/:postId/like', authMiddleware, feedController.likePost);

// Comentar em post (autenticado)
router.post('/:postId/comments', authMiddleware, validate(createCommentSchema), feedController.addComment);

module.exports = router;
