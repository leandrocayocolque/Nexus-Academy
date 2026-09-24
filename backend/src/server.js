import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { crearComposicion } from './composition.js';
import { registro } from './config/logger.js';

function escuchar(servidor, puerto) {
  return new Promise((resolver, rechazar) => {
    servidor.once('error', rechazar);
    servidor.listen(puerto, () => {
      servidor.off('error', rechazar);
      resolver();
    });
  });
}

function cerrarServidor(servidor) {
  if (!servidor.listening) return Promise.resolve();

  return new Promise((resolver, rechazar) => {
    servidor.close((error) => (error ? rechazar(error) : resolver()));
  });
}

export function crearManejadorApagado({ servidor, cicloVidaBaseDatos, registrador = registro }) {
  let apagadoEnCurso;

  return (senal) => {
    if (apagadoEnCurso) return apagadoEnCurso;

    apagadoEnCurso = (async () => {
      registrador.info({ senal }, 'Iniciando apagado controlado');

      try {
        await cerrarServidor(servidor);
        await cicloVidaBaseDatos.desconectar();
        registrador.info('Apagado controlado completado');
      } catch (error) {
        registrador.error({ error }, 'Falló el apagado controlado');
        process.exitCode = 1;
      }
    })();

    return apagadoEnCurso;
  };
}

export async function iniciarServidor(opciones = {}) {
  const { aplicacion, configuracion, cicloVidaBaseDatos, registrador } = crearComposicion(opciones);
  await cicloVidaBaseDatos.conectar();

  const servidor = createServer(aplicacion);

  try {
    await escuchar(servidor, configuracion.puerto);
  } catch (error) {
    await cicloVidaBaseDatos.desconectar();
    throw error;
  }

  registrador.info({ puerto: configuracion.puerto }, 'API NEXUS disponible');

  const apagar = crearManejadorApagado({ servidor, cicloVidaBaseDatos, registrador });
  process.once('SIGINT', apagar);
  process.once('SIGTERM', apagar);

  return Object.freeze({ servidor, apagar });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  iniciarServidor().catch((error) => {
    registro.fatal({ error }, 'No se pudo iniciar la API NEXUS');
    process.exitCode = 1;
  });
}
