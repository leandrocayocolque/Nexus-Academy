import { z } from 'zod';

const esquemaIdentificador = z.string().trim().min(1).max(100);
const esquemaNombreCategoria = z.string().trim().min(2).max(120);
const esquemaBooleanoConsulta = z.preprocess((valor) => {
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  return valor;
}, z.boolean());

export const esquemaCrearCategoria = z
  .object({
    nombre: esquemaNombreCategoria,
    descripcion: z.string().trim().max(1_000).nullable().optional(),
    activa: z.boolean().optional().default(true)
  })
  .strict();

export const esquemaActualizarCategoria = z
  .object({
    nombre: esquemaNombreCategoria.optional(),
    descripcion: z.string().trim().max(1_000).nullable().optional(),
    activa: z.boolean().optional()
  })
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar la categoría.'
  });

export const esquemaListarCategorias = z
  .object({
    buscar: z.string().trim().max(200).optional(),
    activa: esquemaBooleanoConsulta.optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(12)
  })
  .strict();

export const esquemaIdentificadorCategoria = esquemaIdentificador;

export const categoriesSchemas = Object.freeze({
  crear: esquemaCrearCategoria,
  actualizar: esquemaActualizarCategoria,
  listar: esquemaListarCategorias,
  identificador: esquemaIdentificadorCategoria
});
