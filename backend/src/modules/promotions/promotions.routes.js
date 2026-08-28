import { Router } from 'express';
import { promotionsController } from './promotions.controller.js';

export const promotionsRouter = Router();

promotionsRouter.get('/', promotionsController.listPromotions);
promotionsRouter.post('/', promotionsController.createPromotion);
promotionsRouter.patch('/:id', promotionsController.updatePromotion);
