import { ProveedorCorreoConsola } from './console.adapter.js';
import { ProveedorCorreoNoDisponible } from './email.provider.js';
import { ProveedorCorreoNodemailer } from './nodemailer.adapter.js';

function configuracionSmtpCompleta(configuracion) {
  return Boolean(
    configuracion.smtpHost &&
    configuracion.smtpPort &&
    configuracion.smtpUser &&
    configuracion.smtpPassword &&
    configuracion.remitente &&
    configuracion.destinatarioNotificaciones
  );
}

export function crearProveedorCorreo({
  configuracion,
  ambiente,
  registrador,
  cargarNodemailer = () => import('nodemailer')
}) {
  if (ambiente === 'development' || ambiente === 'test' || configuracion.proveedor === 'console') {
    return new ProveedorCorreoConsola({ registrador });
  }

  if (configuracion.proveedor !== 'nodemailer' || !configuracionSmtpCompleta(configuracion)) {
    return new ProveedorCorreoNoDisponible();
  }

  let promesaTransportador;
  const obtenerTransportador = () => {
    if (!promesaTransportador) {
      promesaTransportador = cargarNodemailer().then((modulo) => {
        const nodemailer = modulo.default ?? modulo;
        return nodemailer.createTransport({
          host: configuracion.smtpHost,
          port: configuracion.smtpPort,
          secure: configuracion.smtpSeguro,
          auth: {
            user: configuracion.smtpUser,
            pass: configuracion.smtpPassword
          }
        });
      });
    }
    return promesaTransportador;
  };

  return new ProveedorCorreoNodemailer({
    obtenerTransportador,
    remitente: configuracion.remitente,
    destinatarioNotificaciones: configuracion.destinatarioNotificaciones,
    registrador
  });
}
