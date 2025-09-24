import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  validateOrderCreation,
  validateOrderId,
  validateOrderStatusUpdate,
} from '../middleware/validation.middleware.js';

const router = Router();

// Create a new order (requires authentication and validation)
router.post('/', protectRoute, validateOrderCreation, OrderController.createOrder);

// Get orders for a user (requires authentication)
router.get('/', protectRoute, OrderController.getUserOrders);

// Get order by ID (requires authentication and validation)
router.get('/:id', protectRoute, validateOrderId, OrderController.getOrderById);

// Update order status (requires authentication and validation)
router.put(
  '/:id/status',
  protectRoute,
  validateOrderId,
  validateOrderStatusUpdate,
  OrderController.updateOrderStatus,
);

export default router;
