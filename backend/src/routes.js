import { Router } from 'express';
import { crearRutasAutenticacion } from './modules/auth/auth.routes.js';
import { crearRutasNegocio } from './modules/business/business.routes.js';
import { crearRutasCategorias } from './modules/categories/categories.routes.js';
import { crearRutasCursos } from './modules/courses/courses.routes.js';
import { crearRutasDashboard } from './modules/dashboard/dashboard.routes.js';
import { crearRutasConsultas } from './modules/inquiries/inquiries.routes.js';
import { crearRutasPromociones } from './modules/promotions/promotions.routes.js';
import { crearRutasUsuarios } from './modules/users/users.routes.js';
import { autenticar } from './shared/middlewares/authenticate.js';
import { requerirAdmin } from './shared/middlewares/authorize.js';
import {
  limitadorConsulta,
  limitadorInicioSesion,
  limitadorRestablecimiento
} from './shared/middlewares/rateLimiters.js';

const LIMITADORES_POR_DEFECTO = Object.freeze({
  limitadorInicioSesion,
  limitadorRestablecimiento,
  limitadorConsulta
});

export function crearRutasApi({ servicios, limitadores = LIMITADORES_POR_DEFECTO }) {
  const limites = { ...LIMITADORES_POR_DEFECTO, ...limitadores };
  const negocio = crearRutasNegocio(servicios.negocio);
  const categorias = crearRutasCategorias(servicios.categorias);
  const cursos = crearRutasCursos(servicios.cursos, servicios.imagenesCurso);
  const consultas = crearRutasConsultas(servicios.consultas, limites);
  const promociones = crearRutasPromociones(servicios.promociones);
  const dashboard = crearRutasDashboard(servicios.dashboard);

  const administracion = Router();
  administracion.use(autenticar, requerirAdmin);
  administracion.use('/academia', negocio.administracion);
  administracion.use('/categorias', categorias.administracion);
  administracion.use('/cursos', cursos.administracion);
  administracion.use('/consultas', consultas.administracion);
  administracion.use('/promociones', promociones.administracion);
  administracion.use('/dashboard', dashboard.administracion);

  const api = Router();
  api.use('/autenticacion', crearRutasAutenticacion(servicios.autenticacion, limites));
  api.use('/usuarios', autenticar, requerirAdmin, crearRutasUsuarios(servicios.usuarios));
  api.use('/academia', negocio.publicas);
  api.use('/categorias', categorias.publicas);
  api.use('/cursos', cursos.publicas);
  api.use('/consultas', consultas.publicas);
  api.use('/promociones', promociones.publicas);
  api.use('/admin', administracion);

  return api;
}
