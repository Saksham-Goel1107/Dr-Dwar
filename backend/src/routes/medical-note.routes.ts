import { Router } from 'express';
import { MedicalNoteController } from '../controllers/medical-note.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

// All medical note routes require authentication
router.use(protectRoute);

// Create a new medical note
router.post('/', MedicalNoteController.createMedicalNote);

// Get medical notes for a patient
router.get('/patient/:patientId', MedicalNoteController.getPatientMedicalNotes);

// Get medical notes for an appointment
router.get('/appointment/:appointmentId', MedicalNoteController.getAppointmentMedicalNotes);

// Get a specific medical note
router.get('/:id', MedicalNoteController.getMedicalNote);

// Update a medical note
router.put('/:id', MedicalNoteController.updateMedicalNote);

// Archive a medical note
router.delete('/:id', MedicalNoteController.archiveMedicalNote);

export default router;
