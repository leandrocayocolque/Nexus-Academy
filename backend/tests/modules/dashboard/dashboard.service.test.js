import { describe, expect, it, vi } from 'vitest';
import { crearServicioDashboard } from '../../../src/modules/dashboard/dashboard.service.js';

const AHORA = new Date('2027-12-20T12:00:00.000Z');

function crearContexto() {
  const repositorioDashboard = {
    obtenerResumen: vi.fn().mockResolvedValue({ cursosActivos: 10 }),
    obtenerConsultasPorEstado: vi.fn().mockResolvedValue([{ estado: 'PENDIENTE', cantidad: 2 }]),
    obtenerConsultasPorMes: vi.fn().mockResolvedValue([{ mes: '2027-12', cantidad: 2 }]),
    obtenerCursosMasConsultados: vi.fn().mockResolvedValue([
      {
        id: 'curso-1',
        activo: true,
        cuposDisponibles: 3,
        precio: { constructor: { name: 'Decimal' }, toString: () => '10.00' }
      }
    ]),
    obtenerCategoriasMasConsultadas: vi
      .fn()
      .mockResolvedValue([{ id: 'cat-1', cantidadConsultas: 4 }]),
    obtenerCursosConBajaDisponibilidad: vi
      .fn()
      .mockResolvedValue([{ id: 'curso-2', activo: true, cuposDisponibles: 1 }])
  };
  return {
    repositorioDashboard,
    servicio: crearServicioDashboard({ repositorioDashboard, reloj: () => new Date(AHORA) })
  };
}

describe('Servicio de dashboard', () => {
  it('delega resumen, estados y periodo mensual validado', async () => {
    const { servicio, repositorioDashboard } = crearContexto();

    await expect(servicio.obtenerResumen()).resolves.toEqual({ cursosActivos: 10 });
    await expect(servicio.obtenerConsultasPorEstado()).resolves.toHaveLength(1);
    await servicio.obtenerConsultasPorMes();
    expect(repositorioDashboard.obtenerConsultasPorMes).toHaveBeenCalledWith({ hasta: AHORA });
  });

  it('valida límites, deriva disponibilidad y serializa dinero', async () => {
    const { servicio } = crearContexto();

    await expect(servicio.obtenerCursosMasConsultados({ limite: 5 })).resolves.toEqual([
      expect.objectContaining({ id: 'curso-1', precio: '10.00', disponible: true })
    ]);
    await expect(servicio.obtenerCursosConBajaDisponibilidad({ umbral: -1 })).rejects.toMatchObject(
      { name: 'ZodError' }
    );
  });

  it('construye un dashboard básico con todas las métricas', async () => {
    const { servicio, repositorioDashboard } = crearContexto();

    const dashboard = await servicio.obtenerDashboard({ limite: 3, umbral: 2 });

    expect(dashboard).toEqual(
      expect.objectContaining({
        resumen: { cursosActivos: 10 },
        consultasPorEstado: expect.any(Array),
        consultasPorMes: expect.any(Array),
        cursosMasConsultados: expect.any(Array),
        categoriasMasConsultadas: expect.any(Array),
        cursosConBajaDisponibilidad: expect.any(Array)
      })
    );
    expect(repositorioDashboard.obtenerCategoriasMasConsultadas).toHaveBeenCalledWith({
      limite: 3
    });
    expect(repositorioDashboard.obtenerCursosConBajaDisponibilidad).toHaveBeenCalledWith({
      umbral: 2,
      limite: 3
    });
  });
});
