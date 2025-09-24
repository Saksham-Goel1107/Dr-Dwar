import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

// Get payments for authenticated user
router.get('/', protectRoute, PaymentController.getUserPayments);

// Get payment by ID
router.get('/:id', protectRoute, PaymentController.getPaymentById);

// Update payment status
router.put('/:id/status', protectRoute, PaymentController.updatePaymentStatus);

export default router;
