import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearServicioCategorias } from '../../src/modules/categories/categories.service.js';
import {
  ErrorCorreoDuplicado,
  ErrorCredencialesInvalidas
} from '../../src/shared/errors/AppError.js';
import { crearLimitador } from '../../src/shared/middlewares/rateLimiters.js';
import { crearAppPrueba, crearServiciosSimulados, ID_ADMIN, tokenAdmin } from './helpers.js';

const REGISTRO = {
  correo: 'nuevo@example.com',
  nombre: 'Nueva',
  apellido: 'Persona',
  contrasena: 'ClaveSegura123',
  confirmarContrasena: 'ClaveSegura123'
};

describe('API de autenticación', () => {
  it('permite el registro abierto sólo mientras no existe ningún administrador', async () => {
    const servicios = crearServiciosSimulados();
    servicios.autenticacion.existeAdministrador.mockResolvedValue(false);
    servicios.autenticacion.registrarAdministrador.mockResolvedValue({ id: 'u1', rol: 'ADMIN' });

    await request(crearAppPrueba(servicios))
      .post('/api/autenticacion/registro')
      .send(REGISTRO)
      .expect(201, { id: 'u1', rol: 'ADMIN' });
    expect(servicios.autenticacion.registrarAdministrador).toHaveBeenCalledWith(REGISTRO);
  });

  it('exige un administrador autenticado cuando ya existe uno', async () => {
    const servicios = crearServiciosSimulados();
    servicios.autenticacion.existeAdministrador.mockResolvedValue(true);
    const aplicacion = crearAppPrueba(servicios);

    await request(aplicacion)
      .post('/api/autenticacion/registro')
      .send(REGISTRO)
      .expect(401)
      .expect(({ body }) => expect(body.error.codigo).toBe('NO_AUTENTICADO'));
    expect(servicios.autenticacion.registrarAdministrador).not.toHaveBeenCalled();

    await request(aplicacion)
      .post('/api/autenticacion/registro')
      .set('Authorization', 'Bearer token-invalido')
      .send(REGISTRO)
      .expect(401);

    await request(aplicacion)
      .post('/api/autenticacion/registro')
      .set('Authorization', tokenAdmin())
      .send(REGISTRO)
      .expect(201);
    expect(servicios.autenticacion.registrarAdministrador).toHaveBeenCalledTimes(1);
  });

  it('traduce errores de dominio del registro', async () => {
    const servicios = crearServiciosSimulados();
    servicios.autenticacion.registrarAdministrador.mockRejectedValue(new ErrorCorreoDuplicado());

    await request(crearAppPrueba(servicios))
      .post('/api/autenticacion/registro')
      .set('Authorization', tokenAdmin())
      .send(REGISTRO)
      .expect(409)
      .expect(({ body }) => expect(body.error.codigo).toBe('CORREO_DUPLICADO'));
  });

  it('inicia sesión y devuelve el token emitido por el servicio', async () => {
    const servicios = crearServiciosSimulados();
    servicios.autenticacion.autenticar.mockResolvedValue({
      tokenAcceso: 'jwt',
      usuario: { id: 'u1' }
    });
    const credenciales = { correo: 'admin@example.com', contrasena: 'ClaveSegura123' };

    await request(crearAppPrueba(servicios))
      .post('/api/autenticacion/login')
      .send(credenciales)
      .expect(200, { tokenAcceso: 'jwt', usuario: { id: 'u1' } });
    expect(servicios.autenticacion.autenticar).toHaveBeenCalledWith(credenciales);
  });

  it('responde 401 ante credenciales inválidas', async () => {
    const servicios = crearServiciosSimulados();
    servicios.autenticacion.autenticar.mockRejectedValue(new ErrorCredencialesInvalidas());

    await request(crearAppPrueba(servicios))
      .post('/api/autenticacion/login')
      .send({ correo: 'admin@example.com', contrasena: 'x' })
      .expect(401)
      .expect(({ body }) => expect(body.error.codigo).toBe('CREDENCIALES_INVALIDAS'));
  });

  it('limita los intentos de inicio de sesión', async () => {
    const aplicacion = crearAppPrueba(crearServiciosSimulados(), {
      limitadorInicioSesion: crearLimitador({ ventanaMs: 60_000, maximo: 1 })
    });

    await request(aplicacion).post('/api/autenticacion/login').send({}).expect(200);
    await request(aplicacion)
      .post('/api/autenticacion/login')
      .send({})
      .expect(429)
      .expect(({ body }) => expect(body.error.codigo).toBe('LIMITE_SOLICITUDES'));
  });

  it('cierra sesión sólo con un token válido', async () => {
    const aplicacion = crearAppPrueba();

    await request(aplicacion).post('/api/autenticacion/logout').expect(401);
    await request(aplicacion)
      .post('/api/autenticacion/logout')
      .set('Authorization', tokenAdmin())
      .expect(200, { mensaje: 'La sesión fue cerrada correctamente.' });
  });

  it('rechaza tokens firmados con otro secreto', async () => {
    const falso = jwt.sign(
      { sub: ID_ADMIN, rol: 'ADMIN' },
      'otro-secreto-de-al-menos-32-caracteres!!'
    );

    await request(crearAppPrueba())
      .post('/api/autenticacion/logout')
      .set('Authorization', `Bearer ${falso}`)
      .expect(401);
  });

  it('delega la recuperación y el restablecimiento de contraseña', async () => {
    const servicios = crearServiciosSimulados();
    servicios.autenticacion.solicitarRestablecimiento.mockResolvedValue({ mensaje: 'enviado' });
    servicios.autenticacion.restablecerContrasena.mockResolvedValue({ mensaje: 'listo' });
    const aplicacion = crearAppPrueba(servicios);

    await request(aplicacion)
      .post('/api/autenticacion/recuperar-contrasena')
      .send({ correo: 'admin@example.com' })
      .expect(200, { mensaje: 'enviado' });
    await request(aplicacion)
      .post('/api/autenticacion/restablecer-contrasena')
      .send({ token: 't', contrasenaNueva: 'a', confirmarContrasenaNueva: 'a' })
      .expect(200, { mensaje: 'listo' });

    expect(servicios.autenticacion.solicitarRestablecimiento).toHaveBeenCalledWith({
      correo: 'admin@example.com'
    });
  });

  it('convierte errores de validación Zod en 400 con detalles', async () => {
    const servicios = crearServiciosSimulados({
      categorias: crearServicioCategorias({
        repositorioCategorias: Object.fromEntries(
          [
            'buscarPorId',
            'buscarPorSlug',
            'existePorSlug',
            'existePorNombre',
            'listar',
            'crear',
            'actualizar',
            'eliminar'
          ].map((metodo) => [metodo, async () => null])
        )
      })
    });

    await request(crearAppPrueba(servicios))
      .post('/api/admin/categorias')
      .set('Authorization', tokenAdmin())
      .send({ nombre: 'x', desconocido: true })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.codigo).toBe('DATOS_INVALIDOS');
        expect(body.error.detalles.length).toBeGreaterThan(0);
      });
  });
});
