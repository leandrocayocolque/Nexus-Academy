import { describe, expect, it, vi } from 'vitest';
import { ProveedorCorreoConsola } from '../../src/providers/email/console.adapter.js';
import { crearProveedorCorreo } from '../../src/providers/email/email.factory.js';

const CONFIGURACION_SMTP = {
  proveedor: 'nodemailer',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpSeguro: false,
  smtpUser: 'usuario',
  smtpPassword: 'secreto',
  remitente: 'NEXUS <noreply@example.com>',
  destinatarioNotificaciones: 'admin@example.com'
};

describe('Proveedores de correo', () => {
  it('selecciona consola en desarrollo y no registra tokens ni enlaces completos', async () => {
    const registrador = { info: vi.fn(), error: vi.fn() };
    const proveedor = crearProveedorCorreo({
      configuracion: { proveedor: 'console' },
      ambiente: 'development',
      registrador
    });

    expect(proveedor).toBeInstanceOf(ProveedorCorreoConsola);
    await proveedor.enviarRestablecimientoContrasena({
      destinatario: 'admin@example.com',
      nombre: 'Admin',
      enlace: 'https://app.example/reset?token=token-super-secreto',
      expiraEn: new Date('2027-01-01')
    });

    const registro = JSON.stringify(registrador.info.mock.calls);
    expect(registro).not.toContain('token-super-secreto');
    expect(registro).not.toContain('https://app.example/reset');
  });

  it('degrada sin bloquear y falla de forma segura sólo al invocar', async () => {
    const proveedor = crearProveedorCorreo({
      configuracion: { proveedor: 'nodemailer' },
      ambiente: 'production',
      registrador: { info: vi.fn(), error: vi.fn() }
    });

    await expect(
      proveedor.enviarConfirmacionConsulta({
        destinatario: 'persona@example.com',
        nombre: 'Persona',
        consultaId: 'consulta-1'
      })
    ).rejects.toMatchObject({
      codigo: 'SERVICIO_EXTERNO_NO_DISPONIBLE',
      codigoEstado: 503
    });
  });

  it('carga Nodemailer una sola vez al primer envío y construye payloads seguros', async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: 'mensaje-1' });
    const createTransport = vi.fn(() => ({ sendMail }));
    const cargarNodemailer = vi.fn(async () => ({ default: { createTransport } }));
    const proveedor = crearProveedorCorreo({
      configuracion: CONFIGURACION_SMTP,
      ambiente: 'production',
      registrador: { info: vi.fn(), error: vi.fn() },
      cargarNodemailer
    });

    expect(cargarNodemailer).not.toHaveBeenCalled();
    await proveedor.enviarRestablecimientoContrasena({
      destinatario: 'admin@example.com',
      nombre: 'Admin',
      enlace: 'https://app.example/reset?token=opaco',
      expiraEn: new Date('2027-01-01T01:00:00.000Z')
    });
    await proveedor.enviarConfirmacionConsulta({
      destinatario: 'persona@example.com',
      nombre: 'Persona',
      consultaId: 'consulta-1'
    });
    await proveedor.enviarNotificacionNuevaConsulta({
      consulta: {
        id: 'consulta-1',
        nombre: 'Persona',
        correo: 'persona@example.com',
        asunto: 'Consulta',
        mensaje: 'Contenido'
      }
    });

    expect(cargarNodemailer).toHaveBeenCalledOnce();
    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: { user: 'usuario', pass: 'secreto' }
    });
    expect(sendMail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        from: 'NEXUS <noreply@example.com>',
        to: 'admin@example.com',
        subject: expect.stringContaining('Restablecimiento')
      })
    );
    expect(sendMail).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ to: 'admin@example.com', subject: 'Nueva consulta: Consulta' })
    );
  });

  it('sanitiza errores externos sin filtrar el detalle del proveedor', async () => {
    const registrador = { info: vi.fn(), error: vi.fn() };
    const proveedor = crearProveedorCorreo({
      configuracion: CONFIGURACION_SMTP,
      ambiente: 'production',
      registrador,
      cargarNodemailer: async () => ({
        default: {
          createTransport: () => ({
            sendMail: vi
              .fn()
              .mockRejectedValue(
                Object.assign(new Error('535 contraseña SMTP incorrecta'), { code: 'EAUTH' })
              )
          })
        }
      })
    });

    await expect(
      proveedor.enviarConfirmacionConsulta({
        destinatario: 'persona@example.com',
        nombre: 'Persona',
        consultaId: 'consulta-1'
      })
    ).rejects.toMatchObject({
      codigo: 'SERVICIO_EXTERNO_NO_DISPONIBLE',
      message: expect.not.stringContaining('contraseña SMTP')
    });
    expect(JSON.stringify(registrador.error.mock.calls)).not.toContain('contraseña SMTP');
  });
});
