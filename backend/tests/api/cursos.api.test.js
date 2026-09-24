import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { crearServicioImagenesCurso } from '../../src/modules/courses/courseImages.service.js';
import { crearServicioCursos } from '../../src/modules/courses/courses.service.js';
import { ProveedorAlmacenamientoImagenesMemoria } from '../../src/providers/cloudinary/imageStorage.provider.js';
import { ErrorCursoNoEncontrado } from '../../src/shared/errors/AppError.js';
import { crearAppPrueba, crearServiciosSimulados, tokenAdmin } from './helpers.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const LISTADO = { datos: [], paginacion: { total: 0, pagina: 1, limite: 12, paginasTotales: 0 } };

function crearRepositorioCursos(curso) {
  return {
    buscarPorId: vi.fn().mockResolvedValue(curso),
    buscarPorSlug: vi.fn(),
    existePorSlug: vi.fn(),
    listar: vi.fn().mockResolvedValue(LISTADO),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn()
  };
}

function crearContextoImagenes(curso = { id: 'curso-1', titulo: 'Node', imagenes: [] }) {
  const repositorioCursos = crearRepositorioCursos(curso);
  const repositorioImagenes = { buscarPorId: vi.fn(), eliminar: vi.fn() };
  const creadas = [];
  const gestorTransacciones = {
    ejecutar: vi.fn((trabajo) =>
      trabajo({
        imagenesCurso: {
          crear: vi.fn(async (datos) => {
            const imagen = { id: `img-${creadas.length + 1}`, ...datos };
            creadas.push(imagen);
            return imagen;
          })
        }
      })
    )
  };
  const proveedorImagenes = new ProveedorAlmacenamientoImagenesMemoria();
  const servicios = crearServiciosSimulados({
    imagenesCurso: crearServicioImagenesCurso({
      repositorioCursos,
      repositorioImagenes,
      gestorTransacciones,
      proveedorImagenes,
      registrador: { warn: vi.fn() }
    })
  });
  return {
    servicios,
    repositorioImagenes,
    proveedorImagenes,
    aplicacion: crearAppPrueba(servicios)
  };
}

describe('API de cursos', () => {
  it('lista públicamente sólo cursos activos con filtros por query', async () => {
    const repositorioCursos = crearRepositorioCursos(null);
    const servicios = crearServiciosSimulados({
      cursos: crearServicioCursos({
        repositorioCursos,
        repositorioCategorias: { buscarPorId: vi.fn() },
        proveedorImagenes: { eliminar: vi.fn() },
        registrador: { warn: vi.fn() }
      })
    });

    await request(crearAppPrueba(servicios))
      .get('/api/cursos?buscar=node&nivel=INTERMEDIO&ordenarPor=precio&direccion=desc&limite=5')
      .expect(200, LISTADO);

    expect(repositorioCursos.listar).toHaveBeenCalledWith(
      expect.objectContaining({
        buscar: 'node',
        nivel: 'INTERMEDIO',
        ordenarPor: 'precio',
        direccion: 'desc',
        limite: 5,
        activo: true
      })
    );
  });

  it('rechaza filtros inválidos con 400', async () => {
    const servicios = crearServiciosSimulados({
      cursos: crearServicioCursos({
        repositorioCursos: crearRepositorioCursos(null),
        repositorioCategorias: { buscarPorId: vi.fn() },
        proveedorImagenes: { eliminar: vi.fn() },
        registrador: { warn: vi.fn() }
      })
    });

    await request(crearAppPrueba(servicios)).get('/api/cursos?nivel=EXPERTO').expect(400);
    await request(crearAppPrueba(servicios)).get('/api/cursos?campoDesconocido=1').expect(400);
  });

  it('oculta al público el detalle de cursos inactivos', async () => {
    const servicios = crearServiciosSimulados({
      cursos: crearServicioCursos({
        repositorioCursos: crearRepositorioCursos({
          id: 'curso-1',
          activo: false,
          cuposDisponibles: 3
        }),
        repositorioCategorias: { buscarPorId: vi.fn() },
        proveedorImagenes: { eliminar: vi.fn() },
        registrador: { warn: vi.fn() }
      })
    });
    const aplicacion = crearAppPrueba(servicios);

    await request(aplicacion).get('/api/cursos/curso-1').expect(404);
    await request(aplicacion)
      .get('/api/admin/cursos/curso-1')
      .set('Authorization', tokenAdmin())
      .expect(200)
      .expect(({ body }) => expect(body).toMatchObject({ id: 'curso-1', disponible: false }));
  });

  it('administra el ciclo de vida del curso', async () => {
    const servicios = crearServiciosSimulados();
    servicios.cursos.crearCurso.mockResolvedValue({ id: 'curso-1' });
    const aplicacion = crearAppPrueba(servicios);
    const autorizacion = tokenAdmin();

    await request(aplicacion)
      .post('/api/admin/cursos')
      .set('Authorization', autorizacion)
      .send({ titulo: 'Node' })
      .expect(201, { id: 'curso-1' });
    await request(aplicacion)
      .patch('/api/admin/cursos/curso-1')
      .set('Authorization', autorizacion)
      .send({ titulo: 'Node 2' })
      .expect(200);
    await request(aplicacion)
      .patch('/api/admin/cursos/curso-1/estado')
      .set('Authorization', autorizacion)
      .send({ activo: false })
      .expect(200);
    await request(aplicacion)
      .patch('/api/admin/cursos/curso-1/destacado')
      .set('Authorization', autorizacion)
      .send({ destacado: true })
      .expect(200);
    await request(aplicacion)
      .delete('/api/admin/cursos/curso-1')
      .set('Authorization', autorizacion)
      .expect(200);

    expect(servicios.cursos.actualizarCurso).toHaveBeenCalledWith('curso-1', { titulo: 'Node 2' });
    expect(servicios.cursos.activarCurso).toHaveBeenCalledWith('curso-1', { activo: false });
    expect(servicios.cursos.destacarCurso).toHaveBeenCalledWith('curso-1', { destacado: true });
    expect(servicios.cursos.eliminarCurso).toHaveBeenCalledWith('curso-1');
  });

  it('responde 404 al modificar un curso inexistente', async () => {
    const servicios = crearServiciosSimulados();
    servicios.cursos.actualizarCurso.mockRejectedValue(new ErrorCursoNoEncontrado());

    await request(crearAppPrueba(servicios))
      .patch('/api/admin/cursos/x')
      .set('Authorization', tokenAdmin())
      .send({ titulo: 'Node' })
      .expect(404)
      .expect(({ body }) => expect(body.error.codigo).toBe('CURSO_NO_ENCONTRADO'));
  });
});

describe('API de imágenes de cursos', () => {
  it('sube imágenes multipart y las registra en orden', async () => {
    const { aplicacion, proveedorImagenes } = crearContextoImagenes();

    const respuesta = await request(aplicacion)
      .post('/api/admin/cursos/curso-1/imagenes')
      .set('Authorization', tokenAdmin())
      .field('textoAlternativo', 'Portada')
      .attach('imagenes', PNG, { filename: 'a.png', contentType: 'image/png' })
      .attach('imagenes', PNG, { filename: 'b.png', contentType: 'image/png' })
      .expect(201);

    expect(respuesta.body).toEqual([
      expect.objectContaining({ cursoId: 'curso-1', orden: 0, textoAlternativo: 'Portada' }),
      expect.objectContaining({ cursoId: 'curso-1', orden: 1 })
    ]);
    expect(proveedorImagenes.subidas).toHaveLength(2);
  });

  it('rechaza archivos cuyo contenido no coincide con el tipo declarado', async () => {
    const { aplicacion, proveedorImagenes } = crearContextoImagenes();

    await request(aplicacion)
      .post('/api/admin/cursos/curso-1/imagenes')
      .set('Authorization', tokenAdmin())
      .attach('imagenes', Buffer.from('<script>'), {
        filename: 'x.png',
        contentType: 'image/png'
      })
      .expect(400)
      .expect(({ body }) => expect(body.error.codigo).toBe('ARCHIVO_INVALIDO'));
    expect(proveedorImagenes.subidas).toHaveLength(0);
  });

  it('rechaza tipos no permitidos y solicitudes sin archivos', async () => {
    const { aplicacion } = crearContextoImagenes();

    await request(aplicacion)
      .post('/api/admin/cursos/curso-1/imagenes')
      .set('Authorization', tokenAdmin())
      .attach('imagenes', Buffer.from('GIF89a'), { filename: 'x.gif', contentType: 'image/gif' })
      .expect(400);
    await request(aplicacion)
      .post('/api/admin/cursos/curso-1/imagenes')
      .set('Authorization', tokenAdmin())
      .expect(400);
  });

  it('respeta el máximo de imágenes por curso', async () => {
    const imagenes = Array.from({ length: 10 }, (_, indice) => ({
      id: `i${indice}`,
      orden: indice
    }));
    const { aplicacion } = crearContextoImagenes({ id: 'curso-1', titulo: 'Node', imagenes });

    await request(aplicacion)
      .post('/api/admin/cursos/curso-1/imagenes')
      .set('Authorization', tokenAdmin())
      .attach('imagenes', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(409)
      .expect(({ body }) => expect(body.error.codigo).toBe('LIMITE_IMAGENES'));
  });

  it('elimina una imagen del curso y su recurso externo', async () => {
    const { aplicacion, repositorioImagenes, proveedorImagenes } = crearContextoImagenes();
    repositorioImagenes.buscarPorId.mockResolvedValue({
      id: 'img-1',
      cursoId: 'curso-1',
      idPublico: 'nexus/cursos/img-1'
    });

    await request(aplicacion)
      .delete('/api/admin/cursos/curso-1/imagenes/img-1')
      .set('Authorization', tokenAdmin())
      .expect(200, { mensaje: 'La imagen fue eliminada correctamente.' });
    expect(repositorioImagenes.eliminar).toHaveBeenCalledWith('img-1');
    expect(proveedorImagenes.eliminadas).toEqual(['nexus/cursos/img-1']);
  });

  it('no elimina imágenes que pertenecen a otro curso', async () => {
    const { aplicacion, repositorioImagenes } = crearContextoImagenes();
    repositorioImagenes.buscarPorId.mockResolvedValue({ id: 'img-1', cursoId: 'otro-curso' });

    await request(aplicacion)
      .delete('/api/admin/cursos/curso-1/imagenes/img-1')
      .set('Authorization', tokenAdmin())
      .expect(404)
      .expect(({ body }) => expect(body.error.codigo).toBe('IMAGEN_NO_ENCONTRADA'));
    expect(repositorioImagenes.eliminar).not.toHaveBeenCalled();
  });
});
