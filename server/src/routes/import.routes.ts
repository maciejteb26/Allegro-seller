import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import { IMPORT_ALLOWED_MIMES, IMPORT_MAX_FILE_SIZE } from '../constants/import.constants';
import * as ctrl from '../controllers/import.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMPORT_MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = [...IMPORT_ALLOWED_MIMES];
    const isExcelExt = /\.(xlsx|xls|csv)$/i.test(file.originalname);
    cb(null, allowed.includes(file.mimetype as (typeof IMPORT_ALLOWED_MIMES)[number]) || isExcelExt);
  },
});

const router = Router();

router.use(authMiddleware);
router.post('/parse', upload.single('file'), ctrl.parseImport);
router.post('/enrich', ctrl.enrichImport);
router.post('/generate-seo', ctrl.generateSeo);
router.post('/publish', ctrl.publishImport);

export default router;
