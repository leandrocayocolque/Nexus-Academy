import { ProveedorCorreo } from './email.provider.js';

export class ProveedorCorreoConsola extends ProveedorCorreo {
  constructor({ registrador = console } = {}) {
    super();
    this.registrador = registrador;
  }

  registrar(tipo, datos) {
    this.registrador.info?.(
      { tipo, destinatario: datos.destinatario, consultaId: datos.consultaId },
      'Correo simulado; el contenido sensible fue omitido'
    );
    return { id: `consola-${tipo.toLowerCase()}` };
  }

  async enviarRestablecimientoContrasena({ destinatario, nombre, expiraEn }) {
    return this.registrar('RESTABLECIMIENTO_CONTRASENA', { destinatario, nombre, expiraEn });
  }

  async enviarConfirmacionConsulta({ destinatario, nombre, consultaId }) {
    return this.registrar('CONFIRMACION_CONSULTA', { destinatario, nombre, consultaId });
  }

  async enviarNotificacionNuevaConsulta({ destinatario, consulta }) {
    return this.registrar('NUEVA_CONSULTA', {
      destinatario,
      consultaId: consulta?.id
    });
  }
}

export const AdaptadorCorreoConsola = ProveedorCorreoConsola;
export const ConsoleEmailProvider = ProveedorCorreoConsola;
