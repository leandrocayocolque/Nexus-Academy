import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearAplicacion } from '../../src/app.js';
import { crearMiddlewareCors } from '../../src/config/cors.config.js';
import { manejarError } from '../../src/shared/errors/errorHandler.js';

describe('Runtime HTTP health-only', () => {
  it('expone únicamente el health check esperado', async () => {
    const aplicacion = crearAplicacion();

    await request(aplicacion)
      .get('/api/health')
      .expect(200)
      .expect({ estado: 'ok', servicio: 'nexus-api' })
      .expect('x-content-type-options', 'nosniff');
  });

  it.each([
    '/api/auth/login',
    '/api/users',
    '/api/business',
    '/api/categories',
    '/api/courses',
    '/api/inquiries',
    '/api/promotions',
    '/api/dashboard',
    '/api/ai/recommendations'
  ])('mantiene sin montar la ruta de negocio %s', async (ruta) => {
    await request(crearAplicacion())
      .get(ruta)
      .expect(404)
      .expect(({ body }) => {
        expect(body).toEqual({
          error: { codigo: 'NO_ENCONTRADO', mensaje: `Ruta GET ${ruta} no encontrada.` }
        });
      });
  });

  it('aplica CORS sólo a orígenes explícitos con credenciales', async () => {
    const aplicacion = crearAplicacion({
      cors: crearMiddlewareCors(['https://app.nexus.example'])
    });

    await request(aplicacion)
      .get('/api/health')
      .set('Origin', 'https://app.nexus.example')
      .expect('access-control-allow-origin', 'https://app.nexus.example')
      .expect('access-control-allow-credentials', 'true');

    const rechazada = await request(aplicacion)
      .get('/api/health')
      .set('Origin', 'https://malicioso.example')
      .expect(200);
    expect(rechazada.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('sanitiza errores desconocidos sin exponer mensajes internos', async () => {
    const aplicacion = express();
    aplicacion.get('/falla', () => {
      throw new Error('secreto-de-infraestructura');
    });
    aplicacion.use(manejarError);

    const respuesta = await request(aplicacion).get('/falla').expect(500);

    expect(respuesta.body).toEqual({
      error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error interno.' }
    });
    expect(JSON.stringify(respuesta.body)).not.toContain('secreto-de-infraestructura');
  });
});
