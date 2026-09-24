import { z } from 'zod';

export const esquemaPeriodoDashboard = z
  .object({
    desde: z.coerce.date().optional(),
    hasta: z.coerce.date().optional()
  })
  .strict()
  .superRefine((datos, contexto) => {
    if (datos.desde && datos.hasta && datos.desde > datos.hasta) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hasta'],
        message: 'La fecha final debe ser posterior o igual a la fecha inicial.'
      });
    }
  });

export const esquemaLimiteDashboard = z
  .object({ limite: z.coerce.number().int().min(1).max(50).default(10) })
  .strict();

export const esquemaBajaDisponibilidad = z
  .object({
    umbral: z.coerce.number().int().min(0).max(1_000_000).default(5),
    limite: z.coerce.number().int().min(1).max(50).default(10)
  })
  .strict();

export const esquemaDashboardCompleto = z
  .object({
    periodo: esquemaPeriodoDashboard.optional().default({}),
    limite: z.coerce.number().int().min(1).max(50).default(10),
    umbral: z.coerce.number().int().min(0).max(1_000_000).default(5)
  })
  .strict();

export const dashboardSchemas = Object.freeze({
  periodo: esquemaPeriodoDashboard,
  limite: esquemaLimiteDashboard,
  bajaDisponibilidad: esquemaBajaDisponibilidad,
  completo: esquemaDashboardCompleto
});
