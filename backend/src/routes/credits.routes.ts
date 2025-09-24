import { Router } from 'express';
import { CreditsController } from '../controllers/credits.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

// Get user's credit balance
router.get('/balance', protectRoute, CreditsController.getCreditBalance);

// Add credits after payment success
router.post('/add', protectRoute, CreditsController.addCredits);

// Get credit transaction history
router.get('/history', protectRoute, CreditsController.getCreditHistory);

export default router;
