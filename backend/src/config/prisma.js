import { PrismaClient } from '@prisma/client';
import { entorno } from './env.js';

const alcanceGlobal = globalThis;

function limitarConexionesPooler(url) {
  let destino;
  try {
    destino = new URL(url);
  } catch {
    return url;
  }

  if (
    !['postgresql:', 'postgres:'].includes(destino.protocol) ||
    !destino.hostname.toLowerCase().endsWith('.pooler.supabase.com') ||
    (destino.port && destino.port !== '5432') ||
    destino.searchParams.has('connection_limit')
  ) {
    return url;
  }

  // Anexar al texto original evita recodificar credenciales, parámetros y fragmento.
  const indiceFragmento = url.indexOf('#');
  const base = indiceFragmento === -1 ? url : url.slice(0, indiceFragmento);
  const fragmento = indiceFragmento === -1 ? '' : url.slice(indiceFragmento);
  const separador = !base.includes('?') ? '?' : /[?&]$/.test(base) ? '' : '&';
  return `${base}${separador}connection_limit=1${fragmento}`;
}

export function crearClientePrisma(opciones) {
  const opcionesBase = entorno.urlBaseDatos
    ? { datasources: { db: { url: limitarConexionesPooler(entorno.urlBaseDatos) } } }
    : {};
  return new PrismaClient({ ...opcionesBase, ...opciones });
}

export function crearCicloVidaBaseDatos(cliente) {
  if (
    !cliente ||
    typeof cliente.$connect !== 'function' ||
    typeof cliente.$disconnect !== 'function'
  ) {
    throw new TypeError('Se requiere un cliente compatible con Prisma.');
  }

  let promesaConexion;
  let promesaDesconexion;

  const conectar = () => {
    if (!promesaConexion) {
      promesaConexion = Promise.resolve(cliente.$connect()).catch((error) => {
        promesaConexion = undefined;
        throw error;
      });
    }

    return promesaConexion;
  };

  const desconectar = () => {
    if (!promesaDesconexion) {
      promesaDesconexion = Promise.resolve(promesaConexion)
        .catch(() => undefined)
        .then(() => cliente.$disconnect())
        .finally(() => {
          promesaConexion = undefined;
          promesaDesconexion = undefined;
        });
    }

    return promesaDesconexion;
  };

  return Object.freeze({
    cliente,
    conectar,
    desconectar,
    client: cliente,
    connect: conectar,
    disconnect: desconectar
  });
}

export const clientePrisma = alcanceGlobal.__clientePrismaNexus ?? crearClientePrisma();

if (!entorno.esProduccion) {
  alcanceGlobal.__clientePrismaNexus = clientePrisma;
}

export const baseDatos = crearCicloVidaBaseDatos(clientePrisma);

export const prisma = clientePrisma;
export const database = baseDatos;
export const createPrismaClient = crearClientePrisma;
export const createDatabaseLifecycle = crearCicloVidaBaseDatos;
