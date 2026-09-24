import compression from 'compression';
import helmet from 'helmet';

export const configuracionSeguridad = Object.freeze({
  limiteJson: '1mb',
  rondasBcrypt: 12,
  bytesTokenRestablecimiento: 32,
  cargaImagenes: Object.freeze({
    cantidadMaxima: 5,
    cantidadMaximaPorCurso: 10,
    tamanoMaximoBytes: 5 * 1024 * 1024,
    tiposMimePermitidos: Object.freeze(['image/jpeg', 'image/png', 'image/webp'])
  }),
  limitesSolicitudes: Object.freeze({
    general: Object.freeze({ ventanaMs: 15 * 60 * 1000, maximo: 100 }),
    inicioSesion: Object.freeze({ ventanaMs: 15 * 60 * 1000, maximo: 10 }),
    restablecimiento: Object.freeze({ ventanaMs: 60 * 60 * 1000, maximo: 5 }),
    consulta: Object.freeze({ ventanaMs: 15 * 60 * 1000, maximo: 5 })
  })
});

export const middlewaresSeguridad = Object.freeze([
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' }
  }),
  compression()
]);

export const securityMiddleware = middlewaresSeguridad;
