import { Router } from 'express';
import { ProfessionalCreditsController } from '../controllers/professional-credits.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

// Get professional's credit balance and stats
router.get('/balance', protectRoute, ProfessionalCreditsController.getCreditBalance);

// Get dashboard statistics
router.get('/dashboard', protectRoute, ProfessionalCreditsController.getDashboardStats);

// Add earnings to professional account (for internal use)
router.post('/add-earning', protectRoute, ProfessionalCreditsController.addEarning);

// Get professional's earnings history
router.get('/earnings', protectRoute, ProfessionalCreditsController.getEarningsHistory);

// Bank account management
router.post('/bank-account', protectRoute, ProfessionalCreditsController.saveBankAccount);
router.get('/bank-account', protectRoute, ProfessionalCreditsController.getBankAccount);

// Withdrawal requests
router.post('/withdraw', protectRoute, ProfessionalCreditsController.createWithdrawalRequest);
router.get('/withdrawals', protectRoute, ProfessionalCreditsController.getWithdrawalHistory);

export default router;
