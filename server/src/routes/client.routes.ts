import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as ctrl from '../controllers/client.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', ctrl.listClients);
router.get('/active', ctrl.getActiveClient);
router.post('/', ctrl.createClient);
router.put('/active/:id', ctrl.setActiveClient);
router.put('/:id', ctrl.updateClient);
router.delete('/:id', ctrl.deleteClient);

export default router;
