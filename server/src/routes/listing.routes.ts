import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import { aiParserRateLimit } from '../middleware/rate-limit.middleware';
import * as ctrl from '../controllers/listing.controller';
import * as aiParserCtrl from '../controllers/ai-parser.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

router.use(authMiddleware);

router.get('/', ctrl.getListings);
router.post('/', ctrl.createListing);
router.post('/parse-input', aiParserRateLimit, aiParserCtrl.parseListingInput);
router.get('/:id/titles', ctrl.getListingTitles);
router.post('/:id/publish', ctrl.publishListing);
router.get('/:id/publish-status', ctrl.getPublishStatus);
router.get('/:id', ctrl.getListing);
router.put('/:id', ctrl.updateListing);
router.delete('/:id', ctrl.deleteListing);
router.post('/:id/duplicate', ctrl.duplicateListing);
router.post('/:id/images', upload.array('images', 20), ctrl.uploadImages);
router.delete('/:id/images/:imageId', ctrl.deleteImage);

export default router;
