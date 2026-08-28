export const validateRequest = (schema) => (req, res, next) => {
  if (!schema) return next();
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (result.success) return next();
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request.', details: result.error.flatten() } });
};
