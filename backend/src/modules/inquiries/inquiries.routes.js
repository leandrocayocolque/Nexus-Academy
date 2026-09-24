import { Router } from 'express';
import { manejadorAsync } from '../../shared/utils/asyncHandler.js';
import { crearControladorConsultas } from './inquiries.controller.js';

export function crearRutasConsultas(servicio, { limitadorConsulta }) {
  const controlador = crearControladorConsultas(servicio);
  const publicas = Router();
  const administracion = Router();

  publicas.post('/', limitadorConsulta, manejadorAsync(controlador.crear));

  administracion.get('/', manejadorAsync(controlador.listar));
  administracion.get('/:id', manejadorAsync(controlador.obtener));
  administracion.patch('/:id/estado', manejadorAsync(controlador.cambiarEstado));
  administracion.delete('/:id', manejadorAsync(controlador.eliminar));

  return { publicas, administracion };
}
