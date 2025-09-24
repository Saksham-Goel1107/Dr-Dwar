import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';

const router = Router();

// Basic health check
router.get('/healthz', HealthController.healthCheck);

// Detailed health check with service status
router.get('/health', HealthController.detailedHealthCheck);

// Readiness check for load balancers/Kubernetes
router.get('/readyz', HealthController.readinessCheck);

// Liveness check for Kubernetes
router.get('/livez', HealthController.livenessCheck);

export default router;
