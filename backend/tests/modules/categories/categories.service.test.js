import { describe, expect, it, vi } from 'vitest';
import { ErrorReferenciaPersistencia } from '../../../src/database/erroresPersistencia.js';
import { crearServicioCategorias } from '../../../src/modules/categories/categories.service.js';

function crearContexto() {
  const repositorioCategorias = {
    buscarPorId: vi.fn(),
    buscarPorSlug: vi.fn(),
    existePorSlug: vi.fn().mockResolvedValue(false),
    existePorNombre: vi.fn().mockResolvedValue(false),
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn()
  };
  return {
    repositorioCategorias,
    servicio: crearServicioCategorias({ repositorioCategorias })
  };
}

describe('Servicio de categorías', () => {
  it('crea una categoría con slug consistente', async () => {
    const { servicio, repositorioCategorias } = crearContexto();
    repositorioCategorias.crear.mockImplementation(async (datos) => ({ id: 'cat-1', ...datos }));

    const categoria = await servicio.crearCategoria({
      nombre: ' Ciencia de Datos ',
      descripcion: ' Formación aplicada '
    });

    expect(repositorioCategorias.crear).toHaveBeenCalledWith({
      nombre: 'Ciencia de Datos',
      descripcion: 'Formación aplicada',
      activa: true,
      slug: 'ciencia-de-datos'
    });
    expect(categoria.slug).toBe('ciencia-de-datos');
  });

  it('controla duplicados por nombre o slug', async () => {
    const { servicio, repositorioCategorias } = crearContexto();
    repositorioCategorias.existePorNombre.mockResolvedValue(true);

    await expect(servicio.crearCategoria({ nombre: 'Diseño' })).rejects.toMatchObject({
      codigo: 'CATEGORIA_DUPLICADA'
    });
    expect(repositorioCategorias.crear).not.toHaveBeenCalled();
  });

  it('regenera el slug al actualizar el nombre', async () => {
    const { servicio, repositorioCategorias } = crearContexto();
    repositorioCategorias.buscarPorId.mockResolvedValue({ id: 'cat-1', slug: 'diseno' });
    repositorioCategorias.actualizar.mockImplementation(async (id, datos) => ({ id, ...datos }));

    await servicio.actualizarCategoria('cat-1', { nombre: 'Diseño Digital' });

    expect(repositorioCategorias.actualizar).toHaveBeenCalledWith('cat-1', {
      nombre: 'Diseño Digital',
      slug: 'diseno-digital'
    });
  });

  it('traduce una referencia persistente a CATEGORIA_EN_USO', async () => {
    const { servicio, repositorioCategorias } = crearContexto();
    repositorioCategorias.buscarPorId.mockResolvedValue({ id: 'cat-1' });
    repositorioCategorias.eliminar.mockRejectedValue(new ErrorReferenciaPersistencia());

    await expect(servicio.eliminarCategoria('cat-1')).rejects.toMatchObject({
      codigo: 'CATEGORIA_EN_USO'
    });
  });

  it('obtiene por id/slug y falla con un código específico si no existe', async () => {
    const { servicio, repositorioCategorias } = crearContexto();
    repositorioCategorias.buscarPorId.mockResolvedValue({ id: 'cat-1' });
    repositorioCategorias.buscarPorSlug.mockResolvedValue(null);

    await expect(servicio.obtenerCategoria('cat-1')).resolves.toEqual({ id: 'cat-1' });
    await expect(servicio.obtenerCategoriaPorSlug('ausente')).rejects.toMatchObject({
      codigo: 'CATEGORIA_NO_ENCONTRADA'
    });
  });

  it('lista con paginación 1/12 y serializa el conteo de cursos', async () => {
    const { servicio, repositorioCategorias } = crearContexto();
    repositorioCategorias.listar.mockResolvedValue({
      datos: [{ id: 'cat-1', _count: { cursos: 4 } }],
      paginacion: { total: 1, pagina: 1, limite: 12, paginasTotales: 1 }
    });

    const resultado = await servicio.listarCategorias();

    expect(repositorioCategorias.listar).toHaveBeenCalledWith({ pagina: 1, limite: 12 });
    expect(resultado.datos).toEqual([{ id: 'cat-1', cantidadCursos: 4 }]);
  });
});
