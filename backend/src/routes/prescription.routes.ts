import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescription.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

// All prescription routes require authentication
router.use(protectRoute);

// Create a new prescription
router.post('/', PrescriptionController.createPrescription);

// Get prescription by ID
router.get('/:id', PrescriptionController.getPrescription);

// Get prescriptions for a patient
router.get('/patient/:patientId', PrescriptionController.getPatientPrescriptions);

// Update prescription
router.put('/:id', PrescriptionController.updatePrescription);

// Cancel prescription
router.delete('/:id', PrescriptionController.cancelPrescription);

export default router;
