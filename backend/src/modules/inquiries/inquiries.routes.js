import { Router } from 'express';
import { inquiriesController } from './inquiries.controller.js';

export const inquiriesRouter = Router();

inquiriesRouter.get('/', inquiriesController.listInquiries);
inquiriesRouter.post('/', inquiriesController.createInquiry);
inquiriesRouter.patch('/:id/status', inquiriesController.updateInquiryStatus);
