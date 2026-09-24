import { describe, expect, it } from 'vitest';
import { validarEntorno } from '../../src/config/env.js';
import { crearComposicion } from '../../src/composition.js';

describe('Configuración opcional', () => {
  it('no exige credenciales de proveedores en producción', () => {
    const configuracion = validarEntorno({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/nexus',
      JWT_SECRET: 'valor-aleatorio-valido-de-mas-de-32-caracteres',
      CORS_ORIGIN: 'https://app.nexus.example'
    });

    expect(configuracion.proveedores.correo.proveedor).toBe('nodemailer');
    expect(configuracion.proveedores.correo.smtpHost).toBeUndefined();
    expect(configuracion.proveedores.cloudinary.cloudName).toBeUndefined();
  });

  it('crea la composición health-only sin cliente ni credenciales externas', () => {
    const configuracion = validarEntorno({ NODE_ENV: 'test' });
    const composicion = crearComposicion({
      configuracion,
      cicloVidaBaseDatos: {
        conectar: async () => undefined,
        desconectar: async () => undefined
      },
      registrador: { info: () => undefined, warn: () => undefined, error: () => undefined }
    });

    expect(composicion.servicios).toEqual({});
    expect(composicion.proveedores.correo).toBeDefined();
    expect(composicion.proveedores.imagenes).toBeDefined();
  });
});
