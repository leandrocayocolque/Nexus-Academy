import express from 'express';
import { corsMiddleware } from './config/cors.config.js';
import { loggerMiddleware } from './config/logger.js';
import { securityMiddleware } from './config/security.js';
import { swaggerMiddleware } from './config/swagger.js';
import { errorHandler } from './shared/errors/errorHandler.js';
import { notFound } from './shared/middlewares/notFound.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { businessRouter } from './modules/business/business.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { coursesRouter } from './modules/courses/courses.routes.js';
import { inquiriesRouter } from './modules/inquiries/inquiries.routes.js';
import { promotionsRouter } from './modules/promotions/promotions.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';

export const createApp = () => {
  const app = express();

  app.use(securityMiddleware);
  app.use(corsMiddleware);
  app.use(loggerMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'nexus-api' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/business', businessRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/courses', coursesRouter);
  app.use('/api/inquiries', inquiriesRouter);
  app.use('/api/promotions', promotionsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/docs', swaggerMiddleware);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
