import { Router } from 'express';
import { autenticar } from '../../shared/middlewares/authenticate.js';
import { requerirAdmin } from '../../shared/middlewares/authorize.js';
import { manejadorAsync } from '../../shared/utils/asyncHandler.js';
import { crearControladorAutenticacion } from './auth.controller.js';

export function crearRutasAutenticacion(
  servicio,
  { limitadorInicioSesion, limitadorRestablecimiento }
) {
  const controlador = crearControladorAutenticacion(servicio);
  const rutas = Router();

  rutas.post(
    '/registro',
    limitadorInicioSesion,
    autenticar,
    requerirAdmin,
    manejadorAsync(controlador.registrar)
  );
  rutas.post('/login', limitadorInicioSesion, manejadorAsync(controlador.iniciarSesion));
  rutas.post('/logout', autenticar, controlador.cerrarSesion);
  rutas.post(
    '/recuperar-contrasena',
    limitadorRestablecimiento,
    manejadorAsync(controlador.solicitarRestablecimiento)
  );
  rutas.post(
    '/restablecer-contrasena',
    limitadorRestablecimiento,
    manejadorAsync(controlador.restablecerContrasena)
  );

  return rutas;
}
