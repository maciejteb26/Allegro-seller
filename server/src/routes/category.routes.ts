import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as ctrl from '../controllers/category.controller';

const router = Router();

router.use(authMiddleware);

router.get('/categories', ctrl.getCategories);
router.get('/categories/mappings', ctrl.getCategoryMappings);
router.get('/vehicles/makes', ctrl.getVehicleMakes);
router.get('/vehicles/makes/:makeId/models', ctrl.getVehicleModels);
router.get('/vehicles/models/:modelId/generations', ctrl.getVehicleGenerations);

export default router;
