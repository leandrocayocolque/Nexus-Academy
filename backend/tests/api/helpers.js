import { vi } from 'vitest';
import { crearAplicacion } from '../../src/app.js';
import { firmarTokenAcceso } from '../../src/shared/security/jwt.js';

export const pasar = (_solicitud, _respuesta, siguiente) => siguiente();

const METODOS_SERVICIOS = Object.freeze({
  autenticacion: [
    'existeAdministrador',
    'registrarAdministrador',
    'autenticar',
    'solicitarRestablecimiento',
    'restablecerContrasena'
  ],
  usuarios: ['obtenerUsuarioActual', 'actualizarPerfil'],
  negocio: ['obtenerNegocio', 'actualizarNegocio'],
  categorias: ['listarCategorias', 'crearCategoria', 'actualizarCategoria', 'eliminarCategoria'],
  cursos: [
    'buscarCursos',
    'obtenerCurso',
    'crearCurso',
    'actualizarCurso',
    'eliminarCurso',
    'activarCurso',
    'destacarCurso'
  ],
  imagenesCurso: ['agregarImagenes', 'eliminarImagen'],
  consultas: [
    'crearConsulta',
    'listarConsultas',
    'obtenerConsulta',
    'cambiarEstadoConsulta',
    'eliminarConsulta'
  ],
  promociones: [
    'listarPromocionesActivas',
    'listarPromocionesAdministracion',
    'obtenerPromocion',
    'crearPromocion',
    'actualizarPromocion',
    'eliminarPromocion'
  ],
  dashboard: ['obtenerDashboard']
});

export function crearServiciosSimulados(reemplazos = {}) {
  const servicios = Object.fromEntries(
    Object.entries(METODOS_SERVICIOS).map(([nombre, metodos]) => [
      nombre,
      Object.fromEntries(metodos.map((metodo) => [metodo, vi.fn().mockResolvedValue({})]))
    ])
  );
  return { ...servicios, ...reemplazos };
}

export function crearAppPrueba(servicios = crearServiciosSimulados(), limitadoresRutas = {}) {
  return crearAplicacion({
    servicios,
    registroHttp: pasar,
    limitador: pasar,
    limitadoresRutas: {
      limitadorInicioSesion: pasar,
      limitadorRestablecimiento: pasar,
      limitadorConsulta: pasar,
      ...limitadoresRutas
    }
  });
}

export const ID_ADMIN = 'admin-1';
export const tokenAdmin = () => `Bearer ${firmarTokenAcceso({ sub: ID_ADMIN, rol: 'ADMIN' })}`;
