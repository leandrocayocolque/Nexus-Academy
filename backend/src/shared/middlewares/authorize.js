import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';

export const authorize = (..._roles) => (_req, _res, next) => {
  next(new AppError('Authorization is not implemented yet.', 501, errorCodes.NOT_IMPLEMENTED));
};
