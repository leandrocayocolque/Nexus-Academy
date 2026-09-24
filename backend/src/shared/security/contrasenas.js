import bcrypt from 'bcryptjs';
import { configuracionSeguridad } from '../../config/security.js';

export async function hashearContrasena(contrasena, rondas = configuracionSeguridad.rondasBcrypt) {
  if (typeof contrasena !== 'string' || contrasena.length < 12) {
    throw new TypeError('La contraseña debe tener al menos 12 caracteres.');
  }

  return bcrypt.hash(contrasena, rondas);
}

export async function verificarContrasena(contrasena, hashContrasena) {
  if (typeof contrasena !== 'string' || typeof hashContrasena !== 'string') return false;
  return bcrypt.compare(contrasena, hashContrasena);
}

export function crearServicioContrasenas({ rondas = configuracionSeguridad.rondasBcrypt } = {}) {
  if (!Number.isInteger(rondas) || rondas < 10 || rondas > 15) {
    throw new TypeError('Las rondas bcrypt deben ser un entero entre 10 y 15.');
  }

  return Object.freeze({
    rondas,
    hashear: (contrasena) => hashearContrasena(contrasena, rondas),
    verificar: verificarContrasena
  });
}

export const servicioContrasenas = crearServicioContrasenas();
