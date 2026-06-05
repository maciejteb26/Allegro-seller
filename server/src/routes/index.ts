import { Router } from 'express';
import authRoutes from './auth.routes';
import listingRoutes from './listing.routes';
import categoryRoutes from './category.routes';
import platformRoutes from './platform.routes';
import settingsRoutes from './settings.routes';
import orderRoutes from './order.routes';
import dashboardRoutes from './dashboard.routes';
import importRoutes from './import.routes';
import clientRoutes from './client.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/listings', listingRoutes);
router.use('/imports', importRoutes);
router.use(categoryRoutes);
router.use(platformRoutes);
router.use(settingsRoutes);
router.use(orderRoutes);
router.use(dashboardRoutes);

export default router;
