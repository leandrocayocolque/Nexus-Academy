import { z } from 'zod';
import { esquemaCorreo } from '../auth/auth.schema.js';

const textoCorto = (nombre, maximo) =>
  z
    .string({ required_error: `${nombre} es obligatorio.` })
    .trim()
    .min(1, `${nombre} es obligatorio.`)
    .max(maximo, `${nombre} no puede superar ${maximo} caracteres.`);

const esquemaEnlacesSociales = z
  .record(z.string().trim().url('Cada enlace social debe ser una URL válida.'))
  .refine(
    (enlaces) => Object.keys(enlaces).length <= 20,
    'No se permiten más de 20 enlaces sociales.'
  );

const esquemaHorarios = z
  .record(z.string().trim().min(1).max(100))
  .refine((horarios) => Object.keys(horarios).length <= 20, 'No se permiten más de 20 horarios.');

export const esquemaActualizarNegocio = z
  .object({
    nombre: textoCorto('El nombre', 150).optional(),
    descripcion: z.string().trim().max(2_000).nullable().optional(),
    direccion: z.string().trim().max(300).nullable().optional(),
    telefono: z.string().trim().max(50).nullable().optional(),
    correo: esquemaCorreo.nullable().optional(),
    enlacesSociales: esquemaEnlacesSociales.nullable().optional(),
    horariosAtencion: esquemaHorarios.nullable().optional()
  })
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar el negocio.'
  });

export const businessSchemas = Object.freeze({
  actualizar: esquemaActualizarNegocio
});
