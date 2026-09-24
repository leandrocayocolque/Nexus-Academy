import { describe, expect, it, vi } from 'vitest';
import { crearServicioCursos } from '../../../src/modules/courses/courses.service.js';

class Decimal {
  constructor(valor) {
    this.valor = valor;
  }

  toString() {
    return this.valor;
  }
}

const CURSO_VALIDO = {
  categoriaId: 'cat-1',
  titulo: 'Node.js Profesional',
  descripcion: 'Curso práctico',
  duracion: '8 semanas',
  cuposDisponibles: 12,
  fechaInicio: '2027-03-01T12:00:00.000Z',
  precio: '399.9',
  nivel: 'INTERMEDIO',
  modalidad: 'EN_LINEA'
};

function crearContexto() {
  const repositorioCursos = {
    buscarPorId: vi.fn(),
    buscarPorSlug: vi.fn(),
    existePorSlug: vi.fn().mockResolvedValue(false),
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn()
  };
  const repositorioCategorias = { buscarPorId: vi.fn().mockResolvedValue({ id: 'cat-1' }) };
  const proveedorImagenes = { eliminar: vi.fn() };
  const registrador = { warn: vi.fn() };
  return {
    repositorioCursos,
    repositorioCategorias,
    proveedorImagenes,
    registrador,
    servicio: crearServicioCursos({
      repositorioCursos,
      repositorioCategorias,
      proveedorImagenes,
      registrador
    })
  };
}

describe('Servicio de cursos', () => {
  it('crea con slug, precio decimal normalizado y disponibilidad derivada', async () => {
    const contexto = crearContexto();
    contexto.repositorioCursos.crear.mockImplementation(async (datos) => ({
      id: 'curso-1',
      ...datos,
      precio: new Decimal(datos.precio)
    }));

    const curso = await contexto.servicio.crearCurso(CURSO_VALIDO);

    expect(contexto.repositorioCursos.crear).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'nodejs-profesional', precio: '399.90' })
    );
    expect(curso).toMatchObject({ precio: '399.90', disponible: true });
  });

  it('rechaza categoría inexistente, cupos negativos y slug duplicado', async () => {
    const contexto = crearContexto();
    contexto.repositorioCategorias.buscarPorId.mockResolvedValueOnce(null);
    await expect(contexto.servicio.crearCurso(CURSO_VALIDO)).rejects.toMatchObject({
      codigo: 'CATEGORIA_NO_ENCONTRADA'
    });

    await expect(
      contexto.servicio.crearCurso({ ...CURSO_VALIDO, cuposDisponibles: -1 })
    ).rejects.toMatchObject({ name: 'ZodError' });

    contexto.repositorioCursos.existePorSlug.mockResolvedValue(true);
    await expect(contexto.servicio.crearCurso(CURSO_VALIDO)).rejects.toMatchObject({
      codigo: 'CURSO_DUPLICADO'
    });
  });

  it('actualiza el título y regenera el slug sin partial indiscriminado', async () => {
    const contexto = crearContexto();
    contexto.repositorioCursos.buscarPorId.mockResolvedValue({ id: 'curso-1', slug: 'anterior' });
    contexto.repositorioCursos.actualizar.mockImplementation(async (id, datos) => ({
      id,
      activo: true,
      cuposDisponibles: 1,
      ...datos
    }));

    await contexto.servicio.actualizarCurso('curso-1', { titulo: 'Arquitectura Moderna' });

    expect(contexto.repositorioCursos.actualizar).toHaveBeenCalledWith('curso-1', {
      titulo: 'Arquitectura Moderna',
      slug: 'arquitectura-moderna'
    });
    await expect(
      contexto.servicio.actualizarCurso('curso-1', { capacidad: 20 })
    ).rejects.toMatchObject({ name: 'ZodError' });
  });

  it('aplica filtros, paginación y whitelist de orden', async () => {
    const contexto = crearContexto();
    contexto.repositorioCursos.listar.mockResolvedValue({
      datos: [{ id: 'curso-1', precio: new Decimal('10.00'), activo: false, cuposDisponibles: 4 }],
      paginacion: { total: 1, pagina: 2, limite: 100, paginasTotales: 1 }
    });

    const resultado = await contexto.servicio.buscarCursos({
      buscar: ' node ',
      categoria: 'Programacion',
      nivel: 'INTERMEDIO',
      modalidad: 'EN_LINEA',
      precioMinimo: '10',
      precioMaximo: '500',
      disponible: 'true',
      destacado: 'false',
      fechaInicio: '2027-01-01',
      pagina: 2,
      limite: 100,
      ordenarPor: 'precio',
      direccion: 'desc'
    });

    expect(contexto.repositorioCursos.listar).toHaveBeenCalledWith(
      expect.objectContaining({
        buscar: 'node',
        slugCategoria: 'programacion',
        precioMinimo: '10.00',
        precioMaximo: '500.00',
        disponible: true,
        destacado: false,
        pagina: 2,
        limite: 100,
        ordenarPor: 'precio',
        direccion: 'desc'
      })
    );
    expect(resultado.datos[0]).toMatchObject({ precio: '10.00', disponible: false });
  });

  it('usa página 1, límite 12 y rechaza orden/filtros inválidos', async () => {
    const contexto = crearContexto();
    contexto.repositorioCursos.listar.mockResolvedValue({ datos: [], paginacion: {} });

    await contexto.servicio.buscarCursos();
    expect(contexto.repositorioCursos.listar).toHaveBeenCalledWith(
      expect.objectContaining({
        pagina: 1,
        limite: 12,
        ordenarPor: 'fechaInicio',
        direccion: 'asc'
      })
    );
    await expect(contexto.servicio.buscarCursos({ ordenarPor: '__proto__' })).rejects.toMatchObject(
      { name: 'ZodError' }
    );
    await expect(
      contexto.servicio.buscarCursos({ precioMinimo: '500', precioMaximo: '10' })
    ).rejects.toMatchObject({ name: 'ZodError' });
  });

  it('obtiene por id/slug y activa o destaca explícitamente', async () => {
    const contexto = crearContexto();
    contexto.repositorioCursos.buscarPorId.mockResolvedValue({
      id: 'curso-1',
      activo: false,
      cuposDisponibles: 3
    });
    contexto.repositorioCursos.buscarPorSlug.mockResolvedValue({
      id: 'curso-1',
      activo: true,
      cuposDisponibles: 3
    });
    contexto.repositorioCursos.actualizar.mockImplementation(async (id, datos) => ({
      id,
      cuposDisponibles: 3,
      ...datos
    }));

    await expect(contexto.servicio.obtenerCurso('curso-1')).resolves.toMatchObject({
      disponible: false
    });
    await expect(contexto.servicio.obtenerCursoPorSlug('CURSO')).resolves.toMatchObject({
      disponible: true
    });
    await contexto.servicio.activarCurso('curso-1', { activo: true });
    await contexto.servicio.destacarCurso('curso-1', { destacado: true });

    expect(contexto.repositorioCursos.actualizar).toHaveBeenNthCalledWith(1, 'curso-1', {
      activo: true
    });
    expect(contexto.repositorioCursos.actualizar).toHaveBeenNthCalledWith(2, 'curso-1', {
      destacado: true
    });
  });

  it('elimina primero el curso y luego limpia imágenes externas sin revertir por fallos', async () => {
    const contexto = crearContexto();
    contexto.repositorioCursos.buscarPorId.mockResolvedValue({
      id: 'curso-1',
      imagenes: [
        { id: 'img-1', idPublico: 'publica-1' },
        { id: 'img-2', idPublico: null },
        { id: 'img-3', idPublico: 'publica-3' }
      ]
    });
    contexto.proveedorImagenes.eliminar
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('sin red'));

    await expect(contexto.servicio.eliminarCurso('curso-1')).resolves.toMatchObject({
      mensaje: expect.stringContaining('eliminado')
    });

    expect(contexto.repositorioCursos.eliminar).toHaveBeenCalledWith('curso-1');
    expect(contexto.proveedorImagenes.eliminar).toHaveBeenCalledTimes(2);
    expect(contexto.repositorioCursos.eliminar.mock.invocationCallOrder[0]).toBeLessThan(
      contexto.proveedorImagenes.eliminar.mock.invocationCallOrder[0]
    );
    expect(contexto.registrador.warn).toHaveBeenCalledOnce();
  });
});
