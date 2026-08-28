import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';

export const notImplemented = (featureName) => (_req, _res, next) => {
  next(new AppError(`${featureName} is not implemented yet.`, 501, errorCodes.NOT_IMPLEMENTED));
};
