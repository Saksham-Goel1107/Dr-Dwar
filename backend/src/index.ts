import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';
import express from 'express';
import { ENV } from './config/env';
// import { arcjetMiddleware } from './middleware/arcjet.middleware';
import userRoutes from './routes/user.routes';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Clerk middleware for authentication
app.use(clerkMiddleware());

// Arcjet middleware for security
// app.use(arcjetMiddleware);

// Routes
app.use('/api/users', userRoutes);

// Health check
app.get('/healthz', (_, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = Number(ENV.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${ENV.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/healthz`);
});
