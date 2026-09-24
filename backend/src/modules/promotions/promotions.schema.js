import { z } from 'zod';
import { estadosPromocion } from '../../shared/constants/promotion.enums.js';

const esquemaIdentificador = z.string().trim().min(1).max(100);
const esquemaTitulo = z.string().trim().min(3).max(180);
const esquemaDescripcion = z.string().trim().max(2_000).nullable();
const esquemaPorcentaje = z.coerce.number().int().min(0).max(100);
const esquemaFechaNullable = z.preprocess(
  (valor) => (valor === null ? null : valor),
  z.coerce.date().nullable()
);

function validarFechas(datos, contexto) {
  if (datos.fechaInicio && datos.fechaFin && datos.fechaInicio > datos.fechaFin) {
    contexto.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fechaFin'],
      message: 'La fecha final debe ser posterior o igual a la fecha inicial.'
    });
  }
}

export const esquemaCrearPromocion = z
  .object({
    cursoId: esquemaIdentificador.nullable().optional(),
    titulo: esquemaTitulo,
    descripcion: esquemaDescripcion.optional(),
    porcentajeDescuento: esquemaPorcentaje,
    estado: z.enum(estadosPromocion).optional().default('ACTIVA'),
    fechaInicio: esquemaFechaNullable.optional(),
    fechaFin: esquemaFechaNullable.optional()
  })
  .strict()
  .superRefine(validarFechas);

export const esquemaActualizarPromocion = z
  .object({
    cursoId: esquemaIdentificador.nullable().optional(),
    titulo: esquemaTitulo.optional(),
    descripcion: esquemaDescripcion.optional(),
    porcentajeDescuento: esquemaPorcentaje.optional(),
    estado: z.enum(estadosPromocion).optional(),
    fechaInicio: esquemaFechaNullable.optional(),
    fechaFin: esquemaFechaNullable.optional()
  })
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar la promoción.'
  })
  .superRefine(validarFechas);

const camposListado = {
  cursoId: esquemaIdentificador.optional(),
  buscar: z.string().trim().max(200).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(12)
};

export const esquemaListarPromocionesActivas = z.object(camposListado).strict();

export const esquemaListarPromocionesAdministracion = z
  .object({
    ...camposListado,
    estado: z.enum(estadosPromocion).optional()
  })
  .strict();

export const esquemaIdentificadorPromocion = esquemaIdentificador;

export const promotionsSchemas = Object.freeze({
  crear: esquemaCrearPromocion,
  actualizar: esquemaActualizarPromocion,
  listarActivas: esquemaListarPromocionesActivas,
  listarAdministracion: esquemaListarPromocionesAdministracion,
  identificador: esquemaIdentificadorPromocion
});
