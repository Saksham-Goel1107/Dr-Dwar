import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export class HealthController {
  // Basic health check
  static healthCheck = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    });
  });

  // Detailed health check with database connectivity
  static detailedHealthCheck = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    // Check database connectivity
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    let dbError = null;

    try {
      const dbStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStartTime;
    } catch (error) {
      dbStatus = 'unhealthy';
      dbError = error instanceof Error ? error.message : 'Unknown database error';
    }

    const responseTime = Date.now() - startTime;

    const healthData = {
      success: true,
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      responseTime: `${responseTime}ms`,
      services: {
        database: {
          status: dbStatus,
          responseTime: `${dbResponseTime}ms`,
          error: dbError,
        },
      },
    };

    // Return appropriate status code
    const statusCode = dbStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
  });

  // Readiness check for Kubernetes/load balancers
  static readinessCheck = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if database is ready
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        success: true,
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: 'Database not ready',
      });
    }
  });

  // Liveness check for Kubernetes
  static livenessCheck = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}
