import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as marginCtrl from '../controllers/margin.controller';
import * as settingsCtrl from '../controllers/settings.controller';

const router = Router();
router.use(authMiddleware);

router.get('/settings/margins', marginCtrl.getMargins);
router.put('/settings/margins', marginCtrl.saveMargins);
router.put('/settings/password', settingsCtrl.changePassword);

export default router;
