import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

// === USER ROUTES ===
// Get available doctors with their fees and availability
router.get('/doctors', protectRoute, AppointmentController.getAvailableDoctors);

// Get specific doctor's availability and fees
router.get('/doctors/:professionalId', protectRoute, AppointmentController.getDoctorDetails);

// Book an appointment
router.post('/book', protectRoute, AppointmentController.bookAppointment);

// Get user's appointments
router.get('/my-appointments', protectRoute, AppointmentController.getUserAppointments);

// Cancel appointment (user)
router.patch('/:appointmentId/cancel', protectRoute, AppointmentController.cancelAppointment);

// === DOCTOR ROUTES ===
// Get doctor's appointments
router.get('/doctor/appointments', protectRoute, AppointmentController.getDoctorAppointments);

// Schedule appointment (doctor)
router.post('/schedule', protectRoute, AppointmentController.scheduleAppointment);

// Update appointment status (doctor)
router.patch(
  '/doctor/:appointmentId/status',
  protectRoute,
  AppointmentController.updateAppointmentStatus,
);

// Alias route for frontend compatibility
router.put('/:appointmentId/status', protectRoute, AppointmentController.updateAppointmentStatus);

// Reschedule appointment (doctor)
router.put('/:appointmentId/reschedule', protectRoute, AppointmentController.rescheduleAppointment);

// Get doctor stats
router.get('/doctor/stats', protectRoute, AppointmentController.getDoctorStats);

// Set doctor availability
router.post('/doctor/availability', protectRoute, AppointmentController.setDoctorAvailability);

// Get doctor availability
router.get('/doctor/availability', protectRoute, AppointmentController.getDoctorAvailability);

// Alias routes for frontend compatibility
router.get('/availability', protectRoute, AppointmentController.getDoctorAvailability);
router.put('/availability', protectRoute, AppointmentController.setDoctorAvailability);

// Update doctor fees
router.post('/doctor/fees', protectRoute, AppointmentController.setDoctorFees);

// Get doctor fees
router.get('/doctor/fees', protectRoute, AppointmentController.getDoctorFees);

// Alias routes for frontend compatibility
router.get('/fees', protectRoute, AppointmentController.getDoctorFees);
router.put('/fees', protectRoute, AppointmentController.setDoctorFees);

export default router;
