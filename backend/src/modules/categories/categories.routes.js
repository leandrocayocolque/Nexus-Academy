import { Router } from 'express';
import { manejadorAsync } from '../../shared/utils/asyncHandler.js';
import { crearControladorCategorias } from './categories.controller.js';

export function crearRutasCategorias(servicio) {
  const controlador = crearControladorCategorias(servicio);
  const publicas = Router();
  const administracion = Router();

  publicas.get('/', manejadorAsync(controlador.listarPublicas));

  administracion.get('/', manejadorAsync(controlador.listar));
  administracion.post('/', manejadorAsync(controlador.crear));
  administracion.patch('/:id', manejadorAsync(controlador.actualizar));
  administracion.delete('/:id', manejadorAsync(controlador.eliminar));

  return { publicas, administracion };
}
