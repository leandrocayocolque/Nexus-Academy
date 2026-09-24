import { crearAplicacion } from './app.js';
import { entorno } from './config/env.js';
import { registro } from './config/logger.js';
import { baseDatos } from './config/prisma.js';
import { crearRepositorios } from './database/repositories.js';
import { crearGestorTransacciones } from './database/transactionManager.js';
import { crearServicioAutenticacion } from './modules/auth/auth.service.js';
import { crearServicioNegocio } from './modules/business/business.service.js';
import { crearServicioCategorias } from './modules/categories/categories.service.js';
import { crearServicioCursos } from './modules/courses/courses.service.js';
import { crearServicioDashboard } from './modules/dashboard/dashboard.service.js';
import { crearServicioConsultas } from './modules/inquiries/inquiries.service.js';
import { crearServicioPromociones } from './modules/promotions/promotions.service.js';
import { crearServicioUsuarios } from './modules/users/users.service.js';
import { crearProveedorAlmacenamiento } from './providers/cloudinary/storage.factory.js';
import { crearProveedorCorreo } from './providers/email/email.factory.js';

export function crearServicios({
  repositorios,
  gestorTransacciones,
  proveedorCorreo,
  proveedorImagenes,
  registrador
}) {
  return Object.freeze({
    autenticacion: crearServicioAutenticacion({
      repositorioUsuarios: repositorios.usuarios,
      repositorioTokens: repositorios.tokensRestablecimiento,
      gestorTransacciones,
      proveedorCorreo,
      registrador
    }),
    usuarios: crearServicioUsuarios({
      repositorioUsuarios: repositorios.usuarios,
      gestorTransacciones
    }),
    negocio: crearServicioNegocio({ repositorioNegocio: repositorios.negocio }),
    categorias: crearServicioCategorias({ repositorioCategorias: repositorios.categorias }),
    cursos: crearServicioCursos({
      repositorioCursos: repositorios.cursos,
      repositorioCategorias: repositorios.categorias,
      proveedorImagenes,
      registrador
    }),
    consultas: crearServicioConsultas({
      repositorioConsultas: repositorios.consultas,
      repositorioCursos: repositorios.cursos,
      proveedorCorreo,
      registrador
    }),
    promociones: crearServicioPromociones({
      repositorioPromociones: repositorios.promociones,
      repositorioCursos: repositorios.cursos
    }),
    dashboard: crearServicioDashboard({ repositorioDashboard: repositorios.dashboard })
  });
}

export function crearComposicion({
  aplicacion = crearAplicacion(),
  configuracion = entorno,
  cicloVidaBaseDatos = baseDatos,
  registrador = registro,
  repositorios,
  gestorTransacciones,
  proveedorCorreo,
  proveedorImagenes,
  servicios
} = {}) {
  const correo =
    proveedorCorreo ??
    crearProveedorCorreo({
      configuracion: configuracion.proveedores?.correo ?? {},
      ambiente: configuracion.ambiente,
      registrador
    });
  const imagenes =
    proveedorImagenes ??
    crearProveedorAlmacenamiento({
      configuracion: configuracion.proveedores?.cloudinary ?? {},
      ambiente: configuracion.ambiente,
      registrador
    });

  const cliente = cicloVidaBaseDatos.cliente;
  const repositoriosResueltos = repositorios ?? (cliente ? crearRepositorios(cliente) : undefined);
  const gestorResuelto =
    gestorTransacciones ?? (cliente?.$transaction ? crearGestorTransacciones(cliente) : undefined);
  const serviciosResueltos =
    servicios ??
    (repositoriosResueltos && gestorResuelto
      ? crearServicios({
          repositorios: repositoriosResueltos,
          gestorTransacciones: gestorResuelto,
          proveedorCorreo: correo,
          proveedorImagenes: imagenes,
          registrador
        })
      : Object.freeze({}));

  return Object.freeze({
    aplicacion,
    configuracion,
    cicloVidaBaseDatos,
    registrador,
    repositorios: repositoriosResueltos,
    gestorTransacciones: gestorResuelto,
    proveedores: Object.freeze({ correo, imagenes }),
    servicios: serviciosResueltos
  });
}
