import { describe, expect, it } from 'vitest';
import {
  ErrorRegistroNoEncontradoPersistencia,
  ErrorUnicidadPersistencia,
  traducirErrorPersistencia
} from '../../src/database/erroresPersistencia.js';
import { mapearCurso, serializarDecimales } from '../../src/shared/mappers/persistencia.js';

class Decimal {
  constructor(valor) {
    this.valor = valor;
  }

  toString() {
    return this.valor;
  }
}

describe('utilidades de persistencia', () => {
  it('traduce únicamente errores Prisma conocidos', () => {
    expect(
      traducirErrorPersistencia(
        { code: 'P2002', meta: { target: ['correo'] } },
        { entidad: 'Usuario' }
      )
    ).toEqual(expect.any(ErrorUnicidadPersistencia));
    expect(traducirErrorPersistencia({ code: 'P2025' }, { entidad: 'Curso' })).toEqual(
      expect.any(ErrorRegistroNoEncontradoPersistencia)
    );

    const desconocido = new Error('fallo de red');
    expect(traducirErrorPersistencia(desconocido)).toBe(desconocido);
  });

  it('serializa Decimal y deriva disponibilidad fuera del repositorio', () => {
    const curso = mapearCurso({
      id: 'curso-1',
      precio: new Decimal('249.90'),
      activo: true,
      cuposDisponibles: 2,
      categoria: { presupuesto: new Decimal('10.50') }
    });

    expect(curso).toEqual({
      id: 'curso-1',
      precio: '249.90',
      activo: true,
      cuposDisponibles: 2,
      disponible: true,
      categoria: { presupuesto: '10.50' }
    });
    expect(serializarDecimales([new Decimal('1.20')])).toEqual(['1.20']);
  });
});
