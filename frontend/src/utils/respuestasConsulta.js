// Solo vive en memoria: no persistir texto ni destinatarios en almacenamiento web.
export function crearBorrador(mensaje = '') {
  return { mensaje, claveIdempotencia: globalThis.crypto.randomUUID(), bloqueado: false, estado: null };
}

// Los snapshots no se mutan: React puede suscribirse sin copiar datos en efectos.
// El almacén pertenece al panel, no al modal; un POST continúa al cerrar el modal.
export function crearAlmacenRespuestas() {
  const entradas = new Map();
  const revisiones = new Map();
  const escuchas = new Map();
  const actualizar = (id, cambios) => {
    entradas.set(id, { ...entradas.get(id), ...cambios });
    escuchas.get(id)?.forEach(escucha => escucha());
  };
  return {
    abrir(id) {
      if (!entradas.has(id)) actualizar(id, {
        borrador: crearBorrador(), respuestas: [], pendiente: false,
        aviso: '', destinatario: '',
      });
      actualizar(id, { cargando: true, error: '' });
    },
    obtener: id => entradas.get(id),
    actualizar,
    suscribir(id, escucha) {
      if (!escuchas.has(id)) escuchas.set(id, new Set());
      escuchas.get(id).add(escucha);
      return () => escuchas.get(id).delete(escucha);
    },
    nuevaRevision(id) {
      const revision = (revisiones.get(id) ?? 0) + 1;
      revisiones.set(id, revision);
      return revision;
    },
    esActual: (id, revision) => revisiones.get(id) === revision,
  };
}

export function editarBorrador(borrador, mensaje) {
  return borrador.bloqueado ? borrador : { ...borrador, mensaje, estado: null };
}

export function iniciarIntento(borrador) {
  return { ...borrador, bloqueado: true };
}

export function confirmarIntento(borrador, respuesta) {
  if (respuesta.estado === 'ACEPTADA') return { ...crearBorrador(), estado: 'ACEPTADA' };
  return { ...borrador, bloqueado: true, estado: respuesta.estado };
}

export function nuevoIntento(borrador) {
  return borrador.estado === 'FALLIDA' ? crearBorrador(borrador.mensaje) : borrador;
}

export function validarMensaje(mensaje) {
  if (!mensaje.trim() || mensaje.trim().length > 5000) return 'Ingresá un mensaje de entre 1 y 5000 caracteres.';
  if (Array.from(mensaje).some(c => (c.codePointAt(0) < 32 && ![9, 10, 13].includes(c.codePointAt(0))) || c.codePointAt(0) === 127)) {
    return 'Revisá el mensaje: hay caracteres no permitidos.';
  }
  return '';
}

export function errorRespuesta(codigo) {
  const errores = {
    SMTP_RECHAZADO: 'No se pudo enviar.',
    SMTP_NO_ACEPTADO: 'No se pudo enviar.',
    CORREO_NO_DISPONIBLE: 'No se pudo enviar.',
    CORREO_SIMULADO: 'No se pudo enviar.',
  };
  return Object.hasOwn(errores, codigo) ? errores[codigo] : 'No pudimos confirmar el envío.';
}

export const estadosRespuesta = {
  ENVIANDO: 'Enviando', ACEPTADA: 'Respuesta enviada',
  FALLIDA: 'No se pudo enviar', INCIERTA: 'Envío sin confirmar',
};
