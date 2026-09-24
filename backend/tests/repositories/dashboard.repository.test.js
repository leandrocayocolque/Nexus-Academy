import { describe, expect, it } from 'vitest';
import { crearRepositorioDashboard } from '../../src/modules/dashboard/dashboard.repository.js';
import { crearClientePrismaSimulado } from './clientePrismaSimulado.js';

describe('repositorio de dashboard', () => {
  it('obtiene el resumen persistido en consultas independientes', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.usuario.count.mockResolvedValue(2);
    cliente.categoria.count.mockResolvedValue(6);
    cliente.curso.count.mockResolvedValueOnce(20).mockResolvedValueOnce(17);
    cliente.consulta.count.mockResolvedValue(3);
    cliente.promocion.count.mockResolvedValue(4);

    await expect(crearRepositorioDashboard(cliente).obtenerResumen()).resolves.toEqual({
      usuariosActivos: 2,
      categoriasActivas: 6,
      cursosActivos: 20,
      cursosDisponibles: 17,
      consultasPendientes: 3,
      promocionesActivas: 4
    });
  });

  it('agrupa consultas por estado y mes', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.consulta.groupBy.mockResolvedValue([
      { estado: 'PENDIENTE', _count: { _all: 2 } },
      { estado: 'RESPONDIDA', _count: { _all: 1 } }
    ]);
    cliente.consulta.findMany.mockResolvedValue([
      { creadaEn: new Date('2027-01-02T00:00:00.000Z') },
      { creadaEn: new Date('2027-01-20T00:00:00.000Z') },
      { creadaEn: new Date('2027-02-01T00:00:00.000Z') }
    ]);
    const repositorio = crearRepositorioDashboard(cliente);

    await expect(repositorio.obtenerConsultasPorEstado()).resolves.toEqual([
      { estado: 'PENDIENTE', cantidad: 2 },
      { estado: 'RESPONDIDA', cantidad: 1 }
    ]);
    await expect(
      repositorio.obtenerConsultasPorMes({
        desde: new Date('2027-01-01T00:00:00.000Z'),
        hasta: new Date('2027-02-28T23:59:59.999Z')
      })
    ).resolves.toEqual([
      { mes: '2027-01', cantidad: 2 },
      { mes: '2027-02', cantidad: 1 }
    ]);
  });

  it('calcula cursos y categorías más consultados', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.curso.findMany
      .mockResolvedValueOnce([{ id: 'curso-1', titulo: 'Curso', _count: { consultas: 4 } }])
      .mockResolvedValueOnce([
        { id: 'curso-1', categoria: { id: 'cat-1', nombre: 'A', slug: 'a' } },
        { id: 'curso-2', categoria: { id: 'cat-1', nombre: 'A', slug: 'a' } },
        { id: 'curso-3', categoria: { id: 'cat-2', nombre: 'B', slug: 'b' } }
      ]);
    cliente.consulta.groupBy.mockResolvedValue([
      { cursoId: 'curso-1', _count: { _all: 3 } },
      { cursoId: 'curso-2', _count: { _all: 2 } },
      { cursoId: 'curso-3', _count: { _all: 4 } }
    ]);
    const repositorio = crearRepositorioDashboard(cliente);

    await expect(repositorio.obtenerCursosMasConsultados()).resolves.toEqual([
      { id: 'curso-1', titulo: 'Curso', cantidadConsultas: 4 }
    ]);
    await expect(repositorio.obtenerCategoriasMasConsultadas()).resolves.toEqual([
      { id: 'cat-1', nombre: 'A', slug: 'a', cantidadConsultas: 5 },
      { id: 'cat-2', nombre: 'B', slug: 'b', cantidadConsultas: 4 }
    ]);
  });

  it('consulta baja disponibilidad con orden estable', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.curso.findMany.mockResolvedValue([]);

    await crearRepositorioDashboard(cliente).obtenerCursosConBajaDisponibilidad({
      umbral: 3,
      limite: 5
    });

    expect(cliente.curso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { activo: true, cuposDisponibles: { lte: 3 } },
        take: 5,
        orderBy: [{ cuposDisponibles: 'asc' }, { fechaInicio: 'asc' }, { id: 'asc' }]
      })
    );
  });
});
