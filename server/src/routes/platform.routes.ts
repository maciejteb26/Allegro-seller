import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as ctrl from '../controllers/platform.controller';

const router = Router();

router.get('/platforms/allegro/oauth/callback', ctrl.getAllegroOAuthCallback);

router.use(authMiddleware);

router.get('/platforms', ctrl.getPlatforms);
router.get('/platforms/:platform/test', ctrl.testPlatformConnection);
router.post('/platforms/:platform/connect', ctrl.connectPlatform);
router.delete('/platforms/:platform', ctrl.disconnectPlatform);

router.get('/platforms/allegro/oauth/start', ctrl.getAllegroOAuthStart);
router.get('/platforms/allegro/categories', ctrl.getAllegroCategories);
router.post('/platforms/allegro/mappings', ctrl.saveAllegroMappings);

export default router;
