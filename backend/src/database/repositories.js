import { crearRepositorioTokensRestablecimiento } from '../modules/auth/auth.repository.js';
import { crearRepositorioNegocio } from '../modules/business/business.repository.js';
import { crearRepositorioCategorias } from '../modules/categories/categories.repository.js';
import {
  crearRepositorioCursos,
  crearRepositorioImagenesCurso
} from '../modules/courses/courses.repository.js';
import { crearRepositorioDashboard } from '../modules/dashboard/dashboard.repository.js';
import { crearRepositorioConsultas } from '../modules/inquiries/inquiries.repository.js';
import { crearRepositorioPromociones } from '../modules/promotions/promotions.repository.js';
import { crearRepositorioUsuarios } from '../modules/users/users.repository.js';

export function crearRepositorios(cliente) {
  if (!cliente) {
    throw new TypeError('Se requiere un cliente de persistencia compatible con Prisma.');
  }

  return Object.freeze({
    usuarios: crearRepositorioUsuarios(cliente),
    negocio: crearRepositorioNegocio(cliente),
    categorias: crearRepositorioCategorias(cliente),
    cursos: crearRepositorioCursos(cliente),
    imagenesCurso: crearRepositorioImagenesCurso(cliente),
    consultas: crearRepositorioConsultas(cliente),
    promociones: crearRepositorioPromociones(cliente),
    tokensRestablecimiento: crearRepositorioTokensRestablecimiento(cliente),
    dashboard: crearRepositorioDashboard(cliente)
  });
}

export const createRepositories = crearRepositorios;
