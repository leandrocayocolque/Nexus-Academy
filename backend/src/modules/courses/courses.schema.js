import { z } from 'zod';
import { modalidadesCurso, nivelesCurso } from '../../shared/constants/course.enums.js';

const esquemaIdentificador = z.string().trim().min(1).max(100);
const esquemaTitulo = z.string().trim().min(3).max(180);
const esquemaDescripcion = z.string().trim().max(5_000).nullable();
const esquemaDuracion = z.string().trim().min(1).max(100);
const esquemaCupos = z.coerce.number().int().min(0).max(1_000_000);
const esquemaFecha = z.coerce.date();

const esquemaBooleanoConsulta = z.preprocess((valor) => {
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  return valor;
}, z.boolean());

function normalizarPrecio(valor) {
  const [entero, decimales = ''] = String(valor).split('.');
  return `${entero}.${decimales.padEnd(2, '0')}`;
}

export const esquemaPrecio = z.preprocess(
  (valor) => (typeof valor === 'number' ? String(valor) : valor),
  z
    .string()
    .trim()
    .regex(/^\d{1,8}(?:\.\d{1,2})?$/, 'El precio debe ser un decimal válido con hasta 2 decimales.')
    .refine((valor) => Number(valor) >= 0, 'El precio no puede ser negativo.')
    .transform(normalizarPrecio)
);

export const esquemaCrearCurso = z
  .object({
    categoriaId: esquemaIdentificador,
    titulo: esquemaTitulo,
    descripcion: esquemaDescripcion.optional(),
    duracion: esquemaDuracion,
    cuposDisponibles: esquemaCupos,
    fechaInicio: esquemaFecha,
    precio: esquemaPrecio,
    nivel: z.enum(nivelesCurso),
    modalidad: z.enum(modalidadesCurso),
    activo: z.boolean().optional().default(true),
    destacado: z.boolean().optional().default(false)
  })
  .strict();

export const esquemaActualizarCurso = z
  .object({
    categoriaId: esquemaIdentificador.optional(),
    titulo: esquemaTitulo.optional(),
    descripcion: esquemaDescripcion.optional(),
    duracion: esquemaDuracion.optional(),
    cuposDisponibles: esquemaCupos.optional(),
    fechaInicio: esquemaFecha.optional(),
    precio: esquemaPrecio.optional(),
    nivel: z.enum(nivelesCurso).optional(),
    modalidad: z.enum(modalidadesCurso).optional(),
    activo: z.boolean().optional(),
    destacado: z.boolean().optional()
  })
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar el curso.'
  });

export const esquemaBuscarCursos = z
  .object({
    buscar: z.string().trim().max(200).optional(),
    categoria: z.string().trim().min(1).max(160).optional(),
    nivel: z.enum(nivelesCurso).optional(),
    modalidad: z.enum(modalidadesCurso).optional(),
    precioMinimo: esquemaPrecio.optional(),
    precioMaximo: esquemaPrecio.optional(),
    disponible: esquemaBooleanoConsulta.optional(),
    destacado: esquemaBooleanoConsulta.optional(),
    fechaInicio: esquemaFecha.optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(12),
    ordenarPor: z
      .enum(['titulo', 'precio', 'fechaInicio', 'creadoEn', 'cuposDisponibles', 'destacado'])
      .default('fechaInicio'),
    direccion: z.enum(['asc', 'desc']).default('asc')
  })
  .strict()
  .superRefine((datos, contexto) => {
    if (
      datos.precioMinimo !== undefined &&
      datos.precioMaximo !== undefined &&
      Number(datos.precioMinimo) > Number(datos.precioMaximo)
    ) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['precioMaximo'],
        message: 'El precio máximo debe ser mayor o igual que el precio mínimo.'
      });
    }
  });

export const esquemaEstadoCurso = z.object({ activo: z.boolean() }).strict();

export const esquemaDestacadoCurso = z.object({ destacado: z.boolean() }).strict();

export const esquemaIdentificadorCurso = esquemaIdentificador;

export const coursesSchemas = Object.freeze({
  crear: esquemaCrearCurso,
  actualizar: esquemaActualizarCurso,
  buscar: esquemaBuscarCursos,
  estado: esquemaEstadoCurso,
  destacado: esquemaDestacadoCurso,
  identificador: esquemaIdentificadorCurso
});
