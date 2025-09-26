import CryptoJS from 'crypto-js';
import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { ENV } from '../config/env.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const ENCRYPTION_KEY = ENV.ENCRYPTION_KEY || 'default-key';

export class ProfessionalCreditsController {
  // Get professional's credit balance and total earnings
  static getCreditBalance = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: {
        credits: true,
        id: true,
        isVerified: true,
        verificationStatus: true,
        role: true,
      },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    // Get total earnings
    const totalEarnings = await prisma.professionalEarning.aggregate({
      where: { professionalId: professional.id },
      _sum: {
        amount: true,
        credits: true,
      },
    });

    res.json({
      success: true,
      data: {
        credits: professional.credits,
        totalEarningsAmount: totalEarnings._sum.amount || 0,
        totalEarningsCredits: totalEarnings._sum.credits || 0,
        isVerified: professional.isVerified,
        verificationStatus: professional.verificationStatus,
        role: professional.role,
      },
    });
  });

  // Get professional dashboard stats
  static getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true, credits: true, isVerified: true, role: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    try {
      // Get total earnings
      const totalEarnings = await prisma.professionalEarning.aggregate({
        where: { professionalId: professional.id },
        _sum: { amount: true, credits: true },
        _count: true,
      });

      // Get current month earnings
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyEarnings = await prisma.professionalEarning.aggregate({
        where: {
          professionalId: professional.id,
          createdAt: { gte: currentMonth },
        },
        _sum: { amount: true, credits: true },
        _count: true,
      });

      // Get pending withdrawals
      const pendingWithdrawals = await prisma.professionalWithdrawal.aggregate({
        where: {
          professionalId: professional.id,
          status: 'PENDING',
        },
        _sum: { amount: true, credits: true },
        _count: true,
      });

      // Get recent earnings
      const recentEarnings = await prisma.professionalEarning.findMany({
        where: { professionalId: professional.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          credits: true,
          source: true,
          description: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: {
          currentBalance: professional.credits,
          isVerified: professional.isVerified,
          role: professional.role,
          totalEarnings: {
            amount: totalEarnings._sum.amount || 0,
            credits: totalEarnings._sum.credits || 0,
            count: totalEarnings._count,
          },
          monthlyEarnings: {
            amount: monthlyEarnings._sum.amount || 0,
            credits: monthlyEarnings._sum.credits || 0,
            count: monthlyEarnings._count,
          },
          pendingWithdrawals: {
            amount: pendingWithdrawals._sum.amount || 0,
            credits: pendingWithdrawals._sum.credits || 0,
            count: pendingWithdrawals._count,
          },
          recentEarnings,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
      });
    }
  });

  // Add earnings to professional account
  static addEarning = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { credits, amount, source, sourceId, description, transactionId } = req.body;

    if (!credits || credits <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credits amount',
      });
    }

    if (!source || !description) {
      return res.status(400).json({
        success: false,
        message: 'Source and description are required',
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: { id: true, credits: true },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update professional credits
        const updatedProfessional = await tx.professional.update({
          where: { id: professional.id },
          data: { credits: { increment: credits } },
          select: { credits: true },
        });

        // Create earning record
        const earning = await tx.professionalEarning.create({
          data: {
            professionalId: professional.id,
            amount: amount || credits,
            credits,
            source,
            sourceId,
            description,
            transactionId,
          },
        });

        return { updatedProfessional, earning };
      });

      res.json({
        success: true,
        message: `Successfully added ${credits} credits`,
        data: {
          creditsAdded: credits,
          newBalance: result.updatedProfessional.credits,
          earning: result.earning,
        },
      });
    } catch (error) {
      console.error('Error adding earning:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add earning',
      });
    }
  });

  // Get professional's earnings history
  static getEarningsHistory = asyncHandler(async (req: Request, res: Response) => {
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const earnings = await prisma.professionalEarning.findMany({
      where: { professionalId: professional.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        credits: true,
        source: true,
        description: true,
        transactionId: true,
        createdAt: true,
      },
    });

    const total = await prisma.professionalEarning.count({
      where: { professionalId: professional.id },
    });

    res.json({
      success: true,
      data: earnings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // Save or update professional's bank account details
  static saveBankAccount = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { accountHolderName, accountNumber, bankName, ifscCode, accountType } = req.body;

    if (!accountHolderName || !accountNumber || !bankName || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: 'All bank account fields are required',
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

    try {
      // Encrypt sensitive data
      const encryptedAccountNumber = CryptoJS.AES.encrypt(accountNumber, ENCRYPTION_KEY).toString();

      const bankAccount = await prisma.professionalBankAccount.upsert({
        where: { professionalId: professional.id },
        update: {
          accountHolderName,
          accountNumber: encryptedAccountNumber,
          bankName,
          ifscCode,
          accountType: accountType || 'savings',
        },
        create: {
          professionalId: professional.id,
          accountHolderName,
          accountNumber: encryptedAccountNumber,
          bankName,
          ifscCode,
          accountType: accountType || 'savings',
        },
      });

      res.json({
        success: true,
        message: 'Bank account details saved successfully',
        data: {
          id: bankAccount.id,
          accountHolderName: bankAccount.accountHolderName,
          bankName: bankAccount.bankName,
          ifscCode: bankAccount.ifscCode,
          accountType: bankAccount.accountType,
          isVerified: bankAccount.isVerified,
          createdAt: bankAccount.createdAt,
          updatedAt: bankAccount.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error saving bank account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save bank account',
      });
    }
  });

  // Get professional's bank account details
  static getBankAccount = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: {
        id: true,
        bankAccount: {
          select: {
            id: true,
            accountHolderName: true,
            accountNumber: true,
            bankName: true,
            ifscCode: true,
            accountType: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    if (!professional.bankAccount) {
      return res.json({
        success: true,
        data: null,
        message: 'No bank account found',
      });
    }

    // Decrypt account number for display
    const decryptedAccountNumber = CryptoJS.AES.decrypt(
      professional.bankAccount.accountNumber,
      ENCRYPTION_KEY,
    ).toString(CryptoJS.enc.Utf8);

    res.json({
      success: true,
      data: {
        id: professional.bankAccount.id,
        accountHolderName: professional.bankAccount.accountHolderName,
        accountNumber: decryptedAccountNumber,
        bankName: professional.bankAccount.bankName,
        ifscCode: professional.bankAccount.ifscCode,
        accountType: professional.bankAccount.accountType,
        isVerified: professional.bankAccount.isVerified,
        createdAt: professional.bankAccount.createdAt,
        updatedAt: professional.bankAccount.updatedAt,
      },
    });
  });

  // Create a withdrawal request
  static createWithdrawalRequest = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { credits } = req.body;

    if (!credits || credits < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is 100 credits',
      });
    }

    if (credits > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum withdrawal amount is 50,000 credits per transaction',
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: auth.userId },
      select: {
        id: true,
        credits: true,
        isVerified: true,
        bankAccount: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found',
      });
    }

    if (!professional.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account must be verified to withdraw funds',
      });
    }

    if (!professional.bankAccount) {
      return res.status(400).json({
        success: false,
        message: 'Bank account details are required for withdrawal',
      });
    }

    if (professional.credits < credits) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits',
      });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Deduct credits from professional
        const updatedProfessional = await tx.professional.update({
          where: { id: professional.id },
          data: { credits: { decrement: credits } },
          select: { credits: true },
        });

        // Create withdrawal request
        const withdrawal = await tx.professionalWithdrawal.create({
          data: {
            professionalId: professional.id,
            amount: credits, // 1 credit = 1 rupee
            credits,
            bankAccountId: professional.bankAccount!.id,
          },
        });

        return { updatedProfessional, withdrawal };
      });

      res.json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: {
          withdrawal: result.withdrawal,
          newBalance: result.updatedProfessional.credits,
        },
      });
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create withdrawal request',
      });
    }
  });

  // Get withdrawal history
  static getWithdrawalHistory = asyncHandler(async (req: Request, res: Response) => {
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const withdrawals = await prisma.professionalWithdrawal.findMany({
      where: { professionalId: professional.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        bankAccount: {
          select: {
            bankName: true,
            accountNumber: true,
            ifscCode: true,
          },
        },
      },
    });

    // Decrypt account numbers
    const processedWithdrawals = withdrawals.map((withdrawal) => ({
      ...withdrawal,
      bankAccount: {
        ...withdrawal.bankAccount,
        accountNumber: CryptoJS.AES.decrypt(
          withdrawal.bankAccount.accountNumber,
          ENCRYPTION_KEY,
        ).toString(CryptoJS.enc.Utf8),
      },
    }));

    const total = await prisma.professionalWithdrawal.count({
      where: { professionalId: professional.id },
    });

    res.json({
      success: true,
      data: processedWithdrawals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}
