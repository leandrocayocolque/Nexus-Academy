import { describe, expect, it } from 'vitest';
import { crearRepositorios } from '../../src/database/repositories.js';
import { crearGestorTransacciones } from '../../src/database/transactionManager.js';
import { crearClientePrismaSimulado } from './clientePrismaSimulado.js';

describe('contratos de repositorios Prisma', () => {
  it('construye todos los repositorios sobre un cliente inyectado', () => {
    const repositorios = crearRepositorios(crearClientePrismaSimulado());

    expect(Object.keys(repositorios)).toEqual([
      'usuarios',
      'negocio',
      'categorias',
      'cursos',
      'imagenesCurso',
      'consultas',
      'promociones',
      'tokensRestablecimiento',
      'dashboard'
    ]);
  });

  it('reconstruye los repositorios con el cliente transaccional del callback', async () => {
    const clienteTransaccional = crearClientePrismaSimulado();
    clienteTransaccional.usuario.findUnique.mockResolvedValue({ id: 'u1' });
    const cliente = {
      $transaction: (trabajo) => trabajo(clienteTransaccional)
    };

    const resultado = await crearGestorTransacciones(cliente).ejecutar((repositorios) =>
      repositorios.usuarios.buscarPorId('u1')
    );

    expect(resultado).toEqual({ id: 'u1' });
    expect(clienteTransaccional.usuario.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('normaliza correos y pagina usuarios con orden determinista', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.usuario.findUnique.mockResolvedValue({ id: 'u1' });
    cliente.usuario.findMany.mockResolvedValue([]);
    cliente.usuario.count.mockResolvedValue(0);
    const { usuarios } = crearRepositorios(cliente);

    await usuarios.buscarPorCorreo(' ADMIN@Example.COM ');
    const resultado = await usuarios.listar({ pagina: 2, limite: 5, buscar: ' Ana ' });

    expect(cliente.usuario.findUnique).toHaveBeenCalledWith({
      where: { correo: 'admin@example.com' }
    });
    expect(cliente.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }]
      })
    );
    expect(resultado.paginacion).toEqual({ total: 0, pagina: 2, limite: 5, paginasTotales: 0 });
  });

  it('implementa persistencia del negocio, categorías y consultas', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.negocio.upsert.mockResolvedValue({ id: 'n1' });
    cliente.categoria.findFirst.mockResolvedValue({ id: 'c1' });
    cliente.consulta.create.mockResolvedValue({ id: 'q1' });
    const repositorios = crearRepositorios(cliente);

    await repositorios.negocio.guardar({ id: 'n1', claveUnica: 'otra', nombre: 'NEXUS' });
    const existe = await repositorios.categorias.existePorSlug(' programacion ', 'c2');
    await repositorios.consultas.crear({ correo: ' PERSONA@Example.com ', mensaje: 'Consulta' });

    expect(cliente.negocio.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { claveUnica: 'negocio' } })
    );
    expect(existe).toBe(true);
    expect(cliente.categoria.findFirst).toHaveBeenCalledWith({
      where: { slug: 'programacion', id: { not: 'c2' } },
      select: { id: true }
    });
    expect(cliente.consulta.create.mock.calls[0][0].data.correo).toBe('persona@example.com');
  });

  it('filtra promociones efectivas sin confiar en estado derivado persistido', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.promocion.findMany.mockResolvedValue([]);
    cliente.promocion.count.mockResolvedValue(0);
    const fecha = new Date('2027-01-15T00:00:00.000Z');

    await crearRepositorios(cliente).promociones.listar({ efectivaEn: fecha });

    const { where } = cliente.promocion.findMany.mock.calls[0][0];
    expect(where.AND).toContainEqual({ estado: 'ACTIVA' });
    expect(where.AND).toContainEqual({
      OR: [{ fechaInicio: null }, { fechaInicio: { lte: fecha } }]
    });
    expect(where.AND).toContainEqual({
      OR: [{ fechaFin: null }, { fechaFin: { gte: fecha } }]
    });
  });

  it('consulta e invalida tokens de restablecimiento activos', async () => {
    const cliente = crearClientePrismaSimulado();
    cliente.tokenRestablecimiento.findFirst.mockResolvedValue({ id: 't1' });
    cliente.tokenRestablecimiento.updateMany.mockResolvedValue({ count: 1 });
    const repositorio = crearRepositorios(cliente).tokensRestablecimiento;
    const ahora = new Date('2027-01-01T00:00:00.000Z');

    await repositorio.buscarActivoPorHash('hash', ahora);
    await repositorio.invalidarActivosDeUsuario('u1', ahora);

    expect(cliente.tokenRestablecimiento.findFirst).toHaveBeenCalledWith({
      where: { hashToken: 'hash', usadoEn: null, expiraEn: { gt: ahora } },
      include: { usuario: true }
    });
    expect(cliente.tokenRestablecimiento.updateMany).toHaveBeenCalledWith({
      where: { usuarioId: 'u1', usadoEn: null, expiraEn: { gt: ahora } },
      data: { usadoEn: ahora }
    });
  });
});
