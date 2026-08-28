import { AppError } from './AppError.js';

export const errorHandler = (error, _req, res, _next) => {
  const normalized = error instanceof AppError
    ? error
    : new AppError('Unexpected server error');

  res.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details
    }
  });
};
