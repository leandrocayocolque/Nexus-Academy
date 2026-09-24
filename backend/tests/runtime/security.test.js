import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { manejarError } from '../../src/shared/errors/errorHandler.js';
import { cargaImagenes } from '../../src/shared/middlewares/upload.js';
import { crearLimitador } from '../../src/shared/middlewares/rateLimiters.js';

describe('Defensas del runtime', () => {
  it('normaliza el exceso de solicitudes con código seguro', async () => {
    const aplicacion = express();
    aplicacion.set('trust proxy', 1);
    aplicacion.use(crearLimitador({ ventanaMs: 60_000, maximo: 2 }));
    aplicacion.get('/limitada', (_solicitud, respuesta) => respuesta.json({ ok: true }));
    aplicacion.use(manejarError);

    await request(aplicacion).get('/limitada').expect(200);
    await request(aplicacion).get('/limitada').expect(200);
    await request(aplicacion)
      .get('/limitada')
      .expect(429)
      .expect(({ body }) => {
        expect(body.error.codigo).toBe('LIMITE_SOLICITUDES');
      });
  });

  it('acepta JPEG/PNG/WebP y rechaza otros tipos', async () => {
    const aplicacion = express();
    aplicacion.post('/imagen', cargaImagenes.single('imagen'), (solicitud, respuesta) => {
      respuesta.json({ tipo: solicitud.file.mimetype, tamano: solicitud.file.size });
    });
    aplicacion.use(manejarError);

    await request(aplicacion)
      .post('/imagen')
      .attach('imagen', Buffer.from('png'), {
        filename: 'curso.png',
        contentType: 'image/png'
      })
      .expect(200)
      .expect({ tipo: 'image/png', tamano: 3 });

    await request(aplicacion)
      .post('/imagen')
      .attach('imagen', Buffer.from('<svg/>'), {
        filename: 'curso.svg',
        contentType: 'image/svg+xml'
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.codigo).toBe('ARCHIVO_INVALIDO');
      });
  });

  it('rechaza archivos mayores a 5 MB', async () => {
    const aplicacion = express();
    aplicacion.post('/imagen', cargaImagenes.single('imagen'), (_solicitud, respuesta) => {
      respuesta.sendStatus(204);
    });
    aplicacion.use(manejarError);

    await request(aplicacion)
      .post('/imagen')
      .attach('imagen', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'grande.jpg',
        contentType: 'image/jpeg'
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error).toEqual({
          codigo: 'ARCHIVO_INVALIDO',
          mensaje: 'El archivo supera el tamaño máximo permitido.'
        });
      });
  });
});
