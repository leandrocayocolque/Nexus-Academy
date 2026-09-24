import { randomUUID } from 'node:crypto';
import { ErrorArchivoInvalido, ErrorServicioExterno } from '../../shared/errors/AppError.js';
import { ProveedorAlmacenamientoImagenes } from './imageStorage.provider.js';

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TAMANO_MAXIMO = 5 * 1024 * 1024;
const ID_PUBLICO_SEGURO = /^[a-zA-Z0-9/_-]+$/;

export function crearNombreSeguro(nombre = 'imagen') {
  const base = nombre
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || 'imagen';
}

export function validarArchivoImagen(archivo) {
  if (!archivo || !Buffer.isBuffer(archivo.buffer)) {
    throw new ErrorArchivoInvalido('La imagen debe incluir contenido binario válido.');
  }
  if (!TIPOS_PERMITIDOS.has(archivo.mimetype)) {
    throw new ErrorArchivoInvalido('Sólo se permiten imágenes JPEG, PNG o WebP.');
  }
  if (archivo.buffer.length === 0 || archivo.buffer.length > TAMANO_MAXIMO) {
    throw new ErrorArchivoInvalido('La imagen debe pesar entre 1 byte y 5 MB.');
  }
  return archivo;
}

export class ProveedorAlmacenamientoCloudinary extends ProveedorAlmacenamientoImagenes {
  constructor({ obtenerCliente, carpeta = 'nexus/cursos', registrador }) {
    super();
    this.obtenerCliente = obtenerCliente;
    this.carpeta = carpeta;
    this.registrador = registrador;
  }

  async subir(archivo) {
    validarArchivoImagen(archivo);
    const idPublico = `${this.carpeta}/${randomUUID()}-${crearNombreSeguro(archivo.originalname)}`;

    try {
      const cliente = await this.obtenerCliente();
      const resultado = await new Promise((resolver, rechazar) => {
        const flujo = cliente.uploader.upload_stream(
          { public_id: idPublico, resource_type: 'image', overwrite: false },
          (error, respuesta) => (error ? rechazar(error) : resolver(respuesta))
        );
        flujo.end(archivo.buffer);
      });
      return {
        idPublico: resultado.public_id,
        url: resultado.secure_url,
        ancho: resultado.width,
        alto: resultado.height,
        formato: resultado.format
      };
    } catch (error) {
      this.registrador.error(
        { servicio: 'cloudinary', codigoExterno: error?.http_code },
        'Falló el proveedor externo de imágenes'
      );
      throw new ErrorServicioExterno('almacenamiento de imágenes');
    }
  }

  async eliminar(idPublico) {
    if (typeof idPublico !== 'string' || !ID_PUBLICO_SEGURO.test(idPublico)) {
      throw new ErrorArchivoInvalido('El identificador público de la imagen no es válido.');
    }

    try {
      const cliente = await this.obtenerCliente();
      const resultado = await cliente.uploader.destroy(idPublico, {
        resource_type: 'image',
        invalidate: true
      });
      return { idPublico, eliminado: ['ok', 'not found'].includes(resultado.result) };
    } catch (error) {
      this.registrador.error(
        { servicio: 'cloudinary', codigoExterno: error?.http_code },
        'Falló la eliminación externa de una imagen'
      );
      throw new ErrorServicioExterno('almacenamiento de imágenes');
    }
  }
}

export const CloudinaryAdapter = ProveedorAlmacenamientoCloudinary;
export const CloudinaryStorageProvider = ProveedorAlmacenamientoCloudinary;
