import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { baseDatos, clientePrisma } from '../src/config/prisma.js';
import { crearGestorTransacciones } from '../src/database/transactionManager.js';
import { crearRepositorioUsuarios } from '../src/modules/users/users.repository.js';
import { construirDatosSemilla } from './seed.data.js';

const RONDAS_BCRYPT = 12;

function leerConfiguracionSemilla(entorno) {
  if (entorno.NODE_ENV?.trim().toLowerCase() === 'production') {
    throw new Error('La carga de datos de desarrollo está deshabilitada en producción.');
  }

  const correoAdmin = entorno.ADMIN_DESARROLLO_CORREO?.trim();
  const contrasenaAdmin = entorno.ADMIN_DESARROLLO_CONTRASENA;

  if (!correoAdmin) {
    throw new Error('ADMIN_DESARROLLO_CORREO es obligatorio.');
  }

  if (!contrasenaAdmin || contrasenaAdmin.length < 12) {
    throw new Error('ADMIN_DESARROLLO_CONTRASENA debe tener al menos 12 caracteres.');
  }

  return {
    correoAdmin,
    contrasenaAdmin,
    nombreAdmin: entorno.ADMIN_DESARROLLO_NOMBRE ?? 'Nexus',
    apellidoAdmin: entorno.ADMIN_DESARROLLO_APELLIDO ?? 'Administrador'
  };
}

async function resolverHashContrasena(repositorioUsuarios, correo, contrasena) {
  const administradorExistente = await repositorioUsuarios.buscarPorCorreo(correo);

  if (
    administradorExistente &&
    (await bcrypt.compare(contrasena, administradorExistente.hashContrasena))
  ) {
    return administradorExistente.hashContrasena;
  }

  return bcrypt.hash(contrasena, RONDAS_BCRYPT);
}

export async function ejecutarSemilla({
  cliente = clientePrisma,
  entorno = process.env,
  registro = console
} = {}) {
  const configuracion = leerConfiguracionSemilla(entorno);
  const datos = construirDatosSemilla(configuracion);
  const repositorioUsuarios = crearRepositorioUsuarios(cliente);
  const hashContrasena = await resolverHashContrasena(
    repositorioUsuarios,
    datos.administrador.correo,
    configuracion.contrasenaAdmin
  );
  const gestorTransacciones = crearGestorTransacciones(cliente);

  await gestorTransacciones.ejecutar(
    async (repositorios) => {
      await repositorios.negocio.guardar(datos.negocio);

      await repositorios.usuarios.crearOActualizarPorCorreo({
        ...datos.administrador,
        hashContrasena
      });

      const idsCategorias = new Map();
      for (const categoria of datos.categorias) {
        const categoriaGuardada = await repositorios.categorias.crearOActualizarPorSlug(categoria);
        idsCategorias.set(categoriaGuardada.slug, categoriaGuardada.id);
      }

      const idsCursos = new Map();
      for (const curso of datos.cursos) {
        const { slugCategoria, ...datosCurso } = curso;
        const categoriaId = idsCategorias.get(slugCategoria);
        const cursoGuardado = await repositorios.cursos.crearOActualizarPorSlug({
          ...datosCurso,
          categoriaId
        });
        idsCursos.set(cursoGuardado.slug, cursoGuardado.id);
      }

      for (const promocion of datos.promociones) {
        const { slugCurso, ...datosPromocion } = promocion;
        const cursoId = slugCurso ? idsCursos.get(slugCurso) : null;
        await repositorios.promociones.guardarPorId({ ...datosPromocion, cursoId });
      }

      for (const consulta of datos.consultas) {
        const { slugCurso, ...datosConsulta } = consulta;
        const cursoId = slugCurso ? idsCursos.get(slugCurso) : null;
        await repositorios.consultas.guardarPorId({ ...datosConsulta, cursoId });
      }
    },
    { timeout: 20_000 }
  );

  registro.info?.(
    `Semilla completada: 1 negocio, 1 administrador, ${datos.categorias.length} categorías, ` +
      `${datos.cursos.length} cursos, ${datos.promociones.length} promociones y ` +
      `${datos.consultas.length} consultas.`
  );

  return datos;
}

export const runSeed = ejecutarSemilla;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ejecutarSemilla()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => baseDatos.desconectar());
}
