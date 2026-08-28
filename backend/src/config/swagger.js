import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from '../docs/openapi.js';

export const swaggerMiddleware = [swaggerUi.serve, swaggerUi.setup(openApiDocument)];
