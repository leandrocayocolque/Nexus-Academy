import { describe, expect, it, vi } from 'vitest';
import { crearServicioConsultas } from '../../../src/modules/inquiries/inquiries.service.js';

const CONSULTA_VALIDA = {
  cursoId: 'curso-1',
  nombre: ' Ana Pérez ',
  correo: ' ANA@Example.COM ',
  telefono: null,
  asunto: ' Información del curso ',
  mensaje: 'Quisiera conocer los horarios disponibles.'
};

function crearContexto() {
  const repositorioConsultas = {
    buscarPorId: vi.fn(),
    listar: vi.fn(),
    crear: vi.fn(),
    actualizarEstado: vi.fn(),
    eliminar: vi.fn()
  };
  const repositorioCursos = { buscarPorId: vi.fn().mockResolvedValue({ id: 'curso-1' }) };
  const proveedorCorreo = { enviarNotificacionNuevaConsulta: vi.fn() };
  const registrador = { warn: vi.fn() };
  return {
    repositorioConsultas,
    repositorioCursos,
    proveedorCorreo,
    registrador,
    servicio: crearServicioConsultas({
      repositorioConsultas,
      repositorioCursos,
      proveedorCorreo,
      registrador
    })
  };
}

describe('Servicio de consultas', () => {
  it('persiste antes de enviar el correo y normaliza la entrada', async () => {
    const contexto = crearContexto();
    contexto.repositorioConsultas.crear.mockImplementation(async (datos) => ({
      id: 'consulta-1',
      ...datos
    }));

    const consulta = await contexto.servicio.crearConsulta(CONSULTA_VALIDA);

    expect(contexto.repositorioConsultas.crear).toHaveBeenCalledWith({
      cursoId: 'curso-1',
      nombre: 'Ana Pérez',
      correo: 'ana@example.com',
      telefono: null,
      asunto: 'Información del curso',
      mensaje: 'Quisiera conocer los horarios disponibles.',
      estado: 'PENDIENTE'
    });
    expect(contexto.repositorioConsultas.crear.mock.invocationCallOrder[0]).toBeLessThan(
      contexto.proveedorCorreo.enviarNotificacionNuevaConsulta.mock.invocationCallOrder[0]
    );
    expect(consulta.id).toBe('consulta-1');
  });

  it('conserva la consulta y registra un fallo de correo', async () => {
    const contexto = crearContexto();
    contexto.repositorioConsultas.crear.mockResolvedValue({
      id: 'consulta-1',
      estado: 'PENDIENTE'
    });
    contexto.proveedorCorreo.enviarNotificacionNuevaConsulta.mockRejectedValue(
      new Error('proveedor caído')
    );

    await expect(contexto.servicio.crearConsulta(CONSULTA_VALIDA)).resolves.toMatchObject({
      id: 'consulta-1'
    });
    expect(contexto.registrador.warn).toHaveBeenCalledWith(
      expect.objectContaining({ consultaId: 'consulta-1' }),
      expect.stringContaining('se guardó')
    );
  });

  it('admite consulta sin curso y rechaza una referencia inexistente', async () => {
    const contexto = crearContexto();
    contexto.repositorioConsultas.crear.mockImplementation(async (datos) => ({
      id: 'consulta-1',
      ...datos
    }));

    await contexto.servicio.crearConsulta({ ...CONSULTA_VALIDA, cursoId: null });
    expect(contexto.repositorioCursos.buscarPorId).not.toHaveBeenCalled();
    expect(contexto.repositorioConsultas.crear).toHaveBeenCalledWith(
      expect.objectContaining({ cursoId: null })
    );

    contexto.repositorioCursos.buscarPorId.mockResolvedValue(null);
    await expect(contexto.servicio.crearConsulta(CONSULTA_VALIDA)).rejects.toMatchObject({
      codigo: 'CURSO_NO_ENCONTRADO'
    });
  });

  it('lista con filtros, rango y paginación predeterminada', async () => {
    const contexto = crearContexto();
    contexto.repositorioConsultas.listar.mockResolvedValue({ datos: [], paginacion: {} });

    await contexto.servicio.listarConsultas({
      estado: 'PENDIENTE',
      correo: ' PERSONA@Example.COM ',
      fechaDesde: '2027-01-01',
      fechaHasta: '2027-01-31'
    });

    expect(contexto.repositorioConsultas.listar).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 'PENDIENTE',
        correo: 'persona@example.com',
        pagina: 1,
        limite: 12,
        fechaDesde: expect.any(Date),
        fechaHasta: expect.any(Date)
      })
    );
  });

  it('obtiene, cambia estado y elimina con errores específicos', async () => {
    const contexto = crearContexto();
    contexto.repositorioConsultas.buscarPorId.mockResolvedValue({ id: 'consulta-1' });
    contexto.repositorioConsultas.actualizarEstado.mockResolvedValue({
      id: 'consulta-1',
      estado: 'RESPONDIDA'
    });

    await expect(contexto.servicio.obtenerConsulta('consulta-1')).resolves.toEqual({
      id: 'consulta-1'
    });
    await contexto.servicio.cambiarEstadoConsulta('consulta-1', { estado: 'RESPONDIDA' });
    await contexto.servicio.eliminarConsulta('consulta-1');
    expect(contexto.repositorioConsultas.actualizarEstado).toHaveBeenCalledWith(
      'consulta-1',
      'RESPONDIDA'
    );

    contexto.repositorioConsultas.buscarPorId.mockResolvedValue(null);
    await expect(contexto.servicio.obtenerConsulta('ausente')).rejects.toMatchObject({
      codigo: 'CONSULTA_NO_ENCONTRADA'
    });
  });
});
