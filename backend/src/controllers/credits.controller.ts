import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/error.middleware';

export class CreditsController {
  // Get user's credit balance
  static getCreditBalance = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
      select: { credits: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        credits: user.credits,
      },
    });
  });

  // Handle payment success - just add credits to user
  static addCredits = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { credits, amount } = req.body;

    if (!credits || credits <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid credit amount is required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user credits
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: credits } },
      select: { credits: true },
    });

    // Record the transaction
    await prisma.creditsPayments.create({
      data: {
        userId: user.id,
        amount: amount || credits,
        credits,
        paymentId: `CRED-${Date.now()}`,
      },
    });

    res.json({
      success: true,
      message: `Successfully added ${credits} credits`,
      data: {
        creditsAdded: credits,
        newBalance: updatedUser.credits,
      },
    });
  });

  // Get credit transaction history
  static getCreditHistory = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const transactions = await prisma.creditsPayments.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        credits: true,
        paymentId: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: transactions,
    });
  });
}
