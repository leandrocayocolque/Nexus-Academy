import { describe, expect, it, vi } from 'vitest';
import { crearServicioImagenesCurso } from '../../../src/modules/courses/courseImages.service.js';
import { ErrorServicioExterno } from '../../../src/shared/errors/AppError.js';

const JPEG = { buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]), mimetype: 'image/jpeg' };
const WEBP = {
  buffer: Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'latin1'),
  mimetype: 'image/webp'
};

function crearContexto({ crearImagen = async (datos) => datos } = {}) {
  const proveedorImagenes = {
    subir: vi.fn(async () => ({
      idPublico: `ext-${proveedorImagenes.subir.mock.calls.length}`,
      url: 'https://x'
    })),
    eliminar: vi.fn().mockResolvedValue({})
  };
  const registrador = { warn: vi.fn() };
  const servicio = crearServicioImagenesCurso({
    repositorioCursos: {
      buscarPorId: vi
        .fn()
        .mockResolvedValue({ id: 'c1', titulo: 'Curso', imagenes: [{ orden: 4 }] })
    },
    repositorioImagenes: { buscarPorId: vi.fn(), eliminar: vi.fn() },
    gestorTransacciones: {
      ejecutar: (trabajo) => trabajo({ imagenesCurso: { crear: vi.fn(crearImagen) } })
    },
    proveedorImagenes,
    registrador
  });
  return { servicio, proveedorImagenes, registrador };
}

describe('Servicio de imágenes de cursos', () => {
  it('continúa el orden existente y usa el título como texto alternativo', async () => {
    const { servicio } = crearContexto();

    const imagenes = await servicio.agregarImagenes('c1', [JPEG, WEBP]);

    expect(imagenes).toEqual([
      expect.objectContaining({ orden: 5, textoAlternativo: 'Curso', idPublico: 'ext-1' }),
      expect.objectContaining({ orden: 6, idPublico: 'ext-2' })
    ]);
  });

  it('elimina las subidas exitosas si otra subida falla', async () => {
    const { servicio, proveedorImagenes } = crearContexto();
    proveedorImagenes.subir
      .mockResolvedValueOnce({ idPublico: 'ext-ok', url: 'https://x' })
      .mockRejectedValueOnce(new ErrorServicioExterno('almacenamiento de imágenes'));

    await expect(servicio.agregarImagenes('c1', [JPEG, JPEG])).rejects.toMatchObject({
      codigo: 'SERVICIO_EXTERNO_NO_DISPONIBLE'
    });
    expect(proveedorImagenes.eliminar).toHaveBeenCalledWith('ext-ok');
  });

  it('elimina las imágenes externas si falla la persistencia', async () => {
    const { servicio, proveedorImagenes } = crearContexto({
      crearImagen: async () => {
        throw new Error('fallo de base');
      }
    });

    await expect(servicio.agregarImagenes('c1', [JPEG])).rejects.toThrow('fallo de base');
    expect(proveedorImagenes.eliminar).toHaveBeenCalledWith('ext-1');
  });
});
