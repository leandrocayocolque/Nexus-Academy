import { z } from 'zod';
import { estadosConsulta } from '../../shared/constants/inquiry.enums.js';
import { esquemaCorreo } from '../auth/auth.schema.js';

const esquemaIdentificador = z.string().trim().min(1).max(100);

export const esquemaCrearConsulta = z
  .object({
    cursoId: esquemaIdentificador.nullable().optional(),
    nombre: z.string().trim().min(2).max(150),
    correo: esquemaCorreo,
    telefono: z.string().trim().max(50).nullable().optional(),
    asunto: z.string().trim().min(3).max(200),
    mensaje: z.string().trim().min(10).max(5_000)
  })
  .strict();

export const esquemaListarConsultas = z
  .object({
    estado: z.enum(estadosConsulta).optional(),
    cursoId: esquemaIdentificador.optional(),
    correo: esquemaCorreo.optional(),
    buscar: z.string().trim().max(200).optional(),
    fechaDesde: z.coerce.date().optional(),
    fechaHasta: z.coerce.date().optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(12)
  })
  .strict()
  .superRefine((datos, contexto) => {
    if (datos.fechaDesde && datos.fechaHasta && datos.fechaDesde > datos.fechaHasta) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fechaHasta'],
        message: 'La fecha final debe ser posterior o igual a la fecha inicial.'
      });
    }
  });

export const esquemaCambiarEstadoConsulta = z.object({ estado: z.enum(estadosConsulta) }).strict();

export const esquemaIdentificadorConsulta = esquemaIdentificador;

export const inquiriesSchemas = Object.freeze({
  crear: esquemaCrearConsulta,
  listar: esquemaListarConsultas,
  cambiarEstado: esquemaCambiarEstadoConsulta,
  identificador: esquemaIdentificadorConsulta
});
