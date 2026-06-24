import { Router } from 'express';
import { servePublicImage } from '../controllers/public-image.controller';

const router = Router();

router.get('/images/:imageId', servePublicImage);

export default router;
