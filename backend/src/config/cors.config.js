import cors from 'cors';
import { env } from './env.js';

export const corsMiddleware = cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin,
  credentials: true
});
