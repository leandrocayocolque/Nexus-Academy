import { z } from 'zod';
import { configuracionSeguridad } from '../../config/security.js';
import { registro } from '../../config/logger.js';
import {
  ErrorArchivoInvalido,
  ErrorCursoNoEncontrado,
  ErrorImagenNoEncontrada,
  ErrorLimiteImagenes
} from '../../shared/errors/AppError.js';
import { esquemaIdentificadorCurso } from './courses.schema.js';

const MAXIMO_POR_CURSO = configuracionSeguridad.cargaImagenes.cantidadMaximaPorCurso;

export const esquemaAgregarImagenes = z
  .object({ textoAlternativo: z.string().trim().max(300).optional() })
  .strict();

function exigirMetodo(objeto, metodo, nombre) {
  if (!objeto || typeof objeto[metodo] !== 'function') {
    throw new TypeError(`La dependencia ${nombre} debe implementar ${metodo}().`);
  }
}

function comienzaCon(buffer, bytes, desplazamiento = 0) {
  return bytes.every((byte, indice) => buffer[desplazamiento + indice] === byte);
}

// El mimetype lo declara el cliente; se contrasta con la firma real del archivo.
function firmaCoincide({ buffer, mimetype }) {
  if (!Buffer.isBuffer(buffer)) return false;
  if (mimetype === 'image/jpeg') return comienzaCon(buffer, [0xff, 0xd8, 0xff]);
  if (mimetype === 'image/png') return comienzaCon(buffer, [0x89, 0x50, 0x4e, 0x47]);
  if (mimetype === 'image/webp') {
    return (
      comienzaCon(buffer, [0x52, 0x49, 0x46, 0x46]) &&
      comienzaCon(buffer, [0x57, 0x45, 0x42, 0x50], 8)
    );
  }
  return false;
}

export function crearServicioImagenesCurso({
  repositorioCursos,
  repositorioImagenes,
  gestorTransacciones,
  proveedorImagenes,
  registrador = registro,
  maximoPorCurso = MAXIMO_POR_CURSO
} = {}) {
  exigirMetodo(repositorioCursos, 'buscarPorId', 'repositorioCursos');
  exigirMetodo(repositorioImagenes, 'buscarPorId', 'repositorioImagenes');
  exigirMetodo(repositorioImagenes, 'eliminar', 'repositorioImagenes');
  exigirMetodo(gestorTransacciones, 'ejecutar', 'gestorTransacciones');
  exigirMetodo(proveedorImagenes, 'subir', 'proveedorImagenes');
  exigirMetodo(proveedorImagenes, 'eliminar', 'proveedorImagenes');
  exigirMetodo(registrador, 'warn', 'registrador');

  async function eliminarExternas(idsPublicos, contexto) {
    const resultados = await Promise.allSettled(
      idsPublicos.map((idPublico) => proveedorImagenes.eliminar(idPublico))
    );
    resultados.forEach((resultado, indice) => {
      if (resultado.status === 'rejected') {
        registrador.warn(
          { error: resultado.reason, ...contexto, idPublico: idsPublicos[indice] },
          'No se pudo eliminar una imagen externa'
        );
      }
    });
  }

  return Object.freeze({
    async agregarImagenes(id, archivos, entrada = {}) {
      const cursoId = esquemaIdentificadorCurso.parse(id);
      const { textoAlternativo } = esquemaAgregarImagenes.parse(entrada ?? {});
      if (!Array.isArray(archivos) || archivos.length === 0) {
        throw new ErrorArchivoInvalido('Debe adjuntar al menos una imagen en el campo "imagenes".');
      }
      if (!archivos.every(firmaCoincide)) {
        throw new ErrorArchivoInvalido(
          'El contenido del archivo no corresponde a su tipo de imagen.'
        );
      }

      const curso = await repositorioCursos.buscarPorId(cursoId);
      if (!curso) throw new ErrorCursoNoEncontrado();

      const existentes = curso.imagenes ?? [];
      if (existentes.length + archivos.length > maximoPorCurso) {
        throw new ErrorLimiteImagenes(maximoPorCurso);
      }

      const subidas = await Promise.allSettled(
        archivos.map((archivo) => proveedorImagenes.subir(archivo))
      );
      const exitosas = subidas
        .filter((resultado) => resultado.status === 'fulfilled')
        .map((resultado) => resultado.value);
      const fallida = subidas.find((resultado) => resultado.status === 'rejected');
      if (fallida) {
        await eliminarExternas(
          exitosas.map((imagen) => imagen.idPublico),
          { cursoId }
        );
        throw fallida.reason;
      }

      const ordenBase =
        existentes.reduce((maximo, imagen) => Math.max(maximo, imagen.orden), -1) + 1;
      try {
        return await gestorTransacciones.ejecutar(async (repositorios) => {
          const creadas = [];
          for (const [indice, imagen] of exitosas.entries()) {
            creadas.push(
              await repositorios.imagenesCurso.crear({
                cursoId,
                url: imagen.url,
                idPublico: imagen.idPublico,
                textoAlternativo: textoAlternativo ?? curso.titulo,
                orden: ordenBase + indice
              })
            );
          }
          return creadas;
        });
      } catch (error) {
        await eliminarExternas(
          exitosas.map((imagen) => imagen.idPublico),
          { cursoId }
        );
        throw error;
      }
    },

    async eliminarImagen(id, idImagen) {
      const cursoId = esquemaIdentificadorCurso.parse(id);
      const imagenId = esquemaIdentificadorCurso.parse(idImagen);
      if (!(await repositorioCursos.buscarPorId(cursoId))) throw new ErrorCursoNoEncontrado();

      const imagen = await repositorioImagenes.buscarPorId(imagenId);
      if (!imagen || imagen.cursoId !== cursoId) throw new ErrorImagenNoEncontrada();

      await repositorioImagenes.eliminar(imagenId);
      if (imagen.idPublico) await eliminarExternas([imagen.idPublico], { cursoId, imagenId });

      return { mensaje: 'La imagen fue eliminada correctamente.' };
    }
  });
}

export const courseImagesService = Object.freeze({ crear: crearServicioImagenesCurso });
