import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export class PrescriptionController {
  // Create a new prescription for an appointment
  static createPrescription = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { appointmentId, diagnosis, notes, medicines } = req.body;

    // Validate required fields
    if (!appointmentId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and at least one medicine are required',
      });
    }

    // Check if appointment exists and belongs to the doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { professional: true },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.professional.userId !== auth.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create prescriptions for your own appointments',
      });
    }

    // Check if appointment is completed
    if (appointment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Prescription can only be created for completed appointments',
      });
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await prisma.prescription.findUnique({
      where: { appointmentId },
    });

    if (existingPrescription) {
      return res.status(400).json({
        success: false,
        message: 'Prescription already exists for this appointment',
      });
    }

    // Validate medicines
    for (const medicine of medicines) {
      if (!medicine.medicineName || !medicine.dosage || !medicine.frequency || !medicine.duration) {
        return res.status(400).json({
          success: false,
          message: 'Each medicine must have name, dosage, frequency, and duration',
        });
      }
    }

    // Create prescription with medicines in a transaction
    const prescription = await prisma.$transaction(async (tx) => {
      const newPrescription = await tx.prescription.create({
        data: {
          appointmentId,
          patientId: appointment.userId,
          doctorId: appointment.professionalId,
          diagnosis,
          notes,
          medicines: {
            create: medicines.map((medicine: any) => ({
              medicineName: medicine.medicineName,
              dosage: medicine.dosage,
              frequency: medicine.frequency,
              duration: medicine.duration,
              instructions: medicine.instructions,
              quantity: medicine.quantity,
            })),
          },
        },
        include: {
          medicines: true,
          doctor: {
            select: {
              userName: true,
              firstName: true,
              lastName: true,
              specialization: true,
            },
          },
        },
      });

      // Update appointment with prescription ID
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { prescriptionId: newPrescription.id },
      });

      return newPrescription;
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription,
    });
  });

  // Get prescription by ID
  static getPrescription = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        medicines: true,
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
            scheduledDate: true,
            appointmentType: true,
          },
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    // Check if user has access (patient or doctor)
    const isPatient = prescription.patientId === auth.userId;
    const isDoctor = prescription.doctorId === auth.userId;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: prescription,
    });
  });

  // Get prescriptions for a patient (for doctors) or by patient (for patients)
  static getPatientPrescriptions = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Check if user is a doctor or the patient themselves
    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
    });

    const isDoctor = !!professional;
    const isPatient = patientId === auth.userId;

    if (!isDoctor && !isPatient) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId,
        status: 'ACTIVE',
      },
      include: {
        medicines: true,
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(limit),
    });

    const total = await prisma.prescription.count({
      where: {
        patientId,
        status: 'ACTIVE',
      },
    });

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  });

  // Update prescription
  static updatePrescription = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { diagnosis, notes, medicines, status } = req.body;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    if (prescription.doctor.userId !== auth.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own prescriptions',
      });
    }

    const updatedPrescription = await prisma.$transaction(async (tx) => {
      // Update prescription
      const updated = await tx.prescription.update({
        where: { id },
        data: {
          diagnosis,
          notes,
          status: status || prescription.status,
        },
      });

      // Update medicines if provided
      if (medicines && Array.isArray(medicines)) {
        // Delete existing medicines
        await tx.prescriptionMedicine.deleteMany({
          where: { prescriptionId: id },
        });

        // Create new medicines
        await tx.prescriptionMedicine.createMany({
          data: medicines.map((medicine: any) => ({
            prescriptionId: id,
            medicineName: medicine.medicineName,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            duration: medicine.duration,
            instructions: medicine.instructions,
            quantity: medicine.quantity,
          })),
        });
      }

      return await tx.prescription.findUnique({
        where: { id },
        include: {
          medicines: true,
          doctor: {
            select: {
              userName: true,
              firstName: true,
              lastName: true,
              specialization: true,
            },
          },
        },
      });
    });

    res.json({
      success: true,
      message: 'Prescription updated successfully',
      data: updatedPrescription,
    });
  });

  // Delete/Cancel prescription
  static cancelPrescription = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    if (prescription.doctor.userId !== auth.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own prescriptions',
      });
    }

    await prisma.prescription.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json({
      success: true,
      message: 'Prescription cancelled successfully',
    });
  });
}
