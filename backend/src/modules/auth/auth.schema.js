import { z } from 'zod';

const bytesUtf8 = (valor) => new TextEncoder().encode(valor).length;

export const esquemaCorreo = z
  .string({ required_error: 'El correo es obligatorio.' })
  .trim()
  .email('El correo no tiene un formato válido.')
  .max(254, 'El correo es demasiado largo.')
  .toLowerCase();

export const esquemaNombre = z
  .string({ required_error: 'El nombre es obligatorio.' })
  .trim()
  .min(2, 'Debe contener al menos 2 caracteres.')
  .max(100, 'No puede superar los 100 caracteres.');

export const esquemaContrasena = z
  .string({ required_error: 'La contraseña es obligatoria.' })
  .min(12, 'La contraseña debe contener al menos 12 caracteres.')
  .regex(/[a-záéíóúñ]/, 'La contraseña debe incluir una letra minúscula.')
  .regex(/[A-ZÁÉÍÓÚÑ]/, 'La contraseña debe incluir una letra mayúscula.')
  .regex(/\d/, 'La contraseña debe incluir un número.')
  .refine((valor) => bytesUtf8(valor) <= 72, 'La contraseña no puede superar 72 bytes.');

const confirmarContrasena = (esquema, campoContrasena, campoConfirmacion) =>
  esquema.refine((datos) => datos[campoContrasena] === datos[campoConfirmacion], {
    path: [campoConfirmacion],
    message: 'Las contraseñas no coinciden.'
  });

export const esquemaRegistroAdministrador = confirmarContrasena(
  z
    .object({
      correo: esquemaCorreo,
      nombre: esquemaNombre,
      apellido: esquemaNombre,
      contrasena: esquemaContrasena,
      confirmarContrasena: z.string()
    })
    .strict(),
  'contrasena',
  'confirmarContrasena'
);

export const esquemaLogin = z
  .object({
    correo: esquemaCorreo,
    contrasena: z.string({ required_error: 'La contraseña es obligatoria.' }).min(1).max(200)
  })
  .strict();

export const esquemaSolicitudRestablecimiento = z.object({ correo: esquemaCorreo }).strict();

export const esquemaRestablecimientoContrasena = confirmarContrasena(
  z
    .object({
      token: z.string({ required_error: 'El token es obligatorio.' }).trim().min(32),
      contrasenaNueva: esquemaContrasena,
      confirmarContrasenaNueva: z.string()
    })
    .strict(),
  'contrasenaNueva',
  'confirmarContrasenaNueva'
);

export const authSchemas = Object.freeze({
  registroAdministrador: esquemaRegistroAdministrador,
  login: esquemaLogin,
  solicitudRestablecimiento: esquemaSolicitudRestablecimiento,
  restablecimientoContrasena: esquemaRestablecimientoContrasena
});
