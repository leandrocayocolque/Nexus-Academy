import multer from 'multer';
import { configuracionSeguridad } from '../../config/security.js';
import { ErrorArchivoInvalido } from '../errors/AppError.js';

const configuracionCarga = configuracionSeguridad.cargaImagenes;
const tiposPermitidos = new Set(configuracionCarga.tiposMimePermitidos);

export const cargaImagenes = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: configuracionCarga.tamanoMaximoBytes,
    files: configuracionCarga.cantidadMaxima
  },
  fileFilter(_solicitud, archivo, resolver) {
    if (!tiposPermitidos.has(archivo.mimetype)) {
      return resolver(new ErrorArchivoInvalido('Sólo se permiten imágenes JPEG, PNG o WebP.'));
    }

    return resolver(null, true);
  }
});

export const upload = cargaImagenes;
