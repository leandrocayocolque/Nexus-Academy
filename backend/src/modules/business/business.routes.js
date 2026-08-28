import { Router } from 'express';
import { businessController } from './business.controller.js';

export const businessRouter = Router();

businessRouter.get('/', businessController.listBusinesses);
businessRouter.post('/', businessController.createBusiness);
businessRouter.get('/:id', businessController.getBusiness);
businessRouter.patch('/:id', businessController.updateBusiness);
