import express from 'express';
import { ENV } from './config/env';
import cors from 'cors';
import { arcjetMiddleware } from './middleware/arcjet.middleware';
import { clerkMiddleware } from '@clerk/express';

const app = express();
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
app.use(arcjetMiddleware);

app.get('/healthz', (_, res) => {
  res.send('Server is healthy...');
});

app.listen(Number(ENV.PORT) || 3000, '0.0.0.0', () => {
  console.log(`Server is running on port ${Number(ENV.PORT) || 3000}`);
});
