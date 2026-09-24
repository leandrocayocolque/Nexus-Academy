import { vi } from 'vitest';

export function crearDelegadoSimulado() {
  return {
    aggregate: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    groupBy: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn()
  };
}

export function crearClientePrismaSimulado() {
  return {
    usuario: crearDelegadoSimulado(),
    negocio: crearDelegadoSimulado(),
    categoria: crearDelegadoSimulado(),
    curso: crearDelegadoSimulado(),
    imagenCurso: crearDelegadoSimulado(),
    consulta: crearDelegadoSimulado(),
    promocion: crearDelegadoSimulado(),
    tokenRestablecimiento: crearDelegadoSimulado()
  };
}
