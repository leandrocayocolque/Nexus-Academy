import { Router } from 'express';
import { ErrorAutenticacion } from '../../shared/errors/AppError.js';
import { autenticar } from '../../shared/middlewares/authenticate.js';
import { requerirAdmin } from '../../shared/middlewares/authorize.js';
import { manejadorAsync } from '../../shared/utils/asyncHandler.js';
import { crearControladorAutenticacion } from './auth.controller.js';

// El primer administrador puede registrarse sin token; los siguientes requieren un ADMIN autenticado.
function crearAutorizacionRegistro(servicio) {
  return manejadorAsync(async (solicitud, respuesta, siguiente) => {
    if (solicitud.get('authorization')) {
      return autenticar(solicitud, respuesta, (error) =>
        error ? siguiente(error) : requerirAdmin(solicitud, respuesta, siguiente)
      );
    }

    if (await servicio.existeAdministrador()) {
      return siguiente(
        new ErrorAutenticacion('Sólo un administrador autenticado puede registrar nuevas cuentas.')
      );
    }

    return siguiente();
  });
}

export function crearRutasAutenticacion(
  servicio,
  { limitadorInicioSesion, limitadorRestablecimiento }
) {
  const controlador = crearControladorAutenticacion(servicio);
  const rutas = Router();

  rutas.post(
    '/registro',
    limitadorInicioSesion,
    crearAutorizacionRegistro(servicio),
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
