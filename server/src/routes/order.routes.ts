import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as orderCtrl from '../controllers/order.controller';

const router = Router();
router.use(authMiddleware);

router.get('/orders', orderCtrl.getOrders);

export default router;
