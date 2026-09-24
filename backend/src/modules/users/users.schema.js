import { z } from 'zod';
import { esquemaContrasena, esquemaCorreo, esquemaNombre } from '../auth/auth.schema.js';

export const esquemaActualizarPerfil = z
  .object({
    correo: esquemaCorreo.optional(),
    nombre: esquemaNombre.optional(),
    apellido: esquemaNombre.optional()
  })
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar.'
  });

export const esquemaCambiarContrasena = z
  .object({
    contrasenaActual: z.string({ required_error: 'La contraseña actual es obligatoria.' }).min(1),
    contrasenaNueva: esquemaContrasena,
    confirmarContrasenaNueva: z.string()
  })
  .strict()
  .refine((datos) => datos.contrasenaNueva === datos.confirmarContrasenaNueva, {
    path: ['confirmarContrasenaNueva'],
    message: 'Las contraseñas no coinciden.'
  })
  .refine((datos) => datos.contrasenaActual !== datos.contrasenaNueva, {
    path: ['contrasenaNueva'],
    message: 'La contraseña nueva debe ser diferente de la actual.'
  });

export const usersSchemas = Object.freeze({
  actualizarPerfil: esquemaActualizarPerfil,
  cambiarContrasena: esquemaCambiarContrasena
});
