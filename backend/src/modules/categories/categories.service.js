import {
  ErrorReferenciaPersistencia,
  ErrorUnicidadPersistencia
} from '../../database/erroresPersistencia.js';
import {
  ErrorCategoriaDuplicada,
  ErrorCategoriaEnUso,
  ErrorCategoriaNoEncontrada
} from '../../shared/errors/AppError.js';
import { crearSlug } from '../../shared/utils/slug.js';
import {
  esquemaActualizarCategoria,
  esquemaCrearCategoria,
  esquemaIdentificadorCategoria,
  esquemaListarCategorias
} from './categories.schema.js';

function exigirMetodo(objeto, metodo, nombre) {
  if (!objeto || typeof objeto[metodo] !== 'function') {
    throw new TypeError(`La dependencia ${nombre} debe implementar ${metodo}().`);
  }
}

function esErrorUnicidad(error) {
  return error instanceof ErrorUnicidadPersistencia || error?.codigo === 'VALOR_DUPLICADO';
}

function mapearCategoria(categoria) {
  if (!categoria) return categoria;
  const { _count, ...datos } = categoria;
  return _count ? { ...datos, cantidadCursos: _count.cursos } : datos;
}

export function crearServicioCategorias({ repositorioCategorias } = {}) {
  for (const metodo of [
    'buscarPorId',
    'buscarPorSlug',
    'existePorSlug',
    'existePorNombre',
    'listar',
    'crear',
    'actualizar',
    'eliminar'
  ]) {
    exigirMetodo(repositorioCategorias, metodo, 'repositorioCategorias');
  }

  return Object.freeze({
    async crearCategoria(entrada) {
      const datos = esquemaCrearCategoria.parse(entrada);
      const slug = crearSlug(datos.nombre);
      if (
        (await repositorioCategorias.existePorSlug(slug)) ||
        (await repositorioCategorias.existePorNombre(datos.nombre))
      ) {
        throw new ErrorCategoriaDuplicada();
      }

      try {
        return mapearCategoria(await repositorioCategorias.crear({ ...datos, slug }));
      } catch (error) {
        if (esErrorUnicidad(error)) throw new ErrorCategoriaDuplicada();
        throw error;
      }
    },

    async actualizarCategoria(id, entrada) {
      const categoriaId = esquemaIdentificadorCategoria.parse(id);
      const datos = esquemaActualizarCategoria.parse(entrada);
      const actual = await repositorioCategorias.buscarPorId(categoriaId);
      if (!actual) throw new ErrorCategoriaNoEncontrada();

      const slug = datos.nombre === undefined ? undefined : crearSlug(datos.nombre);
      if (datos.nombre !== undefined) {
        const existeDuplicada =
          (slug !== actual.slug &&
            (await repositorioCategorias.existePorSlug(slug, categoriaId))) ||
          (await repositorioCategorias.existePorNombre(datos.nombre, categoriaId));
        if (existeDuplicada) throw new ErrorCategoriaDuplicada();
      }

      try {
        return mapearCategoria(
          await repositorioCategorias.actualizar(categoriaId, {
            ...datos,
            ...(slug ? { slug } : {})
          })
        );
      } catch (error) {
        if (esErrorUnicidad(error)) throw new ErrorCategoriaDuplicada();
        throw error;
      }
    },

    async eliminarCategoria(id) {
      const categoriaId = esquemaIdentificadorCategoria.parse(id);
      if (!(await repositorioCategorias.buscarPorId(categoriaId))) {
        throw new ErrorCategoriaNoEncontrada();
      }

      try {
        await repositorioCategorias.eliminar(categoriaId);
      } catch (error) {
        if (
          error instanceof ErrorReferenciaPersistencia ||
          error?.codigo === 'REFERENCIA_INVALIDA'
        ) {
          throw new ErrorCategoriaEnUso();
        }
        throw error;
      }
      return { mensaje: 'La categoría fue eliminada correctamente.' };
    },

    async obtenerCategoria(id) {
      const categoria = await repositorioCategorias.buscarPorId(
        esquemaIdentificadorCategoria.parse(id)
      );
      if (!categoria) throw new ErrorCategoriaNoEncontrada();
      return mapearCategoria(categoria);
    },

    async obtenerCategoriaPorSlug(slug) {
      const categoria = await repositorioCategorias.buscarPorSlug(
        crearSlug(esquemaIdentificadorCategoria.parse(slug))
      );
      if (!categoria) throw new ErrorCategoriaNoEncontrada();
      return mapearCategoria(categoria);
    },

    async listarCategorias(entrada = {}) {
      const resultado = await repositorioCategorias.listar(esquemaListarCategorias.parse(entrada));
      return { ...resultado, datos: resultado.datos.map(mapearCategoria) };
    }
  });
}

export const categoriesService = Object.freeze({ crear: crearServicioCategorias });
