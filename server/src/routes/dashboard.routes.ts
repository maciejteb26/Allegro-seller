import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as listingCtrl from '../controllers/listing.controller';

const router = Router();
router.use(authMiddleware);
router.get('/dashboard/stats', listingCtrl.getDashboardStats);

export default router;
