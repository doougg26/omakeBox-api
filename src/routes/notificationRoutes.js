const { Router } = require('express');
const notificationController = require('../controllers/NotificationController');
const authMiddleware = require('../middlewares/auth');

const router = Router();

router.use(authMiddleware);

// Listar notificações
router.get('/', notificationController.getNotifications);

// Contagem de não lidas
router.get('/unread-count', notificationController.getUnreadCount);

// Marcar como lida
router.patch('/:notificationId/read', notificationController.markAsRead);

// Marcar todas como lidas
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
