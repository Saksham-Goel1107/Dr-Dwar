import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();

// Create a new user
router.post('/', UserController.createUser);

// Get all users (with pagination)
router.get('/', UserController.getAllUsers);

// Get user by ID
router.get('/:id', UserController.getUserById);

// Get user by userId
router.get('/by-userid/:userId', UserController.getUserByUserId);

// Update user
router.put('/:id', UserController.updateUser);

// Delete user
router.delete('/:id', UserController.deleteUser);

export default router;
