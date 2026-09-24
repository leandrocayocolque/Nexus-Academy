import { Router } from 'express';
import { manejadorAsync } from '../../shared/utils/asyncHandler.js';
import { crearControladorNegocio } from './business.controller.js';

export function crearRutasNegocio(servicio) {
  const controlador = crearControladorNegocio(servicio);
  const publicas = Router();
  const administracion = Router();

  publicas.get('/', manejadorAsync(controlador.obtener));
  administracion.put('/', manejadorAsync(controlador.actualizar));

  return { publicas, administracion };
}
