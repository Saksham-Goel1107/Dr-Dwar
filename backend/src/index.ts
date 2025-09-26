import './instrument.js';

import { clerkMiddleware } from '@clerk/express';
import * as Sentry from '@sentry/node';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import client from 'prom-client';
import { ENV } from './config/env.js';
import { arcjetMiddleware } from './middleware/arcjet.middleware.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';
import chatbotRoutes from './routes/chatbot.routes.js';
import creditsRoutes from './routes/credits.routes.js';
import healthRoutes from './routes/health.routes.js';
import newsRoutes from './routes/news.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import professionalCreditsRoutes from './routes/professional-credits.routes.js';
import professionalRoutes from './routes/professional.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);
app.use(hpp());
app.use(helmet());
app.use(requestLogger);
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Clerk middleware for authentication
app.use(clerkMiddleware());

// Arcjet middleware for security
app.use(arcjetMiddleware);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/professional-credits', professionalCreditsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/news', newsRoutes);
app.use('/', healthRoutes);
app.get('/metrics', async (_, res) => {
  res.setHeader('Content-Type', client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end((res as any).sentry + '\n');
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = Number(ENV.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${ENV.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/healthz`);
  console.log(`🤖 Chatbot API: http://localhost:${PORT}/api/chatbot`);
});
