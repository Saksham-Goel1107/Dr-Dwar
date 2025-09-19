import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { protectRoute } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protectRoute, UserController.createUser);

// Get all users (with pagination) - requires authentication
router.get('/', protectRoute, UserController.getAllUsers);

// Get user by ID - requires authentication
router.get('/:id', protectRoute, UserController.getUserById);

// Get user by userId - requires authentication
router.get('/by-userid/:userId', protectRoute, UserController.getUserByUserId);

// Update user - requires authentication
router.put('/:id', protectRoute, UserController.updateUser);

// Delete user - requires authentication
router.delete('/:id', protectRoute, UserController.deleteUser);

export default router;
