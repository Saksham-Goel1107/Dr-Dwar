import { Router } from 'express';
import { VersionController } from '../controllers/version.controller.js';

const router = Router();

// Get latest app version
router.get('/app', VersionController.getLatestAppVersion);

export default router;
