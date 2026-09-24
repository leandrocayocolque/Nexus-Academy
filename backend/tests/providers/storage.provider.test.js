import { describe, expect, it, vi } from 'vitest';
import {
  crearNombreSeguro,
  validarArchivoImagen
} from '../../src/providers/cloudinary/cloudinary.adapter.js';
import { crearProveedorAlmacenamiento } from '../../src/providers/cloudinary/storage.factory.js';

const CONFIGURACION = {
  cloudName: 'nexus',
  apiKey: 'clave',
  apiSecret: 'secreto',
  carpeta: 'nexus/cursos'
};

const ARCHIVO_VALIDO = {
  originalname: 'Curso Ágil (final).PNG',
  mimetype: 'image/png',
  buffer: Buffer.from('imagen')
};

describe('Proveedor de almacenamiento de imágenes', () => {
  it('valida tipo, tamaño y nombre seguro antes del SDK', () => {
    expect(validarArchivoImagen(ARCHIVO_VALIDO)).toBe(ARCHIVO_VALIDO);
    expect(crearNombreSeguro(ARCHIVO_VALIDO.originalname)).toBe('curso-agil-final');
    expect(() => validarArchivoImagen({ ...ARCHIVO_VALIDO, mimetype: 'image/svg+xml' })).toThrow(
      expect.objectContaining({ codigo: 'ARCHIVO_INVALIDO' })
    );
    expect(() =>
      validarArchivoImagen({ ...ARCHIVO_VALIDO, buffer: Buffer.alloc(5 * 1024 * 1024 + 1) })
    ).toThrow(expect.objectContaining({ codigo: 'ARCHIVO_INVALIDO' }));
  });

  it('degrada sin credenciales y falla sólo cuando se usa', async () => {
    const proveedor = crearProveedorAlmacenamiento({
      configuracion: {},
      ambiente: 'production',
      registrador: { error: vi.fn() }
    });

    await expect(proveedor.subir(ARCHIVO_VALIDO)).rejects.toMatchObject({
      codigo: 'SERVICIO_EXTERNO_NO_DISPONIBLE'
    });
  });

  it('usa fake en pruebas sin cargar Cloudinary', async () => {
    const cargarCloudinary = vi.fn();
    const proveedor = crearProveedorAlmacenamiento({
      configuracion: CONFIGURACION,
      ambiente: 'test',
      registrador: { error: vi.fn() },
      cargarCloudinary
    });

    await expect(proveedor.subir(ARCHIVO_VALIDO)).resolves.toMatchObject({
      idPublico: 'memoria/1'
    });
    expect(cargarCloudinary).not.toHaveBeenCalled();
  });

  it('carga Cloudinary en el primer uso y ejecuta upload/delete canónicos', async () => {
    const end = vi.fn();
    const uploadStream = vi.fn((_opciones, callback) => {
      callback(null, {
        public_id: 'nexus/cursos/imagen-1',
        secure_url: 'https://res.cloudinary.com/nexus/imagen.png',
        width: 800,
        height: 600,
        format: 'png'
      });
      return { end };
    });
    const destroy = vi.fn().mockResolvedValue({ result: 'ok' });
    const config = vi.fn();
    const cargarCloudinary = vi.fn(async () => ({
      v2: { config, uploader: { upload_stream: uploadStream, destroy } }
    }));
    const proveedor = crearProveedorAlmacenamiento({
      configuracion: CONFIGURACION,
      ambiente: 'production',
      registrador: { error: vi.fn() },
      cargarCloudinary
    });

    expect(cargarCloudinary).not.toHaveBeenCalled();
    await expect(proveedor.subir(ARCHIVO_VALIDO)).resolves.toMatchObject({
      idPublico: 'nexus/cursos/imagen-1',
      formato: 'png'
    });
    await expect(proveedor.eliminar('nexus/cursos/imagen-1')).resolves.toEqual({
      idPublico: 'nexus/cursos/imagen-1',
      eliminado: true
    });

    expect(cargarCloudinary).toHaveBeenCalledOnce();
    expect(config).toHaveBeenCalledWith({
      cloud_name: 'nexus',
      api_key: 'clave',
      api_secret: 'secreto',
      secure: true
    });
    expect(uploadStream).toHaveBeenCalledWith(
      expect.objectContaining({ resource_type: 'image', overwrite: false }),
      expect.any(Function)
    );
    expect(end).toHaveBeenCalledWith(ARCHIVO_VALIDO.buffer);
    expect(destroy).toHaveBeenCalledWith('nexus/cursos/imagen-1', {
      resource_type: 'image',
      invalidate: true
    });
  });

  it('convierte errores externos en un error sanitizado', async () => {
    const registrador = { error: vi.fn() };
    const proveedor = crearProveedorAlmacenamiento({
      configuracion: CONFIGURACION,
      ambiente: 'production',
      registrador,
      cargarCloudinary: async () => ({
        v2: {
          config: vi.fn(),
          uploader: {
            upload_stream: (_opciones, callback) => {
              callback(Object.assign(new Error('api_secret inválido'), { http_code: 401 }));
              return { end: vi.fn() };
            }
          }
        }
      })
    });

    await expect(proveedor.subir(ARCHIVO_VALIDO)).rejects.toMatchObject({
      codigo: 'SERVICIO_EXTERNO_NO_DISPONIBLE',
      message: expect.not.stringContaining('api_secret')
    });
    expect(JSON.stringify(registrador.error.mock.calls)).not.toContain('api_secret inválido');
  });
});
