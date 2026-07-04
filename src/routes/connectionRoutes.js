const { Router } = require('express');
const connectionController = require('../controllers/ConnectionController');
const authMiddleware = require('../middlewares/auth');

const router = Router();

router.use(authMiddleware);

// Listar conexões do usuário
router.get('/', connectionController.getConnections);

// Solicitações pendentes recebidas
router.get('/pending', connectionController.getPendingRequests);

// Enviar solicitação
router.post('/:userId', connectionController.sendRequest);

// Aceitar solicitação
router.patch('/:connectionId/accept', connectionController.acceptRequest);

// Remover conexão
router.delete('/:connectionId', connectionController.removeConnection);

module.exports = router;
