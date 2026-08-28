import { Router } from 'express';
import { usersController } from './users.controller.js';

export const usersRouter = Router();

usersRouter.get('/me', usersController.getProfile);
usersRouter.patch('/me', usersController.updateProfile);
usersRouter.get('/', usersController.listUsers);
