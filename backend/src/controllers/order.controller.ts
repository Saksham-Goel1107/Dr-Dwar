import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/error.middleware';

export class OrderController {
  // Create a new order
  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;

    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }    const {
      userName,
      userPhone,
      userEmail,
      items,
      subtotal,
      taxAmount,
      deliveryCharges,
      totalAmount,
      paymentId,
      paymentStatus,
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required',
      });
    }

    // Check if user exists, if not create them
    let user = await prisma.user.findUnique({
      where: { userId: auth.userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          userId: auth.userId,
          userName: userName || 'Unknown',
          phoneNumber: userPhone,
          email: userEmail,
        },
      });
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create the order
    const order = await prisma.orders.create({
      data: {
        userId: user.id,
        amount: totalAmount,
        status: paymentStatus || 'pending',
        orderId,
        orderItems: {
          create: items.map((item: any) => ({
            itemName: item.genericName,
            quantity: item.quantity,
            price: item.mrp,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: order.orderId,
      order: {
        id: order.id,
        orderId: order.orderId,
        amount: order.amount,
        status: order.status,
        items: order.orderItems.length,
        createdAt: order.createdAt,
      },
    });
  });

  // Get orders for a user
  static getUserOrders = asyncHandler(async (req: Request, res: Response) => {
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
            orderItems: true,
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

    res.json({
      success: true,
      orders: user.orders,
    });
  });

  // Get order by ID
  static getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;

    const { id } = req.params;

    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        orderItems: true,
        user: {
          select: {
            userName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if the order belongs to the authenticated user
    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
    });

    if (!user || order.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only view your own orders',
      });
    }

    res.json({
      success: true,
      order,
    });
  });

  // Update order status
  static updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;

    const { id } = req.params;
    const { status, isApproved } = req.body;

    // First check if the order exists and belongs to the user
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if the order belongs to the authenticated user
    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
    });

    if (!user || order.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you can only update your own orders',
      });
    }

    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: {
        status,
        isApproved,
      },
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  });
}
