/**
 * Central router composing auth, admin, and me routes.
 * Routes import controllers and apply middleware where needed.
 */
import { Router } from 'express';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import meRoutes from './me.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/me', meRoutes);

export default router;
