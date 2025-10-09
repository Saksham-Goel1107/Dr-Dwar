import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export class AppointmentController {
  // Check slot availability for booking
  static checkSlotAvailability = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { professionalId, date, slots } = req.body;

    if (!professionalId || !date || !slots) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: professionalId, date, and slots are required',
      });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    // Get existing appointments for this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        scheduledDate: dateObj,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Check which slots are booked
    const bookedSlots = slots.filter((slot: string) => {
      return existingAppointments.some((appointment) => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotTime = slotHour * 60 + slotMinute;

        const [aptStartHour, aptStartMinute] = appointment.startTime.split(':').map(Number);
        const [aptEndHour, aptEndMinute] = appointment.endTime.split(':').map(Number);
        const aptStart = aptStartHour * 60 + aptStartMinute;
        const aptEnd = aptEndHour * 60 + aptEndMinute;

        return slotTime >= aptStart && slotTime < aptEnd;
      });
    });

    res.json({
      success: true,
      data: {
        bookedSlots,
        availableSlots: slots.filter((slot: string) => !bookedSlots.includes(slot)),
      },
    });
  });

  // Get available doctors with their fees and basic availability
  static getAvailableDoctors = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const doctors = await prisma.professional.findMany({
      where: {
        isVerified: true,
        role: 'Doctor',
        fees: {
          isActive: true,
        },
      },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        specialization: true,
        subSpecialization: true,
        yearsOfExperience: true,
        hospitalAffiliation: true,
        currentPosition: true,
        fees: {
          select: {
            consultationFee: true,
            followUpFee: true,
            emergencyFee: true,
            telemedicineFee: true,
          },
        },
        availability: {
          where: { isActive: true },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
        _count: {
          select: {
            appointments: {
              where: {
                status: 'COMPLETED',
              },
            },
          },
        },
      },
    });

    const formattedDoctors = doctors.map((doctor) => ({
      id: doctor.id,
      name: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Dr. Unknown',
      specialization: doctor.specialization,
      subSpecialization: doctor.subSpecialization,
      experience: doctor.yearsOfExperience,
      hospital: doctor.hospitalAffiliation,
      position: doctor.currentPosition,
      fees: doctor.fees,
      availability: doctor.availability,
      completedAppointments: doctor._count.appointments,
    }));

    res.json({
      success: true,
      data: formattedDoctors,
    });
  });

  // Get specific doctor's details including availability and fees
  static getDoctorDetails = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { professionalId } = req.params;

    const doctor = await prisma.professional.findUnique({
      where: { id: professionalId, isVerified: true, role: 'Doctor' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        subSpecialization: true,
        yearsOfExperience: true,
        medicalLicenseNumber: true,
        hospitalAffiliation: true,
        currentPosition: true,
        mbbsDegreeFrom: true,
        mbbsCompletionYear: true,
        mdDegreeFrom: true,
        mdCompletionYear: true,
        fees: true,
        availability: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: {
          select: {
            appointments: {
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: doctor.id,
        name: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Dr. Unknown',
        specialization: doctor.specialization,
        subSpecialization: doctor.subSpecialization,
        experience: doctor.yearsOfExperience,
        license: doctor.medicalLicenseNumber,
        hospital: doctor.hospitalAffiliation,
        position: doctor.currentPosition,
        education: {
          mbbs: doctor.mbbsDegreeFrom
            ? `${doctor.mbbsDegreeFrom} (${doctor.mbbsCompletionYear})`
            : null,
          md: doctor.mdDegreeFrom ? `${doctor.mdDegreeFrom} (${doctor.mdCompletionYear})` : null,
        },
        fees: doctor.fees,
        availability: doctor.availability,
        completedAppointments: doctor._count.appointments,
      },
    });
  });

  // Book an appointment
  static bookAppointment = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { professionalId, appointmentType, scheduledDate, startTime, symptoms, notes } = req.body;

    // === COMPREHENSIVE VALIDATION ===

    // 1. Validate required fields
    if (!professionalId || !appointmentType || !scheduledDate || !startTime) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: professionalId, appointmentType, scheduledDate, and startTime are required',
      });
    }

    // 2. Validate appointment type
    const validAppointmentTypes = [
      'CONSULTATION',
      'FOLLOW_UP',
      'EMERGENCY',
      'TELEMEDICINE',
      'HOME_VISIT',
    ];
    if (!validAppointmentTypes.includes(appointmentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid appointment type. Must be one of: ${validAppointmentTypes.join(', ')}`,
      });
    }

    // 3. Validate and parse date
    const appointmentDate = new Date(scheduledDate);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please provide a valid date.',
      });
    }

    // 4. Date range validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90); // Max 90 days in advance

    if (appointmentDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments in the past',
      });
    }

    if (appointmentDate > maxDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments more than 90 days in advance',
      });
    }

    // 5. Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Please use HH:MM format (24-hour).',
      });
    }

    // 6. Validate symptoms and notes length
    if (symptoms && symptoms.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms description cannot exceed 1000 characters',
      });
    }

    if (notes && notes.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Notes cannot exceed 500 characters',
      });
    }

    // === DOCTOR VALIDATION ===

    // 7. Check if doctor exists and is verified
    const doctor = await prisma.professional.findUnique({
      where: { id: professionalId, isVerified: true, role: 'Doctor' },
      include: {
        fees: true,
        availability: {
          where: { isActive: true },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not verified',
      });
    }

    // 8. Check if doctor has fees configured
    if (!doctor.fees) {
      return res.status(400).json({
        success: false,
        message: 'Doctor has not configured consultation fees yet',
      });
    }

    // 9. Check if doctor has availability configured
    if (!doctor.availability || doctor.availability.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Doctor has not set up availability schedule yet',
      });
    }

    // === TIME AND AVAILABILITY VALIDATION ===

    // 10. Check if the appointment day matches doctor's availability
    const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayAvailability = doctor.availability.find((slot) => slot.dayOfWeek === dayOfWeek);

    if (!dayAvailability) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${appointmentDate.toLocaleDateString('en-US', { weekday: 'long' })}`,
      });
    }

    // 11. Check if appointment time is within doctor's working hours
    const [appointmentHour, appointmentMinute] = startTime.split(':').map(Number);
    const appointmentTimeMinutes = appointmentHour * 60 + appointmentMinute;

    const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
    const startTimeMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);
    const endTimeMinutes = endHour * 60 + endMinute;

    if (appointmentTimeMinutes < startTimeMinutes || appointmentTimeMinutes >= endTimeMinutes) {
      return res.status(400).json({
        success: false,
        message: `Appointment time must be between ${dayAvailability.startTime} and ${dayAvailability.endTime}`,
      });
    }

    // 12. Calculate appointment duration and end time based on appointment type
    let durationMinutes = 30; // Default
    switch (appointmentType) {
      case 'FOLLOW_UP':
        durationMinutes = 15;
        break;
      case 'EMERGENCY':
        durationMinutes = 60;
        break;
      case 'TELEMEDICINE':
        durationMinutes = 20;
        break;
      case 'HOME_VISIT':
        durationMinutes = 45;
        break;
    }

    const endTimeMinutesTotal = appointmentTimeMinutes + durationMinutes;
    if (endTimeMinutesTotal > endTimeMinutes) {
      return res.status(400).json({
        success: false,
        message: `Appointment would end after doctor's available time. Please choose an earlier slot.`,
      });
    }

    const endHourCalc = Math.floor(endTimeMinutesTotal / 60);
    const endMinuteCalc = endTimeMinutesTotal % 60;
    const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteCalc.toString().padStart(2, '0')}`;

    // === FEE CALCULATION ===

    // 13. Determine fee based on appointment type
    let fee = doctor.fees.consultationFee;
    switch (appointmentType) {
      case 'FOLLOW_UP':
        fee = doctor.fees.followUpFee || doctor.fees.consultationFee;
        break;
      case 'EMERGENCY':
        fee = doctor.fees.emergencyFee || doctor.fees.consultationFee * 2;
        break;
      case 'TELEMEDICINE':
        fee = doctor.fees.telemedicineFee || doctor.fees.consultationFee;
        break;
      case 'HOME_VISIT':
        fee = doctor.fees.homeVisitFee || doctor.fees.consultationFee * 1.5;
        break;
    }

    if (fee <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fee configuration for this appointment type',
      });
    }

    // === USER VALIDATION ===

    // 14. Check if user exists and has enough credits
    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
      select: { credits: true, userId: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.credits < fee) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. You have ${user.credits} credits but need ${fee} credits for this appointment.`,
      });
    }

    // === SLOT AVAILABILITY CHECK ===

    // 15. Check for conflicting appointments (including buffer time)
    const bufferMinutes = 5; // 5-minute buffer between appointments
    const appointmentStartWithBuffer = new Date(appointmentDate);
    appointmentStartWithBuffer.setHours(appointmentHour, appointmentMinute - bufferMinutes, 0, 0);

    const appointmentEndWithBuffer = new Date(appointmentDate);
    appointmentEndWithBuffer.setHours(endHourCalc, endMinuteCalc + bufferMinutes, 0, 0);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        professionalId,
        scheduledDate: appointmentDate,
        OR: [
          {
            AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }],
          },
          {
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [{ startTime: { gte: startTime } }, { startTime: { lt: endTime } }],
          },
        ],
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose a different time.',
      });
    }

    // === BUSINESS RULES ===

    // 16. Check for maximum appointments per day per user with same doctor
    const userAppointmentsToday = await prisma.appointment.count({
      where: {
        userId: auth.userId,
        professionalId,
        scheduledDate: appointmentDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (userAppointmentsToday >= 2) {
      return res.status(400).json({
        success: false,
        message: 'You can only book up to 2 appointments with the same doctor per day.',
      });
    }

    // 17. Check for emergency appointment restrictions
    if (appointmentType === 'EMERGENCY') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const emergencyAppointmentsToday = await prisma.appointment.count({
        where: {
          userId: auth.userId,
          appointmentType: 'EMERGENCY',
          scheduledDate: { gte: today },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (emergencyAppointmentsToday >= 1) {
        return res.status(400).json({
          success: false,
          message: 'You can only have one active emergency appointment at a time.',
        });
      }
    }

    // === CREATE APPOINTMENT ===

    // 18. Create the appointment
    try {
      const appointment = await prisma.appointment.create({
        data: {
          userId: auth.userId,
          professionalId,
          appointmentType,
          scheduledDate: appointmentDate,
          startTime,
          endTime,
          symptoms: symptoms || null,
          notes: notes || null,
          fee,
          status: 'PENDING', // All new appointments start as pending
        },
      });

      // 19. Deduct credits from user (consider implementing this after confirmation)
      // For now, we'll deduct immediately, but in production you might want to hold credits
      await prisma.user.update({
        where: { userId: auth.userId },
        data: { credits: { decrement: fee } },
      });

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully. Please wait for doctor confirmation.',
        data: {
          appointmentId: appointment.id,
          scheduledDate: appointment.scheduledDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          fee: appointment.fee,
          status: appointment.status,
          doctorName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Dr. Unknown',
        },
      });
    } catch (error) {
      console.error('Database error in bookAppointment:', error);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.',
      });
    }
  });

  // Get user's appointments
  static getUserAppointments = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    try {
      const appointments = await prisma.appointment.findMany({
        where: { userId: auth.userId },
        include: {
          professional: {
            select: {
              firstName: true,
              lastName: true,
              specialization: true,
              hospitalAffiliation: true,
            },
          },
        },
        orderBy: { scheduledDate: 'desc' },
      });

      res.json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      console.error('Database error in getUserAppointments:', error);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.',
      });
    }
  });

  // Cancel appointment (user)
  static cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId: auth.userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or cannot be cancelled',
      });
    }

    // Check if appointment is within 24 hours
    const now = new Date();
    const appointmentTime = new Date(appointment.scheduledDate);
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    appointmentTime.setHours(hours, minutes, 0, 0);

    const hoursDifference = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel appointment less than 24 hours before scheduled time',
      });
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  });

  // Get doctor's appointments
  static getDoctorAppointments = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: { professionalId: professional.id },
      include: {
        user: {
          select: {
            userName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });

    // Format appointments for frontend
    const formattedAppointments = appointments.map((appointment) => {
      // Calculate duration from startTime and endTime
      const startTime = appointment.startTime.split(':');
      const endTime = appointment.endTime.split(':');
      const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
      const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
      const duration = endMinutes - startMinutes;

      return {
        id: appointment.id,
        userId: appointment.userId, // Add userId for patient profile access
        patientName: appointment.user.userName,
        patientPhone: appointment.user.phoneNumber,
        patientEmail: appointment.user.email,
        appointmentDate: appointment.scheduledDate.toISOString().split('T')[0], // YYYY-MM-DD format
        appointmentTime: appointment.startTime,
        appointmentType: appointment.appointmentType.toLowerCase(),
        status: appointment.status.toLowerCase(),
        fee: appointment.fee,
        duration: duration,
        notes: appointment.notes || appointment.symptoms,
      };
    });

    res.json({
      success: true,
      data: formattedAppointments,
    });
  });

  // Get appointments for a specific patient (for doctors to view patient history)
  static getPatientAppointments = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Patient userId is required',
      });
    }

    // Verify that the requester is a doctor
    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true, role: true },
    });

    if (!professional || professional.role !== 'Doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access patient appointment history',
      });
    }

    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          userId: userId,
          professionalId: professional.id, // Only show appointments with this doctor
        },
        include: {
          professional: {
            select: {
              firstName: true,
              lastName: true,
              specialization: true,
              hospitalAffiliation: true,
            },
          },
        },
        orderBy: { scheduledDate: 'desc' },
      });

      // Format appointments for frontend
      const formattedAppointments = appointments.map((appointment) => {
        // Calculate duration from startTime and endTime
        const startTime = appointment.startTime.split(':');
        const endTime = appointment.endTime.split(':');
        const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
        const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
        const duration = endMinutes - startMinutes;

        return {
          id: appointment.id,
          appointmentDate: appointment.scheduledDate.toISOString().split('T')[0], // YYYY-MM-DD format
          appointmentTime: appointment.startTime,
          appointmentType: appointment.appointmentType.toLowerCase(),
          status: appointment.status.toLowerCase(),
          fee: appointment.fee,
          duration: duration,
          notes: appointment.notes || appointment.symptoms,
          doctorName: `${appointment.professional.firstName} ${appointment.professional.lastName}`,
          specialization: appointment.professional.specialization,
        };
      });

      res.json({
        success: true,
        data: formattedAppointments,
      });
    } catch (error) {
      console.error('Database error in getPatientAppointments:', error);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.',
      });
    }
  });

  // Schedule appointment (doctor)
  static scheduleAppointment = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const {
      patientName,
      patientPhone,
      patientEmail,
      appointmentDate,
      appointmentTime,
      appointmentType,
      duration,
      fee,
      notes,
    } = req.body;

    // === COMPREHENSIVE VALIDATION ===

    // 1. Validate required fields
    if (!patientName || !patientPhone || !appointmentDate || !appointmentTime || !appointmentType) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: patientName, patientPhone, appointmentDate, appointmentTime, and appointmentType are required',
      });
    }

    // 2. Validate appointment type
    const validAppointmentTypes = ['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'TELEMEDICINE'];
    const upperAppointmentType = appointmentType.toUpperCase();
    if (!validAppointmentTypes.includes(upperAppointmentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid appointment type. Must be one of: ${validAppointmentTypes.join(', ')}`,
      });
    }

    // 3. Validate and parse date
    const appointmentDateObj = new Date(appointmentDate);
    if (isNaN(appointmentDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please provide a valid date.',
      });
    }

    // 4. Date range validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90); // Max 90 days in advance

    if (appointmentDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule appointments in the past',
      });
    }

    if (appointmentDateObj > maxDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule appointments more than 90 days in advance',
      });
    }

    // 5. Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(appointmentTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Please use HH:MM format (24-hour).',
      });
    }

    // 6. Validate phone number
    if (!/^\d{10}$/.test(patientPhone.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number.',
      });
    }

    // 7. Validate email if provided
    if (patientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    // === DOCTOR VALIDATION ===

    // 8. Get doctor info
    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    // === TIME AND AVAILABILITY VALIDATION ===

    // 9. Check doctor's availability for the selected date and time
    const dayOfWeek = appointmentDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const doctorAvailability = await prisma.doctorAvailability.findFirst({
      where: {
        professionalId: professional.id,
        dayOfWeek: dayOfWeek,
        isActive: true,
      },
    });

    if (!doctorAvailability) {
      return res.status(400).json({
        success: false,
        message: `You are not available on ${appointmentDateObj.toLocaleDateString('en-US', { weekday: 'long' })}`,
      });
    }

    // 10. Check if appointment time is within doctor's working hours
    const [appointmentHour, appointmentMinute] = appointmentTime.split(':').map(Number);
    const appointmentTimeMinutes = appointmentHour * 60 + appointmentMinute;

    const [startHour, startMinute] = doctorAvailability.startTime.split(':').map(Number);
    const startTimeMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = doctorAvailability.endTime.split(':').map(Number);
    const endTimeMinutes = endHour * 60 + endMinute;

    if (appointmentTimeMinutes < startTimeMinutes || appointmentTimeMinutes >= endTimeMinutes) {
      return res.status(400).json({
        success: false,
        message: `Appointment time must be between ${doctorAvailability.startTime} and ${doctorAvailability.endTime}`,
      });
    }

    // 11. Calculate end time based on duration
    const appointmentDuration = duration || 30; // Default 30 minutes
    const endTimeMinutesTotal = appointmentTimeMinutes + appointmentDuration;
    if (endTimeMinutesTotal > endTimeMinutes) {
      return res.status(400).json({
        success: false,
        message: `Appointment would end after your available time. Please choose an earlier slot or shorter duration.`,
      });
    }

    const endHourCalc = Math.floor(endTimeMinutesTotal / 60);
    const endMinuteCalc = endTimeMinutesTotal % 60;
    const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteCalc.toString().padStart(2, '0')}`;

    // === SLOT AVAILABILITY CHECK ===

    // 12. Check for conflicting appointments (including buffer time)
    const bufferMinutes = 5; // 5-minute buffer between appointments
    const appointmentStartWithBuffer = new Date(appointmentDateObj);
    appointmentStartWithBuffer.setHours(appointmentHour, appointmentMinute - bufferMinutes, 0, 0);

    const appointmentEndWithBuffer = new Date(appointmentDateObj);
    appointmentEndWithBuffer.setHours(endHourCalc, endMinuteCalc + bufferMinutes, 0, 0);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        professionalId: professional.id,
        scheduledDate: appointmentDateObj,
        OR: [
          {
            AND: [{ startTime: { lte: appointmentTime } }, { endTime: { gt: appointmentTime } }],
          },
          {
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [{ startTime: { gte: appointmentTime } }, { startTime: { lt: endTime } }],
          },
        ],
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose a different time.',
      });
    }

    // === CREATE PATIENT USER IF NOT EXISTS ===

    // 13. Check if patient exists by phone number, if not create a basic user account
    let patientUser = await prisma.user.findUnique({
      where: { phoneNumber: patientPhone },
      select: { userId: true, userName: true },
    });

    if (!patientUser) {
      // Create a basic user account for the patient
      const patientUserId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      patientUser = await prisma.user.create({
        data: {
          userId: patientUserId,
          userName: patientName,
          phoneNumber: patientPhone,
          email: patientEmail || null,
          role: 'User',
          credits: 0, // No credits for doctor-created patients
        },
        select: { userId: true, userName: true },
      });
    }

    // === CREATE APPOINTMENT ===

    // 14. Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: patientUser.userId,
        professionalId: professional.id,
        appointmentType: upperAppointmentType,
        scheduledDate: appointmentDateObj,
        startTime: appointmentTime,
        endTime: endTime,
        symptoms: notes || null,
        notes: notes || null,
        fee: fee || 500,
        status: 'CONFIRMED', // Doctor-scheduled appointments are auto-confirmed
      },
    });

    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully.',
      data: {
        appointmentId: appointment.id,
        patientName: patientName,
        scheduledDate: appointment.scheduledDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        fee: appointment.fee,
        status: appointment.status,
      },
    });
  });

  // Update appointment status (doctor)
  static updateAppointmentStatus = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { appointmentId } = req.params;
    const { status, notes } = req.body;

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        professionalId: professional.id,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        notes: notes ? `${appointment.notes || ''}\nDoctor: ${notes}` : appointment.notes,
      },
    });

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
    });
  });

  // Reschedule appointment (doctor)
  static rescheduleAppointment = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { appointmentId } = req.params;
    const { newDate, newTime, duration } = req.body;

    // === VALIDATION ===

    // 1. Validate required fields
    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: 'New date and time are required',
      });
    }

    // 2. Validate date format
    const appointmentDateObj = new Date(newDate);
    if (isNaN(appointmentDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please provide a valid date.',
      });
    }

    // 3. Date range validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90); // Max 90 days in advance

    if (appointmentDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule to a past date',
      });
    }

    if (appointmentDateObj > maxDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule more than 90 days in advance',
      });
    }

    // 4. Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Please use HH:MM format (24-hour).',
      });
    }

    // === DOCTOR VALIDATION ===

    // 5. Get doctor info
    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    // === APPOINTMENT VALIDATION ===

    // 6. Find the appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        professionalId: professional.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or cannot be rescheduled',
      });
    }

    // 7. Check if rescheduling to same date/time
    if (
      appointment.scheduledDate.toISOString().split('T')[0] === newDate &&
      appointment.startTime === newTime
    ) {
      return res.status(400).json({
        success: false,
        message: 'New date and time are the same as current appointment',
      });
    }

    // === TIME AND AVAILABILITY VALIDATION ===

    // 8. Check doctor's availability for the new date and time
    const dayOfWeek = appointmentDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const doctorAvailability = await prisma.doctorAvailability.findFirst({
      where: {
        professionalId: professional.id,
        dayOfWeek: dayOfWeek,
        isActive: true,
      },
    });

    if (!doctorAvailability) {
      return res.status(400).json({
        success: false,
        message: `You are not available on ${appointmentDateObj.toLocaleDateString('en-US', { weekday: 'long' })}`,
      });
    }

    // 9. Check if new time is within doctor's working hours
    const [appointmentHour, appointmentMinute] = newTime.split(':').map(Number);
    const appointmentTimeMinutes = appointmentHour * 60 + appointmentMinute;

    const [startHour, startMinute] = doctorAvailability.startTime.split(':').map(Number);
    const startTimeMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = doctorAvailability.endTime.split(':').map(Number);
    const endTimeMinutes = endHour * 60 + endMinute;

    if (appointmentTimeMinutes < startTimeMinutes || appointmentTimeMinutes >= endTimeMinutes) {
      return res.status(400).json({
        success: false,
        message: `New time must be between ${doctorAvailability.startTime} and ${doctorAvailability.endTime}`,
      });
    }

    // 10. Calculate end time based on duration
    const appointmentDuration = duration || 30; // Default 30 minutes
    const endTimeMinutesTotal = appointmentTimeMinutes + appointmentDuration;
    if (endTimeMinutesTotal > endTimeMinutes) {
      return res.status(400).json({
        success: false,
        message: `Appointment would end after your available time. Please choose an earlier slot.`,
      });
    }

    const endHourCalc = Math.floor(endTimeMinutesTotal / 60);
    const endMinuteCalc = endTimeMinutesTotal % 60;
    const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteCalc.toString().padStart(2, '0')}`;

    // === SLOT AVAILABILITY CHECK ===

    // 11. Check for conflicting appointments (including buffer time)
    const bufferMinutes = 5; // 5-minute buffer between appointments
    const appointmentStartWithBuffer = new Date(appointmentDateObj);
    appointmentStartWithBuffer.setHours(appointmentHour, appointmentMinute - bufferMinutes, 0, 0);

    const appointmentEndWithBuffer = new Date(appointmentDateObj);
    appointmentEndWithBuffer.setHours(endHourCalc, endMinuteCalc + bufferMinutes, 0, 0);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        professionalId: professional.id,
        scheduledDate: appointmentDateObj,
        OR: [
          {
            AND: [{ startTime: { lte: newTime } }, { endTime: { gt: newTime } }],
          },
          {
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [{ startTime: { gte: newTime } }, { startTime: { lt: endTime } }],
          },
        ],
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        id: { not: appointmentId }, // Exclude current appointment
      },
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose a different time.',
      });
    }

    // === RESCHEDULE APPOINTMENT ===

    // 12. Update the appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledDate: appointmentDateObj,
        startTime: newTime,
        endTime: endTime,
        notes: appointment.notes
          ? `${appointment.notes}\nRescheduled from ${appointment.scheduledDate.toISOString().split('T')[0]} ${appointment.startTime}`
          : `Rescheduled from ${appointment.scheduledDate.toISOString().split('T')[0]} ${appointment.startTime}`,
      },
    });

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: {
        appointmentId: appointment.id,
        newDate: appointmentDateObj.toISOString().split('T')[0],
        newTime: newTime,
        endTime: endTime,
      },
    });
  });

  // Set doctor availability
  static setDoctorAvailability = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { availability } = req.body; // Array of { dayOfWeek, startTime, endTime }

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    // Delete existing availability
    await prisma.doctorAvailability.deleteMany({
      where: { professionalId: professional.id },
    });

    // Create new availability
    const availabilityRecords = availability.map((slot: any) => ({
      professionalId: professional.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    await prisma.doctorAvailability.createMany({
      data: availabilityRecords,
    });

    res.json({
      success: true,
      message: 'Availability updated successfully',
    });
  });

  // Get doctor availability
  static getDoctorAvailability = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { date } = req.query;

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    if (date) {
      // Return available time slots for a specific date
      const dateObj = new Date(date as string);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format',
        });
      }

      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get doctor's availability for this day
      const availability = await prisma.doctorAvailability.findFirst({
        where: {
          professionalId: professional.id,
          dayOfWeek: dayOfWeek,
          isActive: true,
        },
      });

      if (!availability) {
        return res.json({
          success: true,
          data: [], // No availability for this day
        });
      }

      // Get existing appointments for this date
      const existingAppointments = await prisma.appointment.findMany({
        where: {
          professionalId: professional.id,
          scheduledDate: dateObj,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      });

      // Generate available time slots (30-minute intervals)
      const slots = [];
      const [startHour, startMinute] = availability.startTime.split(':').map(Number);
      const [endHour, endMinute] = availability.endTime.split(':').map(Number);

      let currentHour = startHour;
      let currentMinute = startMinute;
      let slotCount = 0;
      const maxSlots = 48; // Maximum 24 hours worth of 30-minute slots

      while (
        (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) &&
        slotCount < maxSlots
      ) {
        const slotStartTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        const slotEndHour = currentMinute + 30 >= 60 ? currentHour + 1 : currentHour;
        const slotEndMinute = (currentMinute + 30) % 60;
        const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;

        // Check if this slot conflicts with existing appointments
        const isAvailable = !existingAppointments.some((appointment) => {
          const [aptStartHour, aptStartMinute] = appointment.startTime.split(':').map(Number);
          const [aptEndHour, aptEndMinute] = appointment.endTime.split(':').map(Number);

          const slotStart = currentHour * 60 + currentMinute;
          const slotEnd = slotEndHour * 60 + slotEndMinute;
          const aptStart = aptStartHour * 60 + aptStartMinute;
          const aptEnd = aptEndHour * 60 + aptEndMinute;

          return slotStart < aptEnd && slotEnd > aptStart; // Overlap check
        });

        slots.push({
          startTime: slotStartTime,
          endTime: slotEndTime,
          available: isAvailable,
        });

        // Move to next 30-minute slot
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
        slotCount++;
      }

      res.json({
        success: true,
        data: slots,
      });
    } else {
      // Return general availability (all days)
      const availability = await prisma.doctorAvailability.findMany({
        where: { professionalId: professional.id },
        orderBy: { dayOfWeek: 'asc' },
      });

      res.json({
        success: true,
        data: availability,
      });
    }
  });

  // Set doctor fees
  static setDoctorFees = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { consultationFee, followUpFee, emergencyFee, telemedicineFee, homeVisitFee } = req.body;

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    await prisma.doctorFees.upsert({
      where: { professionalId: professional.id },
      update: {
        consultationFee,
        followUpFee,
        emergencyFee,
        telemedicineFee,
        homeVisitFee,
      },
      create: {
        professionalId: professional.id,
        consultationFee,
        followUpFee,
        emergencyFee,
        telemedicineFee,
        homeVisitFee,
      },
    });

    res.json({
      success: true,
      message: 'Fees updated successfully',
    });
  });

  // Get doctor fees
  static getDoctorFees = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    const fees = await prisma.doctorFees.findUnique({
      where: { professionalId: professional.id },
    });

    res.json({
      success: true,
      data: fees,
    });
  });

  // Get doctor stats
  static getDoctorStats = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get appointment counts
    const [totalAppointments, todayAppointments, pendingConfirmations] = await Promise.all([
      prisma.appointment.count({
        where: { professionalId: professional.id },
      }),
      prisma.appointment.count({
        where: {
          professionalId: professional.id,
          scheduledDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          professionalId: professional.id,
          status: 'PENDING',
        },
      }),
    ]);

    // Calculate total earnings from completed appointments
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        professionalId: professional.id,
        status: 'COMPLETED',
      },
      select: { fee: true },
    });

    const totalEarnings = completedAppointments.reduce((sum, apt) => sum + apt.fee, 0);

    res.json({
      success: true,
      data: {
        totalAppointments,
        todayAppointments,
        pendingConfirmations,
        totalEarnings,
      },
    });
  });
}
