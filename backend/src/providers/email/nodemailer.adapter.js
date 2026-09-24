import { ErrorServicioExterno } from '../../shared/errors/AppError.js';
import { ProveedorCorreo } from './email.provider.js';

function textoConsulta(consulta) {
  return [
    `Consulta: ${consulta.id}`,
    `Nombre: ${consulta.nombre}`,
    `Correo: ${consulta.correo}`,
    `Asunto: ${consulta.asunto}`,
    '',
    consulta.mensaje
  ].join('\n');
}

export class ProveedorCorreoNodemailer extends ProveedorCorreo {
  constructor({ obtenerTransportador, remitente, destinatarioNotificaciones, registrador }) {
    super();
    this.obtenerTransportador = obtenerTransportador;
    this.remitente = remitente;
    this.destinatarioNotificaciones = destinatarioNotificaciones;
    this.registrador = registrador;
  }

  async enviar(mensaje) {
    try {
      const transportador = await this.obtenerTransportador();
      const resultado = await transportador.sendMail({ from: this.remitente, ...mensaje });
      return { id: resultado.messageId };
    } catch (error) {
      this.registrador.error(
        { servicio: 'correo', codigoExterno: error?.code },
        'Falló el proveedor externo de correo'
      );
      throw new ErrorServicioExterno('correo');
    }
  }

  enviarRestablecimientoContrasena({ destinatario, nombre, enlace, expiraEn }) {
    return this.enviar({
      to: destinatario,
      subject: 'Restablecimiento de contraseña de NEXUS',
      text: `Hola ${nombre}. Use este enlace para restablecer su contraseña: ${enlace}\nEl enlace vence: ${expiraEn.toISOString()}.`
    });
  }

  enviarConfirmacionConsulta({ destinatario, nombre, consultaId }) {
    return this.enviar({
      to: destinatario,
      subject: 'Recibimos su consulta en NEXUS',
      text: `Hola ${nombre}. Recibimos su consulta ${consultaId} y responderemos a la brevedad.`
    });
  }

  enviarNotificacionNuevaConsulta({ destinatario, consulta }) {
    return this.enviar({
      to: destinatario ?? this.destinatarioNotificaciones,
      subject: `Nueva consulta: ${consulta.asunto}`,
      text: textoConsulta(consulta)
    });
  }
}

export const NodemailerAdapter = ProveedorCorreoNodemailer;
export const NodemailerEmailProvider = ProveedorCorreoNodemailer;
