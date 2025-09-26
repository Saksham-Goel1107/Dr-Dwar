import CryptoJS from 'crypto-js';
import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { ENV } from '../config/env.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// Production-ready encryption using AES
const ENCRYPTION_KEY = ENV.ENCRYPTION_KEY || 'DrDwar2025SecureKey!@#DefaultKeyForDev';

const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export class ProfessionalController {
  // Create or update professional with comprehensive profile data
  static createProfessional = asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      userName,
      phoneNumber,
      email,
      role,
      // Personal Information
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      maritalStatus,
      nationality,
      aadharNumber,
      panNumber,
      // Address Information
      permanentAddressLine1,
      permanentAddressLine2,
      permanentCity,
      permanentState,
      permanentPincode,
      currentAddressLine1,
      currentAddressLine2,
      currentCity,
      currentState,
      currentPincode,
      // Family & Emergency Contact
      fatherName,
      motherName,
      spouseName,
      emergencyName,
      emergencyRelation,
      emergencyPhone,
      emergencyEmail,
      // Educational Qualifications
      educationalQualifications,
      // Professional Details - Doctors
      medicalLicenseNumber,
      licenseIssuingAuthority,
      licenseIssueDate,
      licenseExpiryDate,
      specialization,
      subSpecialization,
      yearsOfExperience,
      medicalCouncil,
      councilRegistrationNumber,
      hospitalAffiliation,
      currentPosition,
      // Professional Details - Pharmacists
      pharmacyLicenseNumber,
      pharmacyLicenseIssuingAuthority,
      pharmacyLicenseIssueDate,
      pharmacyLicenseExpiryDate,
      pharmacyName,
      pharmacyAddress,
      pharmacyOwnershipType,
      yearsOfPharmacyExperience,
      pharmacyCouncil,
      pharmacyCouncilRegistrationNumber,
      // Work Experience
      workExperience,
      // Professional Memberships
      professionalMemberships,
      // Background Check
      criminalRecord,
      criminalRecordDetails,
      malpracticeHistory,
      malpracticeDetails,
      // References
      professionalReferences,
    } = req.body;

    // Validate required fields
    if (!userId || !userName || !phoneNumber || !role) {
      return res.status(400).json({
        success: false,
        message: 'userId, userName, phoneNumber, and role are required',
      });
    }

    // Validate role
    if (!['Doctor', 'PharmaCist'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either Doctor or PharmaCist',
      });
    }

    // Validate common required fields
    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !gender ||
      !permanentAddressLine1 ||
      !permanentCity ||
      !permanentState ||
      !permanentPincode ||
      !currentAddressLine1 ||
      !currentCity ||
      !currentState ||
      !currentPincode ||
      !emergencyName ||
      !emergencyRelation ||
      !emergencyPhone
    ) {
      return res.status(400).json({
        success: false,
        message: 'All personal information, address, and emergency contact fields are required',
      });
    }

    // Validate role-specific required fields
    if (role === 'Doctor') {
      if (
        !medicalLicenseNumber ||
        !licenseIssuingAuthority ||
        !licenseIssueDate ||
        !licenseExpiryDate ||
        !specialization ||
        !yearsOfExperience ||
        !medicalCouncil ||
        !councilRegistrationNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            'For doctors: medicalLicenseNumber, licenseIssuingAuthority, licenseIssueDate, licenseExpiryDate, specialization, yearsOfExperience, medicalCouncil, and councilRegistrationNumber are required',
        });
      }
      if (yearsOfExperience < 0 || yearsOfExperience > 50) {
        return res.status(400).json({
          success: false,
          message: 'Invalid years of experience for doctor',
        });
      }
    } else if (role === 'PharmaCist') {
      if (
        !pharmacyLicenseNumber ||
        !pharmacyLicenseIssuingAuthority ||
        !pharmacyLicenseIssueDate ||
        !pharmacyLicenseExpiryDate ||
        !pharmacyName ||
        !pharmacyAddress ||
        !pharmacyOwnershipType ||
        !yearsOfPharmacyExperience ||
        !pharmacyCouncil ||
        !pharmacyCouncilRegistrationNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            'For pharmacists: pharmacyLicenseNumber, pharmacyLicenseIssuingAuthority, pharmacyLicenseIssueDate, pharmacyLicenseExpiryDate, pharmacyName, pharmacyAddress, pharmacyOwnershipType, yearsOfPharmacyExperience, pharmacyCouncil, and pharmacyCouncilRegistrationNumber are required',
        });
      }
      if (yearsOfPharmacyExperience < 0 || yearsOfPharmacyExperience > 50) {
        return res.status(400).json({
          success: false,
          message: 'Invalid years of experience for pharmacist',
        });
      }
    }

    // Validate date of birth (must be at least 18 years old)
    const dob = new Date(dateOfBirth);
    const age = new Date().getFullYear() - dob.getFullYear();
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: 'Professional must be at least 18 years old',
      });
    }

    // Validate pincode
    if (!/^\d{6}$/.test(permanentPincode) || !/^\d{6}$/.test(currentPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Pincode must be 6 digits',
      });
    }

    // Validate phone numbers
    const cleanEmergencyPhone = emergencyPhone ? emergencyPhone.replace(/\D/g, '') : '';
    if (emergencyPhone && !/^\d{10}$/.test(cleanEmergencyPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Emergency phone number must be 10 digits',
      });
    }

    // Validate Aadhar if provided
    if (aadharNumber && !/^\d{12}$/.test(aadharNumber.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar number must be 12 digits',
      });
    }

    // Validate PAN if provided
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'PAN number must be in valid format (AAAAA9999A)',
      });
    }

    // Prepare profile data for encryption (sensitive additional data)
    const additionalProfileData = {
      // Any additional sensitive data can go here
    };

    // Encrypt the additional profile data
    const encryptedProfileData = encryptData(JSON.stringify(additionalProfileData));

    // Upsert professional (create if doesn't exist, update if exists)
    const professional = await prisma.professional.upsert({
      where: { userId },
      update: {
        userName,
        phoneNumber,
        email,
        role,
        // Personal Information
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        bloodGroup,
        maritalStatus,
        nationality,
        aadharNumber,
        panNumber,
        // Address Information
        permanentAddressLine1,
        permanentAddressLine2,
        permanentCity,
        permanentState,
        permanentPincode,
        currentAddressLine1,
        currentAddressLine2,
        currentCity,
        currentState,
        currentPincode,
        // Family & Emergency Contact
        fatherName,
        motherName,
        spouseName,
        emergencyName,
        emergencyRelation,
        emergencyPhone,
        emergencyEmail,
        // Educational Qualifications
        educationalQualifications,
        // Professional Details - Doctors
        ...(role === 'Doctor' && {
          medicalLicenseNumber,
          licenseIssuingAuthority,
          licenseIssueDate: licenseIssueDate ? new Date(licenseIssueDate) : undefined,
          licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : undefined,
          specialization,
          subSpecialization,
          yearsOfExperience,
          medicalCouncil,
          councilRegistrationNumber,
          hospitalAffiliation,
          currentPosition,
        }),
        // Professional Details - Pharmacists
        ...(role === 'PharmaCist' && {
          pharmacyLicenseNumber,
          pharmacyLicenseIssuingAuthority: pharmacyLicenseIssuingAuthority,
          pharmacyLicenseIssueDate: pharmacyLicenseIssueDate
            ? new Date(pharmacyLicenseIssueDate)
            : undefined,
          pharmacyLicenseExpiryDate: pharmacyLicenseExpiryDate
            ? new Date(pharmacyLicenseExpiryDate)
            : undefined,
          pharmacyName,
          pharmacyAddress,
          pharmacyOwnershipType,
          yearsOfPharmacyExperience,
          pharmacyCouncil,
          pharmacyCouncilRegistrationNumber,
        }),
        // Work Experience
        workExperience,
        // Professional Memberships
        professionalMemberships,
        // Background Check
        criminalRecord,
        criminalRecordDetails,
        ...(role === 'Doctor' && {
          malpracticeHistory,
          malpracticeDetails,
        }),
        // References
        professionalReferences,
        // Set submission timestamp
        submittedAt: new Date(),
        encryptedProfileData,
      },
      create: {
        userId,
        userName,
        phoneNumber,
        email,
        role,
        // Personal Information
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        bloodGroup,
        maritalStatus,
        nationality,
        aadharNumber,
        panNumber,
        // Address Information
        permanentAddressLine1,
        permanentAddressLine2,
        permanentCity,
        permanentState,
        permanentPincode,
        currentAddressLine1,
        currentAddressLine2,
        currentCity,
        currentState,
        currentPincode,
        // Family & Emergency Contact
        fatherName,
        motherName,
        spouseName,
        emergencyName,
        emergencyRelation,
        emergencyPhone,
        emergencyEmail,
        // Educational Qualifications
        educationalQualifications,
        // Professional Details - Doctors
        ...(role === 'Doctor' && {
          medicalLicenseNumber,
          licenseIssuingAuthority,
          licenseIssueDate: licenseIssueDate ? new Date(licenseIssueDate) : undefined,
          licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : undefined,
          specialization,
          subSpecialization,
          yearsOfExperience,
          medicalCouncil,
          councilRegistrationNumber,
          hospitalAffiliation,
          currentPosition,
        }),
        // Professional Details - Pharmacists
        ...(role === 'PharmaCist' && {
          pharmacyLicenseNumber,
          pharmacyLicenseIssuingAuthority: pharmacyLicenseIssuingAuthority,
          pharmacyLicenseIssueDate: pharmacyLicenseIssueDate
            ? new Date(pharmacyLicenseIssueDate)
            : undefined,
          pharmacyLicenseExpiryDate: pharmacyLicenseExpiryDate
            ? new Date(pharmacyLicenseExpiryDate)
            : undefined,
          pharmacyName,
          pharmacyAddress,
          pharmacyOwnershipType,
          yearsOfPharmacyExperience,
          pharmacyCouncil,
          pharmacyCouncilRegistrationNumber,
        }),
        // Work Experience
        workExperience,
        // Professional Memberships
        professionalMemberships,
        // Background Check
        criminalRecord,
        criminalRecordDetails,
        ...(role === 'Doctor' && {
          malpracticeHistory,
          malpracticeDetails,
        }),
        // References
        professionalReferences,
        // Set submission timestamp
        submittedAt: new Date(),
        encryptedProfileData,
      },
      select: {
        id: true,
        userId: true,
        userName: true,
        phoneNumber: true,
        email: true,
        role: true,
        isVerified: true,
        verificationStatus: true,
        credits: true,
        submittedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const isNewProfessional = professional.createdAt.getTime() === professional.updatedAt.getTime();

    res.status(isNewProfessional ? 201 : 200).json({
      success: true,
      message: isNewProfessional
        ? 'Professional profile submitted successfully. Your application is under review.'
        : 'Professional profile updated successfully. Your application is under review.',
      data: professional,
    });
  });

  // Get professional by ID
  static getProfessionalById = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const professional = await prisma.professional.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        userName: true,
        phoneNumber: true,
        email: true,
        role: true,
        isVerified: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    res.json({
      success: true,
      data: professional,
    });
  });

  // Get professional by userId
  static getProfessionalByUserId = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { userId } = req.params;

    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        userName: true,
        phoneNumber: true,
        email: true,
        role: true,
        isVerified: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    res.json({
      success: true,
      data: professional,
    });
  });

  // Get decrypted professional profile
  static getProfessionalProfile = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { userId } = req.params;

    const professional = await prisma.professional.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        userName: true,
        phoneNumber: true,
        email: true,
        role: true,
        isVerified: true,
        credits: true,
        encryptedProfileData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    let decryptedProfileData = null;
    if (professional.encryptedProfileData) {
      try {
        decryptedProfileData = JSON.parse(decryptData(professional.encryptedProfileData));
      } catch (error) {
        console.error('Error decrypting professional profile data:', error);
        return res.status(500).json({
          success: false,
          message: 'Error decrypting profile data',
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...professional,
        profileData: decryptedProfileData,
      },
    });
  });

  // Update professional
  static updateProfessional = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;

    const professional = await prisma.professional.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        userId: true,
        userName: true,
        phoneNumber: true,
        email: true,
        role: true,
        isVerified: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Professional updated successfully',
      data: professional,
    });
  });

  // Delete professional
  static deleteProfessional = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    await prisma.professional.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Professional deleted successfully',
    });
  });

  // Get all professionals (with pagination) - requires authentication
  static getAllProfessionals = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [professionals, total] = await Promise.all([
      prisma.professional.findMany({
        skip: offset,
        take: limit,
        select: {
          id: true,
          userId: true,
          userName: true,
          phoneNumber: true,
          email: true,
          role: true,
          isVerified: true,
          credits: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.professional.count(),
    ]);

    res.json({
      success: true,
      data: professionals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });
}
