import { cliente, ErrorApi } from './cliente.js';

// El catálogo conserva sus filtros múltiples y paginación locales, pero carga
// todas las páginas del servidor antes de mostrar resultados completos.
async function cargarPaginas(listar, { signal } = {}) {
  const datos = [];
  let pagina = 1;
  let paginasTotales;
  do {
    signal?.throwIfAborted();
    const resultado = await listar({ pagina, limite: 100 }, { signal });
    signal?.throwIfAborted();
    const paginacion = resultado?.paginacion;
    if (!Array.isArray(resultado?.datos) ||
        paginacion?.pagina !== pagina ||
        !Number.isInteger(paginacion?.paginasTotales) ||
        paginacion.paginasTotales < 0 ||
        (paginacion.paginasTotales === 0 && resultado.datos.length > 0)) {
      throw new ErrorApi('La respuesta paginada del servidor no es válida.', {
        code: 'RESPUESTA_INVALIDA',
      });
    }
    datos.push(...resultado.datos);
    paginasTotales = paginacion.paginasTotales;
    pagina++;
  } while (pagina <= paginasTotales);
  return datos;
}

// Ayuda de UX; el servidor sigue siendo la autoridad de validación.
export function validarConsulta(datos) {
  const errores = {};
  for (const [campo, minimo, maximo, etiqueta] of [
    ['nombre', 2, 150, 'El nombre'],
    ['asunto', 3, 200, 'El asunto'],
    ['mensaje', 10, 5000, 'El mensaje'],
  ]) {
    const valor = typeof datos[campo] === 'string' ? datos[campo].trim() : '';
    if (valor.length < minimo || valor.length > maximo) {
      errores[campo] = `${etiqueta} debe tener entre ${minimo} y ${maximo} caracteres.`;
    }
  }
  const correo = typeof datos.correo === 'string' ? datos.correo.trim() : '';
  if (correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    errores.correo = 'Ingresá un correo electrónico válido de hasta 254 caracteres.';
  }
  if (datos.telefono != null && (typeof datos.telefono !== 'string' || datos.telefono.trim().length > 50)) {
    errores.telefono = 'El teléfono no puede superar los 50 caracteres.';
  }
  if (datos.cursoId != null && (typeof datos.cursoId !== 'string' ||
      !datos.cursoId.trim() || datos.cursoId.trim().length > 100)) {
    errores.cursoId = 'El curso de la consulta no es válido.';
  }
  return errores;
}

// Solo el asunto generado se acota; los asuntos escritos se validan sin truncarlos.
export function asuntoConsultaCurso(titulo) {
  return `Consulta sobre el curso: ${titulo}`.slice(0, 200);
}

// Sin zona explícita, Intl usa la zona local del navegador, como datetime-local.
export function formatearFechaInicio(fecha, timeZone) {
  const instante = new Date(fecha);
  if (fecha == null || !Number.isFinite(instante.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeZone }).format(instante);
}

export function contextoConsulta(state) {
  return {
    asunto: typeof state?.asunto === 'string' ? state.asunto : '',
    ...(typeof state?.cursoId === 'string' ? { cursoId: state.cursoId } : {}),
  };
}

function prepararConsulta(datos) {
  const detalles = validarConsulta(datos);
  if (Object.keys(detalles).length) {
    throw new ErrorApi('Por favor, revisá los campos de la consulta.', {
      code: 'VALIDACION_CONSULTA', detalles,
    });
  }
  return {
    nombre: datos.nombre.trim(), correo: datos.correo.trim().toLowerCase(),
    asunto: datos.asunto.trim(), mensaje: datos.mensaje.trim(),
    ...(datos.telefono?.trim() ? { telefono: datos.telefono.trim() } : {}),
    ...(datos.cursoId?.trim() ? { cursoId: datos.cursoId.trim() } : {}),
  };
}

// Un fallo de recarga no convierte una escritura ya aceptada en una escritura fallida.
export async function mutarYRecargar(mutar, recargar) {
  const resultado = await mutar();
  try {
    return { resultado, datos: await recargar(), errorActualizacion: null };
  } catch (errorActualizacion) {
    return { resultado, datos: null, errorActualizacion };
  }
}

function camposCategoria(datos) {
  return Object.fromEntries(['nombre', 'descripcion', 'activa']
    .filter(campo => datos[campo] !== undefined)
    .map(campo => [campo, datos[campo]]));
}

function prepararNegocio(datos) {
  const detalles = {};

  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (nombre.length < 1 || nombre.length > 150) {
    detalles.nombre = 'El nombre debe tener entre 1 y 150 caracteres.';
  }

  const textoOpcional = (campo, max, etiqueta) => {
    if (datos[campo] == null) return null;
    const valor = String(datos[campo]).trim();
    if (!valor) return null;
    if (valor.length > max) {
      detalles[campo] = `${etiqueta} no puede superar ${max} caracteres.`;
    }
    return valor;
  };

  const descripcion = textoOpcional('descripcion', 2000, 'La descripción');
  const direccion = textoOpcional('direccion', 300, 'La dirección');
  const telefono = textoOpcional('telefono', 50, 'El teléfono');

  let correo = null;
  if (datos.correo != null && String(datos.correo).trim() !== '') {
    correo = String(datos.correo).trim().toLowerCase();
    if (correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      detalles.correo = 'Ingresá un correo electrónico válido.';
    }
  }

  let enlacesSociales = null;
  if (datos.enlacesSociales && typeof datos.enlacesSociales === 'object') {
    const entradas = Object.entries(datos.enlacesSociales);
    if (entradas.length > 20) {
      detalles.enlacesSociales = 'No se permiten más de 20 enlaces sociales.';
    } else if (entradas.length > 0) {
      enlacesSociales = {};
      for (const [red, url] of entradas) {
        try {
          new URL(url);
          enlacesSociales[red.trim()] = url.trim();
        } catch {
          detalles.enlacesSociales = `La URL de "${red}" no es válida (debe incluir http:// o https://).`;
          break;
        }
      }
    }
  }

  let horariosAtencion = null;
  if (datos.horariosAtencion && typeof datos.horariosAtencion === 'object') {
    const entradas = Object.entries(datos.horariosAtencion);
    if (entradas.length > 20) {
      detalles.horariosAtencion = 'No se permiten más de 20 horarios.';
    } else if (entradas.length > 0) {
      horariosAtencion = {};
      for (const [dia, franja] of entradas) {
        const val = String(franja).trim();
        if (val.length < 1 || val.length > 100) {
          detalles.horariosAtencion = `El horario de "${dia}" debe tener entre 1 y 100 caracteres.`;
          break;
        }
        horariosAtencion[dia.trim()] = val;
      }
    }
  }

  if (Object.keys(detalles).length) {
    throw new ErrorApi('Revisá los datos del comercio.', {
      code: 'VALIDACION_NEGOCIO',
      detalles,
    });
  }

  return {
    nombre,
    descripcion,
    direccion,
    telefono,
    correo,
    enlacesSociales,
    horariosAtencion,
  };
}

export function crearApiAcademia(solicitar = cliente) {
  const listarCursosAdmin = (query = {}, { signal } = {}) =>
    solicitar('/admin/cursos', { signal, query });
  const listarCursos = (query = {}, { signal } = {}) =>
    solicitar('/cursos', { signal, query });
  const listarCategorias = (query = {}, { signal } = {}) =>
    solicitar('/categorias', { signal, query });

  const listarCategoriasAdmin = (query = {}, { signal } = {}) =>
    solicitar('/admin/categorias', { signal, query });
  const listarConsultasAdmin = (query = {}, { signal } = {}) =>
    solicitar('/admin/consultas', { signal, query });
  const obtenerConsultaAdmin = async (id, { signal } = {}) => {
    const consulta = await solicitar(`/admin/consultas/${encodeURIComponent(id)}`, { signal });
    if (!['PENDIENTE', 'LEIDA', 'RESPONDIDA'].includes(consulta?.estado)) {
      throw new ErrorApi('La respuesta de la consulta no es válida.', { code: 'RESPUESTA_INVALIDA' });
    }
    return consulta;
  };

  return Object.freeze({
    obtenerResumenAdmin: async ({ signal } = {}) => {
      const respuesta = await solicitar('/admin/dashboard', { signal });
      const resumen = respuesta?.resumen;
      if (!['cursosActivos', 'categoriasActivas', 'consultasPendientes']
        .every(campo => Number.isInteger(resumen?.[campo]) && resumen[campo] >= 0)) {
        throw new ErrorApi('La respuesta del resumen no es válida.', { code: 'RESPUESTA_INVALIDA' });
      }
      return resumen;
    },
    listarCursosAdmin,
    cargarTodosCursosAdmin: (options) => cargarPaginas(listarCursosAdmin, options),
    crearCursoAdmin: (datos, { signal } = {}) =>
      solicitar('/admin/cursos', { method: 'POST', body: prepararCurso(datos), signal }),
    actualizarCursoAdmin: (id, datos, { signal } = {}) =>
      solicitar(`/admin/cursos/${encodeURIComponent(id)}`, {
        method: 'PATCH', body: prepararCurso(datos), signal,
      }),
    eliminarCursoAdmin: (id, { signal } = {}) =>
      solicitar(`/admin/cursos/${encodeURIComponent(id)}`, { method: 'DELETE', signal }),
    subirImagenCursoAdmin: (id, archivo, { signal } = {}) => {
      validarImagenCurso(archivo);
      const body = new FormData();
      body.append('imagenes', archivo);
      return solicitar(`/admin/cursos/${encodeURIComponent(id)}/imagenes`, { method: 'POST', body, signal });
    },
    listarCategoriasAdmin,
    listarConsultasAdmin,
    cargarTodasCategoriasAdmin: (options) => cargarPaginas(listarCategoriasAdmin, options),
    cargarTodasConsultasAdmin: (options) => cargarPaginas(listarConsultasAdmin, options),
    crearCategoriaAdmin: (datos, { signal } = {}) =>
      solicitar('/admin/categorias', { method: 'POST', body: camposCategoria(datos), signal }),
    actualizarCategoriaAdmin: (id, datos, { signal } = {}) =>
      solicitar(`/admin/categorias/${encodeURIComponent(id)}`, {
        method: 'PATCH', body: camposCategoria(datos), signal,
      }),
    eliminarCategoriaAdmin: (id, { signal } = {}) =>
      solicitar(`/admin/categorias/${encodeURIComponent(id)}`, { method: 'DELETE', signal }),
    obtenerConsultaAdmin,
    marcarConsultaLeidaAdmin: async (id, { signal } = {}) => {
      // Volver a consultar evita degradar una respuesta ya visible en el servidor.
      const actual = await obtenerConsultaAdmin(id, { signal });
      signal?.throwIfAborted();
      if (actual.estado !== 'PENDIENTE') return actual;
      const actualizada = await solicitar(`/admin/consultas/${encodeURIComponent(id)}/estado`, {
        method: 'PATCH', body: { estado: 'LEIDA' }, signal,
      });
      if (actualizada?.estado !== 'LEIDA') {
        throw new ErrorApi('La respuesta del cambio de estado no es válida.', { code: 'RESPUESTA_INVALIDA' });
      }
      return actualizada;
    },
    eliminarConsultaAdmin: (id, { signal } = {}) =>
      solicitar(`/admin/consultas/${encodeURIComponent(id)}`, { method: 'DELETE', signal }),
    obtenerNegocio: ({ signal } = {}) =>
      solicitar('/academia', { signal }),
    actualizarNegocioAdmin: (datos, { signal } = {}) =>
      solicitar('/admin/academia', {
        method: 'PUT',
        body: prepararNegocio(datos),
        signal,
      }),
    listarCursos,
    listarCategorias,
    crearConsulta: async (datos) =>
      solicitar('/consultas', { method: 'POST', body: prepararConsulta(datos) }),
    obtenerCurso: (id, { signal } = {}) =>
      solicitar(`/cursos/${encodeURIComponent(id)}`, { signal }),
    cargarTodosCursos: (options) => cargarPaginas(listarCursos, options),
    cargarTodasCategorias: (options) => cargarPaginas(listarCategorias, options),
  });
}

// datetime-local representa hora local, no UTC. Se conservan segundos y milisegundos.
function fechaLocal(fecha) {
  const d = new Date(fecha);
  if (fecha == null || !Number.isFinite(d.getTime())) return '';
  const pad = (n, longitud = 2) => String(n).padStart(longitud, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

export function formularioCurso(curso = {}) {
  return {
    id: curso.id ?? null, categoriaId: curso.categoriaId ?? '', titulo: curso.titulo ?? '',
    duracion: curso.duracion ?? '', cuposDisponibles: String(curso.cuposDisponibles ?? ''),
    fechaInicio: fechaLocal(curso.fechaInicio), precio: String(curso.precio ?? ''),
    nivel: curso.nivel ?? '', modalidad: curso.modalidad ?? '', descripcion: curso.descripcion ?? '',
    activo: curso.activo ?? true, destacado: curso.destacado ?? false, imagenes: curso.imagenes ?? [],
  };
}

export function prepararCurso(datos) {
  const detalles = {};
  const texto = (campo, min, max) => {
    const valor = typeof datos[campo] === 'string' ? datos[campo].trim() : '';
    if (valor.length < min || valor.length > max) detalles[campo] = `Debe tener entre ${min} y ${max} caracteres.`;
    return valor;
  };
  const categoriaId = texto('categoriaId', 1, 100);
  const titulo = texto('titulo', 3, 180);
  const duracion = texto('duracion', 1, 100);
  const precio = String(datos.precio ?? '').trim();
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(precio)) detalles.precio = 'Usá hasta 8 enteros y 2 decimales, sin moneda.';
  const cupos = String(datos.cuposDisponibles ?? '').trim();
  if (!/^\d+$/.test(cupos) || Number(cupos) > 1000000) detalles.cuposDisponibles = 'Ingresá un entero entre 0 y 1000000.';
  const fecha = String(datos.fechaInicio ?? '');
  const partesFecha = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(fecha);
  const fechaNormalizada = partesFecha ? `${partesFecha[1]}:${partesFecha[2] ?? '00'}.${(partesFecha[3] ?? '').padEnd(3, '0')}` : '';
  if (!partesFecha || fechaLocal(fechaNormalizada) !== fechaNormalizada) {
    detalles.fechaInicio = 'Ingresá una fecha y hora local válidas.';
  }
  if (!Object.hasOwn(nivelesCurso, datos.nivel)) detalles.nivel = 'Seleccioná un nivel válido.';
  if (!Object.hasOwn(modalidadesCurso, datos.modalidad)) detalles.modalidad = 'Seleccioná una modalidad válida.';
  const descripcion = datos.descripcion == null ? null : String(datos.descripcion).trim() || null;
  if (descripcion?.length > 5000) detalles.descripcion = 'Máximo 5000 caracteres.';
  for (const campo of ['activo', 'destacado']) {
    if (typeof datos[campo] !== 'boolean') detalles[campo] = 'Debe ser un valor booleano.';
  }
  if (Object.keys(detalles).length) throw new ErrorApi('Revisá los campos del curso.', { detalles });
  return { categoriaId, titulo, duracion, cuposDisponibles: Number(cupos),
    fechaInicio: new Date(fecha).toISOString(), precio, nivel: datos.nivel, modalidad: datos.modalidad,
    descripcion, activo: datos.activo, destacado: datos.destacado };
}

export function validarImagenCurso(archivo) {
  if (!(archivo instanceof Blob) || !['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
    throw new ErrorApi('Seleccioná un archivo JPEG, PNG o WebP.');
  }
  if (!archivo.size || archivo.size > 5 * 1024 * 1024) throw new ErrorApi('La imagen debe pesar entre 1 byte y 5 MiB.');
}

// La aceptación se notifica ANTES del upload. Un retry usa guardado y nunca
// vuelve a aplicar el formulario anterior, ni siquiera en edición.
export async function guardarCursoConImagen(api, { id, datos, archivo, guardado, onGuardado, signal }) {
  signal?.throwIfAborted();
  if (archivo) validarImagenCurso(archivo);
  if (!guardado) {
    guardado = await (id ? api.actualizarCursoAdmin(id, datos, { signal }) : api.crearCursoAdmin(datos, { signal }));
    if (typeof guardado?.id !== 'string' || !guardado.id) {
      throw new ErrorApi('El servidor no devolvió el ID guardado. Verificá la lista antes de reintentar.', { code: 'RESPUESTA_INVALIDA' });
    }
    onGuardado?.(guardado);
  }
  signal?.throwIfAborted();
  try {
    if (archivo) await api.subirImagenCursoAdmin(guardado.id, archivo, { signal });
    return { guardado, errorImagen: null };
  } catch (errorImagen) {
    signal?.throwIfAborted();
    return { guardado, errorImagen };
  }
}

export const academia = crearApiAcademia();

export const nivelesCurso = Object.freeze({
  PRINCIPIANTE: 'Principiante', INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado', TODOS_LOS_NIVELES: 'Todos los niveles',
});
export const modalidadesCurso = Object.freeze({
  EN_LINEA: 'En línea', PRESENCIAL: 'Presencial', HIBRIDA: 'Híbrida',
});
