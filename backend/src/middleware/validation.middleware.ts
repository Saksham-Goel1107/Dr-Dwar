import { NextFunction, Request, Response } from 'express';

export const validateOrderCreation = (req: Request, res: Response, next: NextFunction) => {
  const { userName, userPhone, userEmail, items, totalAmount, paymentId, paymentStatus } = req.body;

  const errors: string[] = [];

  // Validate required fields (userId is now from authentication)
  if (!userName || typeof userName !== 'string') {
    errors.push('userName is required and must be a string');
  }

  if (!userPhone || typeof userPhone !== 'string') {
    errors.push('userPhone is required and must be a string');
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    // Validate each item
    items.forEach((item: any, index: number) => {
      if (!item.genericName || typeof item.genericName !== 'string') {
        errors.push(`Item ${index + 1}: genericName is required and must be a string`);
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: quantity must be a positive number`);
      }
      if (!item.mrp || typeof item.mrp !== 'number' || item.mrp <= 0) {
        errors.push(`Item ${index + 1}: mrp must be a positive number`);
      }
    });
  }

  if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
    errors.push('totalAmount must be a positive number');
  }

  if (!paymentId || typeof paymentId !== 'string') {
    errors.push('paymentId is required and must be a string');
  }

  // Validate optional fields
  if (userEmail && typeof userEmail !== 'string') {
    errors.push('userEmail must be a string');
  }

  if (paymentStatus && typeof paymentStatus !== 'string') {
    errors.push('paymentStatus must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

export const validateOrderStatusUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { status, isApproved } = req.body;
  const errors: string[] = [];

  if (status && typeof status !== 'string') {
    errors.push('status must be a string');
  }

  if (isApproved !== undefined && typeof isApproved !== 'boolean') {
    errors.push('isApproved must be a boolean');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'userId parameter is required and must be a string',
    });
  }

  next();
};

export const validateOrderId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Order ID parameter is required and must be a string',
    });
  }

  next();
};
