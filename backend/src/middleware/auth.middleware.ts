import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        isAuthenticated?: boolean;
      };
    }
  }
}

export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth?.isAuthenticated) {
    return res.status(401).json({ message: "Unauthorized - you must be logged in" });
  }
  next();
};
