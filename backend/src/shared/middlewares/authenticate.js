import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';

export const authenticate = (_req, _res, next) => {
  next(new AppError('Authentication is not implemented yet.', 501, errorCodes.NOT_IMPLEMENTED));
};
