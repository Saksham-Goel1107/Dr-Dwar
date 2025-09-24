// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from '@sentry/node';
import { ENV } from './config/env.js';

Sentry.init({
  dsn: ENV.SENTRY_DSN,
  environment: ENV.NODE_ENV || 'development',
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Enable performance monitoring
  tracesSampleRate: ENV.NODE_ENV === 'production' ? 0.1 : 1.0,
});
