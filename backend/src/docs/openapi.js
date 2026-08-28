import { swaggerSchemas } from './swagger.schemas.js';

export const openApiDocument = {
  openapi: '3.0.0',
  info: {
    title: 'NEXUS API',
    version: '0.1.0'
  },
  paths: {},
  components: {
    schemas: swaggerSchemas
  }
};
