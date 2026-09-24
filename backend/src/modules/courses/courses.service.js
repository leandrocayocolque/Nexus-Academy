import { registro } from '../../config/logger.js';
import {
  ErrorReferenciaPersistencia,
  ErrorUnicidadPersistencia
} from '../../database/erroresPersistencia.js';
import {
  ErrorCategoriaNoEncontrada,
  ErrorCursoDuplicado,
  ErrorCursoNoEncontrado
} from '../../shared/errors/AppError.js';
import { mapearCurso } from '../../shared/mappers/persistencia.js';
import { crearSlug } from '../../shared/utils/slug.js';
import {
  esquemaActualizarCurso,
  esquemaBuscarCursos,
  esquemaCrearCurso,
  esquemaDestacadoCurso,
  esquemaEstadoCurso,
  esquemaIdentificadorCurso
} from './courses.schema.js';

function exigirMetodo(objeto, metodo, nombre) {
  if (!objeto || typeof objeto[metodo] !== 'function') {
    throw new TypeError(`La dependencia ${nombre} debe implementar ${metodo}().`);
  }
}

function esErrorUnicidad(error) {
  return error instanceof ErrorUnicidadPersistencia || error?.codigo === 'VALOR_DUPLICADO';
}

async function exigirCategoria(repositorioCategorias, categoriaId) {
  if (!(await repositorioCategorias.buscarPorId(categoriaId))) {
    throw new ErrorCategoriaNoEncontrada();
  }
}

export function crearServicioCursos({
  repositorioCursos,
  repositorioCategorias,
  proveedorImagenes,
  registrador = registro
} = {}) {
  for (const metodo of [
    'buscarPorId',
    'buscarPorSlug',
    'existePorSlug',
    'listar',
    'crear',
    'actualizar',
    'eliminar'
  ]) {
    exigirMetodo(repositorioCursos, metodo, 'repositorioCursos');
  }
  exigirMetodo(repositorioCategorias, 'buscarPorId', 'repositorioCategorias');
  exigirMetodo(proveedorImagenes, 'eliminar', 'proveedorImagenes');
  exigirMetodo(registrador, 'warn', 'registrador');

  return Object.freeze({
    async crearCurso(entrada) {
      const datos = esquemaCrearCurso.parse(entrada);
      await exigirCategoria(repositorioCategorias, datos.categoriaId);
      const slug = crearSlug(datos.titulo);
      if (await repositorioCursos.existePorSlug(slug)) throw new ErrorCursoDuplicado();

      try {
        return mapearCurso(await repositorioCursos.crear({ ...datos, slug }));
      } catch (error) {
        if (esErrorUnicidad(error)) throw new ErrorCursoDuplicado();
        if (
          error instanceof ErrorReferenciaPersistencia ||
          error?.codigo === 'REFERENCIA_INVALIDA'
        ) {
          throw new ErrorCategoriaNoEncontrada();
        }
        throw error;
      }
    },

    async actualizarCurso(id, entrada) {
      const cursoId = esquemaIdentificadorCurso.parse(id);
      const datos = esquemaActualizarCurso.parse(entrada);
      const actual = await repositorioCursos.buscarPorId(cursoId);
      if (!actual) throw new ErrorCursoNoEncontrado();
      if (datos.categoriaId !== undefined) {
        await exigirCategoria(repositorioCategorias, datos.categoriaId);
      }

      const slug = datos.titulo === undefined ? undefined : crearSlug(datos.titulo);
      if (slug && slug !== actual.slug && (await repositorioCursos.existePorSlug(slug, cursoId))) {
        throw new ErrorCursoDuplicado();
      }

      try {
        return mapearCurso(
          await repositorioCursos.actualizar(cursoId, {
            ...datos,
            ...(slug ? { slug } : {})
          })
        );
      } catch (error) {
        if (esErrorUnicidad(error)) throw new ErrorCursoDuplicado();
        if (
          error instanceof ErrorReferenciaPersistencia ||
          error?.codigo === 'REFERENCIA_INVALIDA'
        ) {
          throw new ErrorCategoriaNoEncontrada();
        }
        throw error;
      }
    },

    async eliminarCurso(id) {
      const cursoId = esquemaIdentificadorCurso.parse(id);
      const curso = await repositorioCursos.buscarPorId(cursoId);
      if (!curso) throw new ErrorCursoNoEncontrado();

      await repositorioCursos.eliminar(cursoId);

      const imagenesExternas = (curso.imagenes ?? []).filter((imagen) => imagen.idPublico);
      const resultados = await Promise.allSettled(
        imagenesExternas.map((imagen) => proveedorImagenes.eliminar(imagen.idPublico))
      );
      resultados.forEach((resultado, indice) => {
        if (resultado.status === 'rejected') {
          registrador.warn(
            {
              error: resultado.reason,
              cursoId,
              idPublico: imagenesExternas[indice].idPublico
            },
            'No se pudo eliminar una imagen externa del curso eliminado'
          );
        }
      });

      return { mensaje: 'El curso fue eliminado correctamente.' };
    },

    async obtenerCurso(id) {
      const curso = await repositorioCursos.buscarPorId(esquemaIdentificadorCurso.parse(id));
      if (!curso) throw new ErrorCursoNoEncontrado();
      return mapearCurso(curso);
    },

    async obtenerCursoPorSlug(slug) {
      const curso = await repositorioCursos.buscarPorSlug(
        crearSlug(esquemaIdentificadorCurso.parse(slug))
      );
      if (!curso) throw new ErrorCursoNoEncontrado();
      return mapearCurso(curso);
    },

    async buscarCursos(entrada = {}) {
      const datos = esquemaBuscarCursos.parse(entrada);
      const { categoria, fechaInicio, ...filtros } = datos;
      const resultado = await repositorioCursos.listar({
        ...filtros,
        ...(categoria ? { slugCategoria: crearSlug(categoria) } : {}),
        ...(fechaInicio ? { fechaDesde: fechaInicio } : {})
      });
      return { ...resultado, datos: resultado.datos.map(mapearCurso) };
    },

    async activarCurso(id, entrada) {
      const cursoId = esquemaIdentificadorCurso.parse(id);
      const { activo } = esquemaEstadoCurso.parse(entrada);
      if (!(await repositorioCursos.buscarPorId(cursoId))) throw new ErrorCursoNoEncontrado();
      return mapearCurso(await repositorioCursos.actualizar(cursoId, { activo }));
    },

    async destacarCurso(id, entrada) {
      const cursoId = esquemaIdentificadorCurso.parse(id);
      const { destacado } = esquemaDestacadoCurso.parse(entrada);
      if (!(await repositorioCursos.buscarPorId(cursoId))) throw new ErrorCursoNoEncontrado();
      return mapearCurso(await repositorioCursos.actualizar(cursoId, { destacado }));
    }
  });
}

export const coursesService = Object.freeze({ crear: crearServicioCursos });
