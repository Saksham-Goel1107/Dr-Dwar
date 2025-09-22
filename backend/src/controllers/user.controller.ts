import CryptoJS from 'crypto-js';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/error.middleware';
import { ENV } from '../config/env';

// Production-ready encryption using AES
const ENCRYPTION_KEY = ENV.ENCRYPTION_KEY || 'DrDwar2025SecureKey!@#DefaultKeyForDev';

const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export class UserController {
  // Create or update user with profile data
  static createUser = asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      userName,
      phoneNumber,
      email,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      diseases,
      allergies,
      medicalNote,
      emergencyContact,
    } = req.body;

    // Validate required fields
    if (!userId || !userName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'userId, userName, and phoneNumber are required',
      });
    }

    // Prepare profile data for encryption
    const profileData = {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      diseases,
      allergies,
      medicalNote,
      emergencyContact,
      email,
    };

    // Encrypt the profile data
    const encryptedProfileData = encryptData(JSON.stringify(profileData));

    // Upsert user (create if doesn't exist, update if exists)
    const user = await prisma.user.upsert({
      where: { userId },
      update: {
        userName,
        phoneNumber,
        ...(email && { email }),
        encryptedProfileData,
      },
      create: {
        userId,
        userName,
        phoneNumber,
        ...(email && { email }),
        encryptedProfileData,
      },
      select: {
        id: true,
        userId: true,
        userName: true,
        phoneNumber: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const isNewUser = user.createdAt.getTime() === user.updatedAt.getTime();

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? 'User created successfully' : 'User profile updated successfully',
      data: user,
    });
  });

  // Get user by ID
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        userName: true,
        phoneNumber: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  });

  // Get user by userId
  static getUserByUserId = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        userName: true,
        phoneNumber: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  });

  // Get decrypted user profile data
  static getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        userName: true,
        phoneNumber: true,
        email: true,
        encryptedProfileData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Decrypt profile data
    let profileData = null;
    if (user.encryptedProfileData) {
      try {
        const decryptedData = decryptData(user.encryptedProfileData);
        profileData = JSON.parse(decryptedData);
      } catch (error) {
        console.error('Error decrypting profile data:', error);
        return res.status(500).json({
          success: false,
          message: 'Error decrypting profile data',
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...user,
        profileData,
      },
    });
  });

  // Update user with profile data
  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const {
      userName,
      phoneNumber,
      email,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      diseases,
      allergies,
      medicalNote,
      emergencyContact,
    } = req.body;

    // Check if profile data is being updated
    let updateData: any = {
      ...(userName && { userName }),
      ...(phoneNumber && { phoneNumber }),
      ...(email !== undefined && { email }),
    };

    // If profile data is provided, encrypt and update it
    if (
      firstName ||
      lastName ||
      dateOfBirth ||
      gender ||
      address ||
      diseases ||
      allergies ||
      medicalNote ||
      emergencyContact
    ) {
      const profileData = {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        address,
        diseases,
        allergies,
        medicalNote,
        emergencyContact,
        email,
      };

      // Encrypt the profile data
      const encryptedProfileData = encryptData(JSON.stringify(profileData));
      updateData.encryptedProfileData = encryptedProfileData;
    }

    const updatedUser = await prisma.user.update({
      where: { userId: id },
      data: updateData,
      select: {
        id: true,
        userId: true,
        userName: true,
        phoneNumber: true,
        email: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  });

  // Delete user
  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  });

  // Get all users (with pagination)
  static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: Number(limit),
        select: {
          id: true,
          userId: true,
          userName: true,
          phoneNumber: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  });
}
