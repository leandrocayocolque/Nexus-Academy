import { ErrorServicioExterno } from '../../shared/errors/AppError.js';

export class ProveedorCorreo {
  async enviarRestablecimientoContrasena(_mensaje) {
    throw new ErrorServicioExterno('correo');
  }

  async enviarConfirmacionConsulta(_mensaje) {
    throw new ErrorServicioExterno('correo');
  }

  async enviarNotificacionNuevaConsulta(_mensaje) {
    throw new ErrorServicioExterno('correo');
  }
}

export class ProveedorCorreoMemoria extends ProveedorCorreo {
  constructor() {
    super();
    this.mensajes = [];
  }

  guardar(tipo, mensaje) {
    this.mensajes.push(structuredClone({ tipo, ...mensaje }));
    return { id: `memoria-${this.mensajes.length}` };
  }

  async enviarRestablecimientoContrasena(mensaje) {
    return this.guardar('RESTABLECIMIENTO_CONTRASENA', mensaje);
  }

  async enviarConfirmacionConsulta(mensaje) {
    return this.guardar('CONFIRMACION_CONSULTA', mensaje);
  }

  async enviarNotificacionNuevaConsulta(mensaje) {
    return this.guardar('NUEVA_CONSULTA', mensaje);
  }
}

export class ProveedorCorreoNoDisponible extends ProveedorCorreo {}

export const EmailProvider = ProveedorCorreo;
export const FakeEmailProvider = ProveedorCorreoMemoria;
