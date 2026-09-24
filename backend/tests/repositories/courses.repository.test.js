import { describe, expect, it } from 'vitest';
import {
  crearRepositorioCursos,
  crearRepositorioImagenesCurso
} from '../../src/modules/courses/courses.repository.js';
import { ErrorReferenciaPersistencia } from '../../src/database/erroresPersistencia.js';
import { crearClientePrismaSimulado } from './clientePrismaSimulado.js';

describe('repositorio de cursos', () => {
  it('normaliza filtros, limita paginación y aplica whitelist de orden', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.curso.findMany.mockResolvedValue([]);
    cliente.curso.count.mockResolvedValue(0);

    await crearRepositorioCursos(cliente).listar({
      pagina: 3,
      limite: 500,
      buscar: ' Node ',
      slugCategoria: ' programacion ',
      disponible: true,
      precioMinimo: '100.00',
      ordenarPor: '__proto__',
      direccion: 'asc'
    });

    const consulta = cliente.curso.findMany.mock.calls[0][0];
    expect(consulta.skip).toBe(200);
    expect(consulta.take).toBe(100);
    expect(consulta.orderBy).toEqual([{ fechaInicio: 'asc' }, { id: 'asc' }]);
    expect(consulta.where.AND).toContainEqual({
      categoria: { slug: 'programacion' }
    });
    expect(consulta.where.AND).toContainEqual({ activo: true, cuposDisponibles: { gt: 0 } });
  });

  it('usa un desempate por id para cada campo de orden permitido', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.curso.findMany.mockResolvedValue([]);
    cliente.curso.count.mockResolvedValue(0);

    await crearRepositorioCursos(cliente).listar({ ordenarPor: 'precio', direccion: 'desc' });

    expect(cliente.curso.findMany.mock.calls[0][0].orderBy).toEqual([
      { precio: 'desc' },
      { id: 'desc' }
    ]);
  });

  it('ordena imágenes de forma determinista y conserva el cliente inyectado', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.imagenCurso.findMany.mockResolvedValue([]);

    await crearRepositorioImagenesCurso(cliente).listarPorCurso('curso-1');

    expect(cliente.imagenCurso.findMany).toHaveBeenCalledWith({
      where: { cursoId: 'curso-1' },
      orderBy: [{ orden: 'asc' }, { id: 'asc' }]
    });
  });

  it('traduce errores de referencia sin introducir conceptos HTTP', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.curso.delete.mockRejectedValue({ code: 'P2003', meta: { field_name: 'categoria_id' } });

    await expect(crearRepositorioCursos(cliente).eliminar('curso-1')).rejects.toEqual(
      expect.objectContaining({
        constructor: ErrorReferenciaPersistencia,
        codigo: 'REFERENCIA_INVALIDA',
        detalles: { entidad: 'Curso', campo: 'categoria_id' }
      })
    );
  });
});
