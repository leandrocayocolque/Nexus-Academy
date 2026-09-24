import { describe, expect, it } from 'vitest';
import { construirDatosSemilla } from '../../../prisma/seed.data.js';

describe('datos deterministas de semilla', () => {
  it('incluye negocio único, administrador, categorías, cursos, promociones y consultas', () => {
    const datos = construirDatosSemilla({ correoAdmin: 'ADMIN@Example.com' });

    expect(datos.negocio.claveUnica).toBe('negocio');
    expect(datos.administrador.correo).toBe('admin@example.com');
    expect(datos.categorias).toHaveLength(6);
    expect(datos.cursos.length).toBeGreaterThanOrEqual(20);
    expect(datos.promociones.length).toBeGreaterThan(0);
    expect(new Set(datos.consultas.map(({ estado }) => estado))).toEqual(
      new Set(['PENDIENTE', 'LEIDA', 'RESPONDIDA'])
    );
  });

  it('devuelve claves estables idénticas para entradas idénticas', () => {
    const primero = construirDatosSemilla({ correoAdmin: 'admin@example.com' });
    const segundo = construirDatosSemilla({ correoAdmin: 'admin@example.com' });

    expect(segundo).toEqual(primero);
    expect(new Set(primero.cursos.map(({ slug }) => slug)).size).toBe(primero.cursos.length);
  });
});
