import { Request, Response } from 'express';
import { prisma } from '../config/database';

export class UserController {
  // Create a new user
  static async createUser(req: Request, res: Response) {
    try {
      const { userId, userName, phoneNumber, email } = req.body;

      // Validate required fields
      if (!userId || !userName || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'userId, userName, and phoneNumber are required',
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ userId }, { userName }, { phoneNumber }, ...(email ? [{ email }] : [])],
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this userId, userName, phoneNumber, or email',
        });
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          userId,
          userName,
          phoneNumber,
          ...(email && { email }),
        },
        select: {
          id: true,
          userId: true,
          userName: true,
          phoneNumber: true,
          email: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get user by ID
  static async getUserById(req: Request, res: Response) {
    try {
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
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get user by userId
  static async getUserByUserId(req: Request, res: Response) {
    try {
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
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update user
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userName, phoneNumber, email } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(userName && { userName }),
          ...(phoneNumber && { phoneNumber }),
          ...(email !== undefined && { email }),
        },
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
    } catch (error) {
      console.error('Error updating user:', error);

      if ((error as any).code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete user
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);

      if ((error as any).code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get all users (with pagination)
  static async getAllUsers(req: Request, res: Response) {
    try {
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
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
