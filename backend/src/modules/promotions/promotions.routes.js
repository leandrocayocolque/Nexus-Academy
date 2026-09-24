import { Router } from 'express';
import { manejadorAsync } from '../../shared/utils/asyncHandler.js';
import { crearControladorPromociones } from './promotions.controller.js';

export function crearRutasPromociones(servicio) {
  const controlador = crearControladorPromociones(servicio);
  const publicas = Router();
  const administracion = Router();

  publicas.get('/', manejadorAsync(controlador.listarActivas));

  administracion.get('/', manejadorAsync(controlador.listar));
  administracion.post('/', manejadorAsync(controlador.crear));
  administracion.get('/:id', manejadorAsync(controlador.obtener));
  administracion.patch('/:id', manejadorAsync(controlador.actualizar));
  administracion.delete('/:id', manejadorAsync(controlador.eliminar));

  return { publicas, administracion };
}
