import { Router } from 'express';
import { manejadorAsync } from '../../shared/utils/asyncHandler.js';
import { crearControladorUsuarios } from './users.controller.js';

export function crearRutasUsuarios(servicio) {
  const controlador = crearControladorUsuarios(servicio);
  const rutas = Router();

  rutas.get('/me', manejadorAsync(controlador.obtenerPerfil));
  rutas.patch('/me', manejadorAsync(controlador.actualizarPerfil));

  return rutas;
}
