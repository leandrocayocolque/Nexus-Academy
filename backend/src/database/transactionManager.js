import { clientePrisma } from '../config/prisma.js';
import { crearRepositorios } from './repositories.js';

export function crearGestorTransacciones(
  cliente = clientePrisma,
  fabricaRepositorios = crearRepositorios
) {
  if (!cliente || typeof cliente.$transaction !== 'function') {
    throw new TypeError('Se requiere un cliente Prisma con soporte para transacciones callback.');
  }

  if (typeof fabricaRepositorios !== 'function') {
    throw new TypeError('Se requiere una fábrica de repositorios.');
  }

  const ejecutar = (trabajo, opciones) => {
    if (typeof trabajo !== 'function') {
      throw new TypeError('El trabajo transaccional debe ser una función.');
    }

    return cliente.$transaction(
      (clienteTransaccion) => trabajo(fabricaRepositorios(clienteTransaccion)),
      opciones
    );
  };

  return Object.freeze({
    ejecutar,
    run: ejecutar
  });
}

export const gestorTransacciones = crearGestorTransacciones();

export function ejecutarEnTransaccion(trabajo, opciones) {
  return gestorTransacciones.ejecutar(trabajo, opciones);
}

export const createTransactionManager = crearGestorTransacciones;
