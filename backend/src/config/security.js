import compression from 'compression';
import helmet from 'helmet';

export const securityMiddleware = [helmet(), compression()];
