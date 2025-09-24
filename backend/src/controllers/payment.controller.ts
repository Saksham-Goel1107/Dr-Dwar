import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export class PaymentController {
  // Get payment by ID
  static getPaymentById = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              select: {
                userName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check if the payment belongs to the authenticated user
    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
    });

    if (!user || payment.order.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only view your own payments',
      });
    }

    res.json({
      success: true,
      payment,
    });
  });

  // Update payment status
  static updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const { status, razorpayOrderId } = req.body;

    // First check if the payment exists
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check if the payment belongs to the authenticated user
    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
    });

    if (!user || payment.order.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only update your own payments',
      });
    }

    // Update order status based on payment status
    let orderStatus = payment.order.status;
    switch (status) {
      case 'CAPTURED':
        orderStatus = 'CONFIRMED';
        break;
      case 'FAILED':
        orderStatus = 'CANCELLED';
        break;
      case 'REFUNDED':
        orderStatus = 'REFUNDED';
        break;
    }

    if (orderStatus !== payment.order.status) {
      await prisma.orders.update({
        where: { id: payment.orderId },
        data: { status: orderStatus },
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
    });
  });

  // Get payments for a user
  static getUserPayments = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
      include: {
        orders: {
          include: {
            payments: true,
          },
          orderBy: {
            createdAt: 'desc',
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

    // Flatten payments from all orders
    const payments = user.orders.flatMap((order: any) => order.payments);

    res.json({
      success: true,
      payments,
    });
  });
}
