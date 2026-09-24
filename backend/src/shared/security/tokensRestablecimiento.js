import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { configuracionSeguridad } from '../../config/security.js';

export function crearTokenRestablecimiento(
  bytes = configuracionSeguridad.bytesTokenRestablecimiento
) {
  if (!Number.isInteger(bytes) || bytes < 32) {
    throw new TypeError('El token de restablecimiento requiere al menos 32 bytes aleatorios.');
  }

  return randomBytes(bytes).toString('base64url');
}

export function hashearTokenRestablecimiento(token) {
  if (typeof token !== 'string' || !token) {
    throw new TypeError('El token de restablecimiento es obligatorio.');
  }

  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function compararHashToken(hashEsperado, hashRecibido) {
  if (typeof hashEsperado !== 'string' || typeof hashRecibido !== 'string') return false;
  if (!/^[a-f\d]{64}$/i.test(hashEsperado) || !/^[a-f\d]{64}$/i.test(hashRecibido)) {
    return false;
  }

  const esperado = Buffer.from(hashEsperado, 'hex');
  const recibido = Buffer.from(hashRecibido, 'hex');
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}
