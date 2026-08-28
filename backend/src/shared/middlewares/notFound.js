import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';

export const notFound = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404, errorCodes.NOT_FOUND));
};
