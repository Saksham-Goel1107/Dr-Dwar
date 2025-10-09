import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export class MedicalNoteController {
  // Create a new medical note
  static createMedicalNote = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { patientId, appointmentId, noteType, title, content, isPrivate = false } = req.body;

    // Validate required fields
    if (!patientId || !noteType || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, note type, title, and content are required',
      });
    }

    // Check if user is a verified doctor
    const doctor = await prisma.professional.findUnique({
      where: { userId: auth.userId },
    });

    if (!doctor || doctor.role !== 'Doctor' || !doctor.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Only verified doctors can create medical notes',
      });
    }

    // Check if appointment exists and belongs to the doctor (if appointmentId provided)
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }

      if (appointment.professionalId !== doctor.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only create notes for your own appointments',
        });
      }
    }

    const medicalNote = await prisma.medicalNote.create({
      data: {
        patientId,
        doctorId: doctor.id,
        appointmentId,
        noteType,
        title,
        content,
        isPrivate,
      },
      include: {
        doctor: {
          select: {
            userName: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        appointment: {
          select: {
            scheduledDate: true,
            appointmentType: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Medical note created successfully',
      data: medicalNote,
    });
  });

  // Get medical notes for a patient
  static getPatientMedicalNotes = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { patientId } = req.params;
    const { page = 1, limit = 10, noteType, includePrivate = false } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Check if user is a doctor or the patient themselves
    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
    });

    const isDoctor = !!professional && professional.role === 'Doctor' && professional.isVerified;
    const isPatient = patientId === auth.userId;

    if (!isDoctor && !isPatient) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Build where clause
    const where: any = {
      patientId,
      status: 'ACTIVE',
    };

    // Filter by note type if provided
    if (noteType) {
      where.noteType = noteType;
    }

    // If user is patient, don't show private notes unless they are the author
    if (isPatient && !includePrivate) {
      where.OR = [{ isPrivate: false }, { doctor: { userId: auth.userId } }];
    }
    // If user is doctor, show all notes for patients they treated
    else if (isDoctor) {
      // Doctors can see all notes for their patients
    }

    const medicalNotes = await prisma.medicalNote.findMany({
      where,
      include: {
        doctor: {
          select: {
            userName: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        appointment: {
          select: {
            id: true,
            scheduledDate: true,
            appointmentType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(limit),
    });

    const total = await prisma.medicalNote.count({ where });

    res.json({
      success: true,
      data: medicalNotes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  });

  // Get a specific medical note
  static getMedicalNote = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const medicalNote = await prisma.medicalNote.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            userName: true,
            firstName: true,
            lastName: true,
            specialization: true,
            medicalLicenseNumber: true,
          },
        },
        patient: {
          select: {
            userName: true,
            phoneNumber: true,
          },
        },
        appointment: {
          select: {
            id: true,
            scheduledDate: true,
            appointmentType: true,
          },
        },
      },
    });

    if (!medicalNote) {
      return res.status(404).json({
        success: false,
        message: 'Medical note not found',
      });
    }

    // Check access permissions
    const isPatient = medicalNote.patientId === auth.userId;
    const isDoctor = medicalNote.doctor.userId === auth.userId;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // If note is private and user is not the doctor who created it
    if (medicalNote.isPrivate && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to private note',
      });
    }

    res.json({
      success: true,
      data: medicalNote,
    });
  });

  // Update a medical note
  static updateMedicalNote = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { title, content, noteType, isPrivate } = req.body;

    const medicalNote = await prisma.medicalNote.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!medicalNote) {
      return res.status(404).json({
        success: false,
        message: 'Medical note not found',
      });
    }

    if (medicalNote.doctor.userId !== auth.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own medical notes',
      });
    }

    const updatedNote = await prisma.medicalNote.update({
      where: { id },
      data: {
        title: title || medicalNote.title,
        content: content || medicalNote.content,
        noteType: noteType || medicalNote.noteType,
        isPrivate: isPrivate !== undefined ? isPrivate : medicalNote.isPrivate,
      },
      include: {
        doctor: {
          select: {
            userName: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        appointment: {
          select: {
            scheduledDate: true,
            appointmentType: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Medical note updated successfully',
      data: updatedNote,
    });
  });

  // Delete/Archive a medical note
  static archiveMedicalNote = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const medicalNote = await prisma.medicalNote.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!medicalNote) {
      return res.status(404).json({
        success: false,
        message: 'Medical note not found',
      });
    }

    if (medicalNote.doctor.userId !== auth.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only archive your own medical notes',
      });
    }

    await prisma.medicalNote.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    res.json({
      success: true,
      message: 'Medical note archived successfully',
    });
  });

  // Get medical notes by appointment
  static getAppointmentMedicalNotes = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { appointmentId } = req.params;

    // Check if appointment exists and user has access
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        professional: true,
        user: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const isDoctor = appointment.professional.userId === auth.userId;
    const isPatient = appointment.userId === auth.userId;

    if (!isDoctor && !isPatient) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const medicalNotes = await prisma.medicalNote.findMany({
      where: {
        appointmentId,
        status: 'ACTIVE',
        OR: isPatient ? [{ isPrivate: false }, { doctor: { userId: auth.userId } }] : undefined,
      },
      include: {
        doctor: {
          select: {
            userName: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      success: true,
      data: medicalNotes,
    });
  });
}
