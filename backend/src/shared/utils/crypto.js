import crypto from 'node:crypto';

export const createRandomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
