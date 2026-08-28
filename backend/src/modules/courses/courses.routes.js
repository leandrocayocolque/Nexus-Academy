import { Router } from 'express';
import { coursesController } from './courses.controller.js';

export const coursesRouter = Router();

coursesRouter.get('/', coursesController.listCourses);
coursesRouter.post('/', coursesController.createCourse);
coursesRouter.get('/:id', coursesController.getCourse);
coursesRouter.patch('/:id', coursesController.updateCourse);
coursesRouter.delete('/:id', coursesController.deleteCourse);
