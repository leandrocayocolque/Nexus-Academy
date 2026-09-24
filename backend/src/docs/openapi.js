import { modalidadesCurso, nivelesCurso } from '../shared/constants/course.enums.js';
import { estadosConsulta } from '../shared/constants/inquiry.enums.js';
import { estadosPromocion } from '../shared/constants/promotion.enums.js';

const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });
const refRespuesta = (nombre) => ({ $ref: `#/components/responses/${nombre}` });
const json = (schema) => ({ content: { 'application/json': { schema } } });
const cuerpo = (schema) => ({ required: true, ...json(schema) });
const ok = (descripcion, schema) => ({ description: descripcion, ...json(schema) });
const paginado = (nombre) => ({
  type: 'object',
  properties: { datos: { type: 'array', items: ref(nombre) }, paginacion: ref('Paginacion') }
});

const parametroId = (descripcion = 'Identificador del recurso.') => ({
  name: 'id',
  in: 'path',
  required: true,
  description: descripcion,
  schema: { type: 'string' }
});
const consulta = (name, schema, description) => ({ name, in: 'query', schema, description });
const paginacion = [
  consulta('pagina', { type: 'integer', minimum: 1, default: 1 }, 'Número de página.'),
  consulta(
    'limite',
    { type: 'integer', minimum: 1, maximum: 100, default: 12 },
    'Tamaño de página.'
  )
];

const erroresComunes = {
  400: refRespuesta('DatosInvalidos'),
  500: refRespuesta('ErrorInterno')
};
const erroresAdmin = {
  ...erroresComunes,
  401: refRespuesta('NoAutenticado'),
  403: refRespuesta('NoAutorizado')
};
const seguridadAdmin = [{ bearerAuth: [] }];

function operacion(tag, summary, { admin = false, respuestas, ...resto }) {
  return {
    tags: [tag],
    summary,
    ...(admin ? { security: seguridadAdmin } : {}),
    ...resto,
    responses: { ...respuestas, ...(admin ? erroresAdmin : erroresComunes) }
  };
}

const respuestaMensaje = (descripcion) => ok(descripcion, ref('Mensaje'));

const cursoEntrada = {
  categoriaId: { type: 'string' },
  titulo: { type: 'string', minLength: 3, maxLength: 180 },
  descripcion: { type: 'string', nullable: true, maxLength: 5000 },
  duracion: { type: 'string', example: '8 semanas' },
  cuposDisponibles: { type: 'integer', minimum: 0 },
  fechaInicio: { type: 'string', format: 'date-time' },
  precio: { type: 'string', example: '399.90' },
  nivel: { type: 'string', enum: [...nivelesCurso] },
  modalidad: { type: 'string', enum: [...modalidadesCurso] },
  activo: { type: 'boolean' },
  destacado: { type: 'boolean' }
};

const negocioEntrada = {
  nombre: { type: 'string', maxLength: 150 },
  descripcion: { type: 'string', nullable: true },
  direccion: { type: 'string', nullable: true },
  telefono: { type: 'string', nullable: true },
  correo: { type: 'string', format: 'email', nullable: true },
  enlacesSociales: {
    type: 'object',
    nullable: true,
    additionalProperties: { type: 'string', format: 'uri' },
    example: { instagram: 'https://instagram.com/nexus' }
  },
  horariosAtencion: {
    type: 'object',
    nullable: true,
    additionalProperties: { type: 'string' },
    example: { lunesAViernes: '09:00 a 18:00' }
  }
};

const promocionEntrada = {
  cursoId: { type: 'string', nullable: true },
  titulo: { type: 'string', minLength: 3, maxLength: 180 },
  descripcion: { type: 'string', nullable: true },
  porcentajeDescuento: { type: 'integer', minimum: 0, maximum: 100 },
  estado: { type: 'string', enum: [...estadosPromocion] },
  fechaInicio: { type: 'string', format: 'date-time', nullable: true },
  fechaFin: { type: 'string', format: 'date-time', nullable: true }
};

const errorRespuesta = (description) => ({ description, ...json(ref('Error')) });

export const especificacionOpenApi = Object.freeze({
  openapi: '3.0.3',
  info: {
    title: 'NEXUS Academy API',
    version: '1.0.0',
    description:
      'API de la plataforma web para pequeños comercios. Las rutas `/api/admin/*` y `/api/usuarios/*` requieren un JWT de administrador en el encabezado `Authorization: Bearer <token>`.'
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Autenticación' },
    { name: 'Usuario' },
    { name: 'Academia' },
    { name: 'Categorías' },
    { name: 'Cursos' },
    { name: 'Imágenes' },
    { name: 'Consultas' },
    { name: 'Promociones' },
    { name: 'Dashboard' },
    { name: 'Sistema' }
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              codigo: { type: 'string' },
              mensaje: { type: 'string' },
              detalles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { campo: { type: 'string' }, mensaje: { type: 'string' } }
                }
              }
            }
          }
        }
      },
      Mensaje: { type: 'object', properties: { mensaje: { type: 'string' } } },
      Paginacion: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          pagina: { type: 'integer' },
          limite: { type: 'integer' },
          paginasTotales: { type: 'integer' }
        }
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          correo: { type: 'string', format: 'email' },
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          rol: { type: 'string', enum: ['ADMIN'] },
          activo: { type: 'boolean' },
          creadoEn: { type: 'string', format: 'date-time' },
          actualizadoEn: { type: 'string', format: 'date-time' }
        }
      },
      Sesion: {
        type: 'object',
        properties: { tokenAcceso: { type: 'string' }, usuario: ref('Usuario') }
      },
      Academia: {
        type: 'object',
        properties: { id: { type: 'string' }, ...negocioEntrada }
      },
      Categoria: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nombre: { type: 'string' },
          slug: { type: 'string' },
          descripcion: { type: 'string', nullable: true },
          activa: { type: 'boolean' },
          cantidadCursos: { type: 'integer' }
        }
      },
      ImagenCurso: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          cursoId: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          idPublico: { type: 'string', nullable: true },
          textoAlternativo: { type: 'string', nullable: true },
          orden: { type: 'integer' }
        }
      },
      Curso: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          slug: { type: 'string' },
          ...cursoEntrada,
          disponible: {
            type: 'boolean',
            description: 'Derivado: activo y con cupos disponibles.'
          },
          categoria: ref('Categoria'),
          imagenes: { type: 'array', items: ref('ImagenCurso') }
        }
      },
      Consulta: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          cursoId: { type: 'string', nullable: true },
          nombre: { type: 'string' },
          correo: { type: 'string', format: 'email' },
          telefono: { type: 'string', nullable: true },
          asunto: { type: 'string' },
          mensaje: { type: 'string' },
          estado: { type: 'string', enum: [...estadosConsulta] },
          creadaEn: { type: 'string', format: 'date-time' }
        }
      },
      Promocion: {
        type: 'object',
        properties: { id: { type: 'string' }, ...promocionEntrada, vigente: { type: 'boolean' } }
      },
      Dashboard: {
        type: 'object',
        properties: {
          resumen: { type: 'object' },
          consultasPorEstado: { type: 'array', items: { type: 'object' } },
          consultasPorMes: { type: 'array', items: { type: 'object' } },
          cursosMasConsultados: { type: 'array', items: ref('Curso') },
          categoriasMasConsultadas: { type: 'array', items: { type: 'object' } },
          cursosConBajaDisponibilidad: { type: 'array', items: ref('Curso') }
        }
      }
    },
    responses: {
      DatosInvalidos: errorRespuesta('Datos inválidos (DATOS_INVALIDOS).'),
      NoAutenticado: errorRespuesta('Token ausente, inválido o expirado (NO_AUTENTICADO).'),
      NoAutorizado: errorRespuesta('Rol sin permisos (NO_AUTORIZADO).'),
      NoEncontrado: errorRespuesta('Recurso inexistente.'),
      Conflicto: errorRespuesta('Conflicto con el estado actual.'),
      LimiteSolicitudes: errorRespuesta('Límite de solicitudes alcanzado.'),
      ErrorInterno: errorRespuesta('Error interno.')
    }
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Estado del servicio',
        responses: { 200: ok('Servicio operativo.', { type: 'object' }) }
      }
    },
    '/api/autenticacion/registro': {
      post: operacion('Autenticación', 'Registrar administrador', {
        description:
          'Sin administradores existentes, el registro es abierto (alta inicial). Luego requiere el JWT de un administrador.',
        security: [{}, { bearerAuth: [] }],
        requestBody: cuerpo({
          type: 'object',
          required: ['correo', 'nombre', 'apellido', 'contrasena', 'confirmarContrasena'],
          properties: {
            correo: { type: 'string', format: 'email' },
            nombre: { type: 'string' },
            apellido: { type: 'string' },
            contrasena: {
              type: 'string',
              description: 'Mínimo 12 caracteres con mayúscula, minúscula y número.'
            },
            confirmarContrasena: { type: 'string' }
          }
        }),
        respuestas: {
          201: ok('Administrador creado.', ref('Usuario')),
          401: refRespuesta('NoAutenticado'),
          403: refRespuesta('NoAutorizado'),
          409: refRespuesta('Conflicto'),
          429: refRespuesta('LimiteSolicitudes')
        }
      })
    },
    '/api/autenticacion/login': {
      post: operacion('Autenticación', 'Iniciar sesión', {
        requestBody: cuerpo({
          type: 'object',
          required: ['correo', 'contrasena'],
          properties: {
            correo: { type: 'string', format: 'email' },
            contrasena: { type: 'string' }
          }
        }),
        respuestas: {
          200: ok('Sesión iniciada.', ref('Sesion')),
          401: errorRespuesta('Credenciales inválidas (CREDENCIALES_INVALIDAS).'),
          429: refRespuesta('LimiteSolicitudes')
        }
      })
    },
    '/api/autenticacion/logout': {
      post: operacion('Autenticación', 'Cerrar sesión', {
        description: 'Operación sin estado: el cliente debe descartar el JWT.',
        admin: true,
        respuestas: { 200: respuestaMensaje('Sesión cerrada.') }
      })
    },
    '/api/autenticacion/recuperar-contrasena': {
      post: operacion('Autenticación', 'Solicitar recuperación de contraseña', {
        description: 'Responde siempre lo mismo para no revelar qué correos existen.',
        requestBody: cuerpo({
          type: 'object',
          required: ['correo'],
          properties: { correo: { type: 'string', format: 'email' } }
        }),
        respuestas: {
          200: respuestaMensaje('Solicitud aceptada.'),
          429: refRespuesta('LimiteSolicitudes')
        }
      })
    },
    '/api/autenticacion/restablecer-contrasena': {
      post: operacion('Autenticación', 'Restablecer contraseña con token', {
        requestBody: cuerpo({
          type: 'object',
          required: ['token', 'contrasenaNueva', 'confirmarContrasenaNueva'],
          properties: {
            token: { type: 'string' },
            contrasenaNueva: { type: 'string' },
            confirmarContrasenaNueva: { type: 'string' }
          }
        }),
        respuestas: {
          200: respuestaMensaje('Contraseña restablecida.'),
          429: refRespuesta('LimiteSolicitudes')
        }
      })
    },
    '/api/usuarios/me': {
      get: operacion('Usuario', 'Obtener perfil propio', {
        admin: true,
        respuestas: { 200: ok('Perfil.', ref('Usuario')) }
      }),
      patch: operacion('Usuario', 'Modificar datos personales', {
        admin: true,
        requestBody: cuerpo({
          type: 'object',
          minProperties: 1,
          properties: {
            correo: { type: 'string', format: 'email' },
            nombre: { type: 'string' },
            apellido: { type: 'string' }
          }
        }),
        respuestas: {
          200: ok('Perfil actualizado.', ref('Usuario')),
          409: refRespuesta('Conflicto')
        }
      })
    },
    '/api/academia': {
      get: operacion('Academia', 'Información institucional pública', {
        respuestas: {
          200: ok('Información de la academia.', ref('Academia')),
          404: refRespuesta('NoEncontrado')
        }
      })
    },
    '/api/admin/academia': {
      put: operacion('Academia', 'Modificar información institucional', {
        admin: true,
        requestBody: cuerpo({ type: 'object', minProperties: 1, properties: negocioEntrada }),
        respuestas: {
          200: ok('Información actualizada.', ref('Academia')),
          404: refRespuesta('NoEncontrado')
        }
      })
    },
    '/api/categorias': {
      get: operacion('Categorías', 'Listar categorías activas', {
        parameters: [consulta('buscar', { type: 'string' }, 'Texto a buscar.'), ...paginacion],
        respuestas: { 200: ok('Listado paginado.', paginado('Categoria')) }
      })
    },
    '/api/admin/categorias': {
      get: operacion('Categorías', 'Listar todas las categorías', {
        admin: true,
        parameters: [
          consulta('buscar', { type: 'string' }),
          consulta('activa', { type: 'boolean' }),
          ...paginacion
        ],
        respuestas: { 200: ok('Listado paginado.', paginado('Categoria')) }
      }),
      post: operacion('Categorías', 'Crear categoría', {
        admin: true,
        requestBody: cuerpo({
          type: 'object',
          required: ['nombre'],
          properties: {
            nombre: { type: 'string' },
            descripcion: { type: 'string', nullable: true },
            activa: { type: 'boolean' }
          }
        }),
        respuestas: {
          201: ok('Categoría creada.', ref('Categoria')),
          409: refRespuesta('Conflicto')
        }
      })
    },
    '/api/admin/categorias/{id}': {
      parameters: [parametroId()],
      patch: operacion('Categorías', 'Modificar categoría', {
        admin: true,
        requestBody: cuerpo({
          type: 'object',
          minProperties: 1,
          properties: {
            nombre: { type: 'string' },
            descripcion: { type: 'string', nullable: true },
            activa: { type: 'boolean' }
          }
        }),
        respuestas: {
          200: ok('Categoría actualizada.', ref('Categoria')),
          404: refRespuesta('NoEncontrado'),
          409: refRespuesta('Conflicto')
        }
      }),
      delete: operacion('Categorías', 'Eliminar categoría', {
        admin: true,
        description: 'Falla con CATEGORIA_EN_USO si tiene cursos asociados.',
        respuestas: {
          200: respuestaMensaje('Categoría eliminada.'),
          404: refRespuesta('NoEncontrado'),
          409: refRespuesta('Conflicto')
        }
      })
    },
    '/api/cursos': {
      get: operacion('Cursos', 'Listar, buscar, filtrar, ordenar y paginar cursos activos', {
        parameters: [
          consulta('buscar', { type: 'string' }, 'Texto en título o descripción.'),
          consulta('categoria', { type: 'string' }, 'Slug o nombre de la categoría.'),
          consulta('nivel', { type: 'string', enum: [...nivelesCurso] }),
          consulta('modalidad', { type: 'string', enum: [...modalidadesCurso] }),
          consulta('precioMinimo', { type: 'string' }),
          consulta('precioMaximo', { type: 'string' }),
          consulta('disponible', { type: 'boolean' }),
          consulta('destacado', { type: 'boolean' }),
          consulta('fechaInicio', { type: 'string', format: 'date' }, 'Cursos desde esta fecha.'),
          consulta('ordenarPor', {
            type: 'string',
            enum: ['titulo', 'precio', 'fechaInicio', 'creadoEn', 'cuposDisponibles', 'destacado'],
            default: 'fechaInicio'
          }),
          consulta('direccion', { type: 'string', enum: ['asc', 'desc'], default: 'asc' }),
          ...paginacion
        ],
        respuestas: { 200: ok('Listado paginado.', paginado('Curso')) }
      })
    },
    '/api/cursos/{id}': {
      parameters: [parametroId()],
      get: operacion('Cursos', 'Detalle de un curso activo', {
        respuestas: { 200: ok('Curso.', ref('Curso')), 404: refRespuesta('NoEncontrado') }
      })
    },
    '/api/admin/cursos': {
      get: operacion('Cursos', 'Listar cursos (incluye inactivos)', {
        admin: true,
        description: 'Acepta los mismos filtros que `GET /api/cursos`.',
        parameters: paginacion,
        respuestas: { 200: ok('Listado paginado.', paginado('Curso')) }
      }),
      post: operacion('Cursos', 'Crear curso', {
        admin: true,
        requestBody: cuerpo({
          type: 'object',
          required: [
            'categoriaId',
            'titulo',
            'duracion',
            'cuposDisponibles',
            'fechaInicio',
            'precio',
            'nivel',
            'modalidad'
          ],
          properties: cursoEntrada
        }),
        respuestas: {
          201: ok('Curso creado.', ref('Curso')),
          404: refRespuesta('NoEncontrado'),
          409: refRespuesta('Conflicto')
        }
      })
    },
    '/api/admin/cursos/{id}': {
      parameters: [parametroId()],
      get: operacion('Cursos', 'Detalle de un curso (incluye inactivos)', {
        admin: true,
        respuestas: { 200: ok('Curso.', ref('Curso')), 404: refRespuesta('NoEncontrado') }
      }),
      patch: operacion('Cursos', 'Modificar curso', {
        admin: true,
        requestBody: cuerpo({ type: 'object', minProperties: 1, properties: cursoEntrada }),
        respuestas: {
          200: ok('Curso actualizado.', ref('Curso')),
          404: refRespuesta('NoEncontrado'),
          409: refRespuesta('Conflicto')
        }
      }),
      delete: operacion('Cursos', 'Eliminar curso', {
        admin: true,
        respuestas: {
          200: respuestaMensaje('Curso eliminado.'),
          404: refRespuesta('NoEncontrado')
        }
      })
    },
    '/api/admin/cursos/{id}/estado': {
      parameters: [parametroId()],
      patch: operacion('Cursos', 'Activar o desactivar curso', {
        admin: true,
        requestBody: cuerpo({
          type: 'object',
          required: ['activo'],
          properties: { activo: { type: 'boolean' } }
        }),
        respuestas: {
          200: ok('Curso actualizado.', ref('Curso')),
          404: refRespuesta('NoEncontrado')
        }
      })
    },
    '/api/admin/cursos/{id}/destacado': {
      parameters: [parametroId()],
      patch: operacion('Cursos', 'Marcar o desmarcar como destacado', {
        admin: true,
        requestBody: cuerpo({
          type: 'object',
          required: ['destacado'],
          properties: { destacado: { type: 'boolean' } }
        }),
        respuestas: {
          200: ok('Curso actualizado.', ref('Curso')),
          404: refRespuesta('NoEncontrado')
        }
      })
    },
    '/api/admin/cursos/{id}/imagenes': {
      parameters: [parametroId('Identificador del curso.')],
      post: operacion('Imágenes', 'Agregar imágenes a un curso', {
        admin: true,
        description:
          'Multipart con hasta 5 archivos JPEG, PNG o WebP de 5 MB en el campo `imagenes`. Máximo 10 imágenes por curso.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['imagenes'],
                properties: {
                  imagenes: { type: 'array', items: { type: 'string', format: 'binary' } },
                  textoAlternativo: { type: 'string' }
                }
              }
            }
          }
        },
        respuestas: {
          201: ok('Imágenes creadas.', { type: 'array', items: ref('ImagenCurso') }),
          404: refRespuesta('NoEncontrado'),
          409: refRespuesta('Conflicto'),
          503: errorRespuesta('Almacenamiento de imágenes no disponible.')
        }
      })
    },
    '/api/admin/cursos/{id}/imagenes/{imagenId}': {
      parameters: [
        parametroId('Identificador del curso.'),
        { name: 'imagenId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      delete: operacion('Imágenes', 'Eliminar imagen de un curso', {
        admin: true,
        respuestas: {
          200: respuestaMensaje('Imagen eliminada.'),
          404: refRespuesta('NoEncontrado')
        }
      })
    },
    '/api/consultas': {
      post: operacion('Consultas', 'Enviar consulta desde el sitio público', {
        requestBody: cuerpo({
          type: 'object',
          required: ['nombre', 'correo', 'asunto', 'mensaje'],
          properties: {
            cursoId: { type: 'string', nullable: true },
            nombre: { type: 'string' },
            correo: { type: 'string', format: 'email' },
            telefono: { type: 'string', nullable: true },
            asunto: { type: 'string' },
            mensaje: { type: 'string', minLength: 10 }
          }
        }),
        respuestas: {
          201: ok('Consulta registrada.', ref('Consulta')),
          404: refRespuesta('NoEncontrado'),
          429: refRespuesta('LimiteSolicitudes')
        }
      })
    },
    '/api/admin/consultas': {
      get: operacion('Consultas', 'Listar consultas recibidas', {
        admin: true,
        parameters: [
          consulta('estado', { type: 'string', enum: [...estadosConsulta] }),
          consulta('cursoId', { type: 'string' }),
          consulta('correo', { type: 'string' }),
          consulta('buscar', { type: 'string' }),
          consulta('fechaDesde', { type: 'string', format: 'date' }),
          consulta('fechaHasta', { type: 'string', format: 'date' }),
          ...paginacion
        ],
        respuestas: { 200: ok('Listado paginado.', paginado('Consulta')) }
      })
    },
    '/api/admin/consultas/{id}': {
      parameters: [parametroId()],
      get: operacion('Consultas', 'Detalle de consulta', {
        admin: true,
        respuestas: { 200: ok('Consulta.', ref('Consulta')), 404: refRespuesta('NoEncontrado') }
      }),
      delete: operacion('Consultas', 'Eliminar consulta', {
        admin: true,
        respuestas: {
          200: respuestaMensaje('Consulta eliminada.'),
          404: refRespuesta('NoEncontrado')
        }
      })
    },
    '/api/admin/consultas/{id}/estado': {
      parameters: [parametroId()],
      patch: operacion('Consultas', 'Cambiar estado de consulta', {
        admin: true,
        requestBody: cuerpo({
          type: 'object',
          required: ['estado'],
          properties: { estado: { type: 'string', enum: [...estadosConsulta] } }
        }),
        respuestas: {
          200: ok('Consulta actualizada.', ref('Consulta')),
          404: refRespuesta('NoEncontrado')
        }
      })
    },
    '/api/promociones': {
      get: operacion('Promociones', 'Listar promociones vigentes', {
        parameters: [
          consulta('cursoId', { type: 'string' }),
          consulta('buscar', { type: 'string' }),
          ...paginacion
        ],
        respuestas: { 200: ok('Listado paginado.', paginado('Promocion')) }
      })
    },
    '/api/admin/promociones': {
      get: operacion('Promociones', 'Listar todas las promociones', {
        admin: true,
        parameters: [
          consulta('estado', { type: 'string', enum: [...estadosPromocion] }),
          consulta('cursoId', { type: 'string' }),
          consulta('buscar', { type: 'string' }),
          ...paginacion
        ],
        respuestas: { 200: ok('Listado paginado.', paginado('Promocion')) }
      }),
      post: operacion('Promociones', 'Crear promoción', {
        admin: true,
        requestBody: cuerpo({
          type: 'object',
          required: ['titulo', 'porcentajeDescuento'],
          properties: promocionEntrada
        }),
        respuestas: {
          201: ok('Promoción creada.', ref('Promocion')),
          404: refRespuesta('NoEncontrado')
        }
      })
    },
    '/api/admin/promociones/{id}': {
      parameters: [parametroId()],
      get: operacion('Promociones', 'Detalle de promoción', {
        admin: true,
        respuestas: {
          200: ok('Promoción.', ref('Promocion')),
          404: refRespuesta('NoEncontrado')
        }
      }),
      patch: operacion('Promociones', 'Modificar promoción', {
        admin: true,
        requestBody: cuerpo({ type: 'object', minProperties: 1, properties: promocionEntrada }),
        respuestas: {
          200: ok('Promoción actualizada.', ref('Promocion')),
          404: refRespuesta('NoEncontrado')
        }
      }),
      delete: operacion('Promociones', 'Eliminar promoción', {
        admin: true,
        respuestas: {
          200: respuestaMensaje('Promoción eliminada.'),
          404: refRespuesta('NoEncontrado')
        }
      })
    },
    '/api/admin/dashboard': {
      get: operacion('Dashboard', 'Métricas y estadísticas administrativas', {
        admin: true,
        parameters: [
          consulta('desde', { type: 'string', format: 'date' }, 'Inicio del período de consultas.'),
          consulta('hasta', { type: 'string', format: 'date' }, 'Fin del período de consultas.'),
          consulta('limite', { type: 'integer', minimum: 1, maximum: 50, default: 10 }),
          consulta(
            'umbral',
            { type: 'integer', minimum: 0, default: 5 },
            'Cupos para considerar baja disponibilidad.'
          )
        ],
        respuestas: { 200: ok('Métricas.', ref('Dashboard')) }
      })
    }
  }
});

// Se serializa y ejecuta en el navegador: debe ser autocontenida.
function autorizarConLogin(respuesta) {
  try {
    const esLogin = /\/api\/autenticacion\/login$/.test(respuesta.url);
    const token = respuesta.ok && respuesta.obj && respuesta.obj.tokenAcceso;
    if (esLogin && token) globalThis.ui.preauthorizeApiKey('bearerAuth', token);
  } catch {
    // La documentación sigue funcionando aunque no pueda autorizar sola.
  }
  return respuesta;
}

export const opcionesSwaggerUi = Object.freeze({
  customSiteTitle: 'NEXUS Academy API',
  swaggerOptions: {
    persistAuthorization: true,
    responseInterceptor: autorizarConLogin
  }
});
