import { Router } from 'express';
import { ProfessionalController } from '../controllers/professional.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', protectRoute, ProfessionalController.createProfessional);

// Get all professionals (with pagination) - requires authentication
router.get('/', protectRoute, ProfessionalController.getAllProfessionals);

// Get professional by ID - requires authentication
router.get('/:id', protectRoute, ProfessionalController.getProfessionalById);

// Get professional by userId - requires authentication
router.get('/by-userid/:userId', protectRoute, ProfessionalController.getProfessionalByUserId);

// Get decrypted professional profile - requires authentication
router.get('/profile/:userId', protectRoute, ProfessionalController.getProfessionalProfile);

// Update professional - requires authentication
router.put('/:id', protectRoute, ProfessionalController.updateProfessional);

// Delete professional - requires authentication
router.delete('/:id', protectRoute, ProfessionalController.deleteProfessional);

export default router;
