import { Router } from 'express';
import { aiController } from './ai.controller.js';

export const aiRouter = Router();

aiRouter.post('/recommendations', aiController.recommendCourses);
