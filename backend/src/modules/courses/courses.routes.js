import { Router } from 'express';
import { configuracionSeguridad } from '../../config/security.js';
import { cargaImagenes } from '../../shared/middlewares/upload.js';
import { manejadorAsync } from '../../shared/utils/asyncHandler.js';
import { crearControladorCursos } from './courses.controller.js';

export function crearRutasCursos(servicioCursos, servicioImagenes) {
  const controlador = crearControladorCursos(servicioCursos, servicioImagenes);
  const publicas = Router();
  const administracion = Router();

  publicas.get('/', manejadorAsync(controlador.listarPublicos));
  publicas.get('/:id', manejadorAsync(controlador.obtenerPublico));

  administracion.get('/', manejadorAsync(controlador.listar));
  administracion.post('/', manejadorAsync(controlador.crear));
  administracion.get('/:id', manejadorAsync(controlador.obtener));
  administracion.patch('/:id', manejadorAsync(controlador.actualizar));
  administracion.delete('/:id', manejadorAsync(controlador.eliminar));
  administracion.patch('/:id/estado', manejadorAsync(controlador.cambiarEstado));
  administracion.patch('/:id/destacado', manejadorAsync(controlador.cambiarDestacado));
  administracion.post(
    '/:id/imagenes',
    cargaImagenes.array('imagenes', configuracionSeguridad.cargaImagenes.cantidadMaxima),
    manejadorAsync(controlador.agregarImagenes)
  );
  administracion.delete('/:id/imagenes/:imagenId', manejadorAsync(controlador.eliminarImagen));

  return { publicas, administracion };
}
