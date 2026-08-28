import { Router } from 'express';
import { categoriesController } from './categories.controller.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', categoriesController.listCategories);
categoriesRouter.post('/', categoriesController.createCategory);
categoriesRouter.patch('/:id', categoriesController.updateCategory);
