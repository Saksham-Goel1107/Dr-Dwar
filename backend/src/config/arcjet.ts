import arcjet, { detectBot, shield, tokenBucket } from '@arcjet/node';
import { ENV } from './env';

if (!ENV.ARCJET_KEY) {
  throw new Error('ARCJET_KEY is not defined in the environment variables.');
}

export const aj = arcjet({
  key: ENV.ARCJET_KEY,
  characteristics: ['ip.src', 'user-agent', 'x-react-native-app'],
  rules: [
    // Web Application Firewall Protection
    shield({ mode: 'LIVE' }),

    // Bot Detection with React Native user-agent allowed
    detectBot({
      mode: 'LIVE', // Consider MONITOR initially for tuning
      allow: [
        'CATEGORY:SEARCH_ENGINE',
        // Add your React Native app user-agent or partial string here
      ],
    }),

    // Rate limiting token bucket
    tokenBucket({
      mode: 'LIVE',
      refillRate: 10,
      interval: 10,
      capacity: 15,
    }),
  ],
});
