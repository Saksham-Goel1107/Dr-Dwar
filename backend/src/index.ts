import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';
import express from 'express';
import { ENV } from './config/env';
// import { arcjetMiddleware } from './middleware/arcjet.middleware';
import { errorHandler, notFound } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import healthRoutes from './routes/health.routes';
import orderRoutes from './routes/order.routes';
import userRoutes from './routes/user.routes';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(requestLogger);

// Clerk middleware for authentication
app.use(clerkMiddleware());

// Arcjet middleware for security
// app.use(arcjetMiddleware);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/', healthRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = Number(ENV.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${ENV.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/healthz`);
});
