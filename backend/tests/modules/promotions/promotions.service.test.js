import { describe, expect, it, vi } from 'vitest';
import { crearServicioPromociones } from '../../../src/modules/promotions/promotions.service.js';

const AHORA = new Date('2027-01-15T12:00:00.000Z');
const PROMOCION_VALIDA = {
  cursoId: 'curso-1',
  titulo: 'Inscripción anticipada',
  descripcion: 'Beneficio temporal',
  porcentajeDescuento: 15,
  estado: 'ACTIVA',
  fechaInicio: '2027-01-01T00:00:00.000Z',
  fechaFin: '2027-01-31T23:59:59.000Z'
};

function crearContexto() {
  const repositorioPromociones = {
    buscarPorId: vi.fn(),
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn()
  };
  const repositorioCursos = { buscarPorId: vi.fn().mockResolvedValue({ id: 'curso-1' }) };
  return {
    repositorioPromociones,
    repositorioCursos,
    servicio: crearServicioPromociones({
      repositorioPromociones,
      repositorioCursos,
      reloj: () => new Date(AHORA)
    })
  };
}

describe('Servicio de promociones', () => {
  it('crea una promoción vigente y admite curso opcional', async () => {
    const contexto = crearContexto();
    contexto.repositorioPromociones.crear.mockImplementation(async (datos) => ({
      id: 'promo-1',
      ...datos
    }));

    await expect(contexto.servicio.crearPromocion(PROMOCION_VALIDA)).resolves.toMatchObject({
      id: 'promo-1',
      porcentajeDescuento: 15,
      vigente: true
    });

    await contexto.servicio.crearPromocion({ ...PROMOCION_VALIDA, cursoId: null });
    expect(contexto.repositorioPromociones.crear).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursoId: null })
    );
  });

  it('rechaza porcentaje, estado y fechas inválidos', async () => {
    const { servicio } = crearContexto();

    await expect(
      servicio.crearPromocion({ ...PROMOCION_VALIDA, porcentajeDescuento: 101 })
    ).rejects.toMatchObject({ name: 'ZodError' });
    await expect(
      servicio.crearPromocion({ ...PROMOCION_VALIDA, estado: 'DESCONOCIDA' })
    ).rejects.toMatchObject({ name: 'ZodError' });
    await expect(
      servicio.crearPromocion({
        ...PROMOCION_VALIDA,
        fechaInicio: '2027-02-01',
        fechaFin: '2027-01-01'
      })
    ).rejects.toMatchObject({ name: 'ZodError' });
  });

  it('valida el periodo completo al actualizar una sola fecha', async () => {
    const contexto = crearContexto();
    contexto.repositorioPromociones.buscarPorId.mockResolvedValue({
      id: 'promo-1',
      fechaInicio: new Date('2027-01-01'),
      fechaFin: new Date('2027-01-31')
    });

    await expect(
      contexto.servicio.actualizarPromocion('promo-1', { fechaInicio: '2027-02-10' })
    ).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS' });
    expect(contexto.repositorioPromociones.actualizar).not.toHaveBeenCalled();
  });

  it('rechaza un curso asociado inexistente', async () => {
    const contexto = crearContexto();
    contexto.repositorioCursos.buscarPorId.mockResolvedValue(null);

    await expect(contexto.servicio.crearPromocion(PROMOCION_VALIDA)).rejects.toMatchObject({
      codigo: 'CURSO_NO_ENCONTRADO'
    });
  });

  it('separa listado vigente del listado administrativo', async () => {
    const contexto = crearContexto();
    contexto.repositorioPromociones.listar.mockResolvedValue({
      datos: [
        {
          id: 'promo-1',
          estado: 'ACTIVA',
          fechaInicio: new Date('2027-01-01'),
          fechaFin: new Date('2027-01-31')
        }
      ],
      paginacion: {}
    });

    const activas = await contexto.servicio.listarPromocionesActivas({ limite: 5 });
    expect(contexto.repositorioPromociones.listar).toHaveBeenNthCalledWith(1, {
      pagina: 1,
      limite: 5,
      efectivaEn: AHORA
    });
    expect(activas.datos[0].vigente).toBe(true);

    await contexto.servicio.listarPromocionesAdministracion({ estado: 'INACTIVA' });
    expect(contexto.repositorioPromociones.listar).toHaveBeenNthCalledWith(2, {
      estado: 'INACTIVA',
      pagina: 1,
      limite: 12
    });
  });

  it('obtiene, actualiza y elimina con error específico para ausentes', async () => {
    const contexto = crearContexto();
    contexto.repositorioPromociones.buscarPorId.mockResolvedValue({
      id: 'promo-1',
      estado: 'INACTIVA',
      fechaInicio: null,
      fechaFin: null
    });
    contexto.repositorioPromociones.actualizar.mockResolvedValue({
      id: 'promo-1',
      estado: 'ACTIVA',
      fechaInicio: null,
      fechaFin: null
    });

    await expect(contexto.servicio.obtenerPromocion('promo-1')).resolves.toMatchObject({
      vigente: false
    });
    await contexto.servicio.actualizarPromocion('promo-1', { estado: 'ACTIVA' });
    await contexto.servicio.eliminarPromocion('promo-1');

    contexto.repositorioPromociones.buscarPorId.mockResolvedValue(null);
    await expect(contexto.servicio.obtenerPromocion('ausente')).rejects.toMatchObject({
      codigo: 'PROMOCION_NO_ENCONTRADA'
    });
  });
});
