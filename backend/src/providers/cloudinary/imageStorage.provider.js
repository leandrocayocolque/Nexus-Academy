import { ErrorServicioExterno } from '../../shared/errors/AppError.js';

export class ProveedorAlmacenamientoImagenes {
  async subir(_archivo) {
    throw new ErrorServicioExterno('almacenamiento de imágenes');
  }

  async eliminar(_idPublico) {
    throw new ErrorServicioExterno('almacenamiento de imágenes');
  }
}

export class ProveedorAlmacenamientoImagenesMemoria extends ProveedorAlmacenamientoImagenes {
  constructor() {
    super();
    this.subidas = [];
    this.eliminadas = [];
  }

  async subir(archivo) {
    const resultado = {
      idPublico: `memoria/${this.subidas.length + 1}`,
      url: `https://imagenes.local/${this.subidas.length + 1}`,
      nombre: archivo.originalname
    };
    this.subidas.push({ archivo, resultado });
    return resultado;
  }

  async eliminar(idPublico) {
    this.eliminadas.push(idPublico);
    return { idPublico, eliminado: true };
  }
}

export class ProveedorAlmacenamientoNoDisponible extends ProveedorAlmacenamientoImagenes {}

export const StorageProvider = ProveedorAlmacenamientoImagenes;
export const ImageStorageProvider = ProveedorAlmacenamientoImagenes;
export const FakeStorageProvider = ProveedorAlmacenamientoImagenesMemoria;
