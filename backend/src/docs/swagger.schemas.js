export const swaggerSchemas = {
  HealthResponse: {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'ok' },
      service: { type: 'string', example: 'nexus-api' }
    }
  }
};
