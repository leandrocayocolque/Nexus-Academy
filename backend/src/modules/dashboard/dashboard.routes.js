import { Router } from 'express';
import { manejadorAsync } from '../../shared/utils/asyncHandler.js';
import { crearControladorDashboard } from './dashboard.controller.js';

export function crearRutasDashboard(servicio) {
  const controlador = crearControladorDashboard(servicio);
  const administracion = Router();

  administracion.get('/', manejadorAsync(controlador.obtener));

  return { administracion };
}
