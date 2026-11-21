import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { useSesion } from '../auth/SesionContext';
import { mutarYRecargar } from '../api/academia';
import { crearAlmacenRespuestas, editarBorrador, iniciarIntento, confirmarIntento, nuevoIntento, validarMensaje } from '../utils/respuestasConsulta';

export default function GestionConsultas() {
  const { academia } = useSesion();
  const [consultas, setConsultas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const [mensajeActivo, setMensajeActivo] = useState(null);
  const vida = useRef(null);
  const ocupado = useRef(false);
  const [borradores] = useState(crearAlmacenRespuestas);
  const panel = useRef(null);
  const [conHistorial, setConHistorial] = useState({});
  const registrarHistorial = useCallback((id) => setConHistorial(actual => ({ ...actual, [id]: true })), []);
  const registrarAceptacion = useCallback((id) => {
    if (vida.current?.signal.aborted) return;
    setConsultas(actual => actual.map(c => c.id === id ? { ...c, estado: 'RESPONDIDA' } : c));
    setMensajeActivo(actual => actual?.id === id ? { ...actual, estado: 'RESPONDIDA' } : actual);
  }, []);

  useEffect(() => {
    if (!mensajeActivo?.id) return;
    const anterior = document.activeElement;
    panel.current?.focus();
    return () => { if (anterior?.isConnected) anterior.focus(); };
  }, [mensajeActivo?.id]);

  useEffect(() => {
    const controller = new AbortController();
    vida.current = controller;
    academia.cargarTodasConsultasAdmin({ signal: controller.signal }).then(datos => {
      if (!controller.signal.aborted) {
        setConsultas(datos);
        setMensajeActivo(actual => actual ? datos.find(c => c.id === actual.id) ?? null : null);
      }
    }).catch(fallo => {
      if (!controller.signal.aborted) setError(`No se pudieron cargar las consultas. ${fallo.message}`);
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });
    return () => controller.abort();
  }, [academia, intento]);

  const recargar = () => {
    setError('');
    setCargando(true);
    setIntento(i => i + 1);
  };

  const ejecutar = async (mutar, mensaje, alConfirmar) => {
    const controller = vida.current;
    if (ocupado.current || !controller || controller.signal.aborted) return;
    ocupado.current = true;
    setPendiente(true);
    setError('');
    try {
      const { resultado, datos, errorActualizacion } = await mutarYRecargar(
        () => mutar({ signal: controller.signal }),
        () => academia.cargarTodasConsultasAdmin({ signal: controller.signal }),
      );
      if (controller.signal.aborted) return;
      alConfirmar?.(resultado);
      if (errorActualizacion) {
        setError(`El cambio se confirmó, pero no se pudo actualizar la lista. ${errorActualizacion.message}`);
        toast.warning('El cambio se confirmó. Actualizá la lista antes de continuar.');
      } else {
        setConsultas(datos);
        // El modal también refleja el estado más reciente confirmado por la lista.
        setMensajeActivo(actual => actual ? datos.find(c => c.id === actual.id) ?? null : null);
        toast.success(mensaje);
      }
    } catch (fallo) {
      if (!controller.signal.aborted) {
        setError(fallo.message);
        toast.error(fallo.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        ocupado.current = false;
        setPendiente(false);
      }
    }
  };

  const handleMarcarLeido = (id) => ejecutar(
    opciones => academia.marcarConsultaLeidaAdmin(id, opciones),
    'Estado de la consulta actualizado.',
    resultado => setMensajeActivo(actual => actual?.id === id ? resultado : actual),
  );

  // Solo abrir el mensaje dispara lectura automática, nunca cambiar su estado.
  const handleEstado = (estado) => {
    if (!mensajeActivo || pendiente || cargando || error) return;
    const id = mensajeActivo.id;
    return ejecutar(
      opciones => academia.actualizarEstadoConsultaAdmin(id, estado, opciones),
      'Estado de la consulta actualizado.',
      resultado => setMensajeActivo(actual => actual?.id === id ? { ...actual, ...resultado } : actual),
    );
  };

  const handleEliminar = (id) => {
    if (ocupado.current || conHistorial[id] || borradores.obtener(id)?.borrador.bloqueado) return;
    const controller = vida.current;
    toast('¿Eliminar mensaje?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: () => {
          if (controller !== vida.current || controller.signal.aborted) return;
          return ejecutar(
            async opciones => {
              const detalle = await academia.obtenerConsultaAdmin(id, opciones);
              if (detalle.respuestas?.length) {
                registrarHistorial(id);
                throw new Error('No se pudo eliminar la consulta.');
              }
              return academia.eliminarConsultaAdmin(id, opciones);
            },
            'Mensaje eliminado.',
            () => setMensajeActivo(actual => actual?.id === id ? null : actual),
          );
        }
      },
      cancel: { label: 'Cancelar' }
    });
  };

  const handleVerMensaje = (consulta) => {
    if (ocupado.current) return;
    borradores.abrir(consulta.id);
    setMensajeActivo(consulta);
    if (consulta.estado === 'PENDIENTE') {
      handleMarcarLeido(consulta.id);
    }
  };

  const cerrarModal = () => {
    setMensajeActivo(null);
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>Bandeja de Consultas</h2>
        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Administrá los mensajes recibidos desde el formulario de contacto público.</p>
      </header>

      {error && !mensajeActivo && <p role="alert">{error} <button disabled={pendiente} onClick={recargar}>Actualizar lista</button></p>}
      {cargando && <p role="status">Cargando consultas...</p>}
      {pendiente && <p role="status">Actualizando consulta...</p>}
      {/* TABLA PRINCIPAL DE CONSULTAS */}
      <div className="admin-table-scroll" role="region" aria-label="Lista de consultas" tabIndex={0}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ ...thStyle, width: '120px' }}>Fecha</th>
              <th style={thStyle}>Remitente</th>
              <th style={thStyle}>Asunto</th>
              <th style={{ ...thStyle, width: '100px', textAlign: 'center' }}>Estado</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {consultas.length > 0 ? (
              consultas.map((consulta) => (
                <tr 
                  key={consulta.id} 
                  className={consulta.estado === 'PENDIENTE' ? 'admin-row-unread' : undefined}
                >
                  <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>{formatearFecha(consulta.creadaEn)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: consulta.estado !== 'PENDIENTE' ? 'normal' : 'bold', display: 'block' }}>
                      {consulta.nombre}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{consulta.correo}</span>
                  </td>
                  <td style={{ padding: '1rem', color: '#d1d5db', fontWeight: consulta.estado !== 'PENDIENTE' ? 'normal' : 'bold' }}>
                    {consulta.asunto}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {consulta.estado !== 'PENDIENTE' ? (
                      <span className="admin-status-badge">{consulta.estado === 'RESPONDIDA' ? 'Respondida' : 'Leída'}</span>
                    ) : (
                      <span className="admin-status-badge admin-status-new">Pendiente</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button disabled={pendiente || cargando || !!error} style={btnAccionStyle} onClick={() => handleVerMensaje(consulta)}>
                      Leer
                    </button>
                    {!conHistorial[consulta.id] && <button disabled={pendiente || cargando || !!error} style={btnEliminarStyle} onClick={() => handleEliminar(consulta.id)}>
                      Eliminar
                    </button>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  {cargando ? 'Cargando consultas...' : error ? 'No se pudo confirmar la bandeja de consultas.' : 'No hay consultas en la bandeja.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mensajeActivo && (
        <div className="admin-modal-overlay">
          <div className="admin-message-panel" role="dialog" aria-modal="true" aria-labelledby="consulta-asunto" tabIndex={-1} ref={panel} onKeyDown={evento => {
            if (evento.key === 'Escape') cerrarModal();
            if (evento.key !== 'Tab') return;
            const controles = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')];
            const primero = controles[0];
            const ultimo = controles.at(-1);
            if (evento.shiftKey && (document.activeElement === primero || document.activeElement === panel.current)) {
              evento.preventDefault(); ultimo?.focus();
            } else if (!evento.shiftKey && document.activeElement === ultimo) {
              evento.preventDefault(); primero?.focus();
            }
          }}>
            <h3 id="consulta-asunto" style={{ color: 'var(--primary-green)', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem' }}>
              {mensajeActivo.asunto}
            </h3>
            
            <div className="admin-message-meta" style={{ borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-main)', fontWeight: 'bold', display: 'block' }}>{mensajeActivo.nombre}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{mensajeActivo.correo}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatearFecha(mensajeActivo.creadaEn)}</span>
            </div>

            {error && <p role="alert">{error} <button disabled={pendiente || cargando} onClick={recargar}>Actualizar lista</button></p>}
            {pendiente && <p role="status">Actualizando consulta...</p>}
            <p style={{ color: '#9ca3af' }}>Estado: {mensajeActivo.estado === 'RESPONDIDA' ? 'Respondida' : mensajeActivo.estado === 'LEIDA' ? 'Leída' : 'Pendiente'}</p>
            <div className="admin-actions" role="group" aria-label="Cambiar estado de la consulta">
              {Object.entries(estadosConsulta).map(([estado, etiqueta]) => (
                <button
                  key={estado}
                  className="admin-button-primary"
                  aria-pressed={mensajeActivo.estado === estado}
                  disabled={pendiente || cargando || !!error || mensajeActivo.estado === estado}
                  onClick={() => handleEstado(estado)}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            <div className="admin-message-body">
              {mensajeActivo.mensaje}
            </div>
            
            <RespuestasConsulta key={mensajeActivo.id} consulta={mensajeActivo} academia={academia} almacen={borradores} registrarHistorial={registrarHistorial} registrarAceptacion={registrarAceptacion} bloqueada={pendiente} />
            <div className="admin-actions" style={{ marginTop: '2rem' }}>
              {!conHistorial[mensajeActivo.id] && <button disabled={pendiente || cargando || !!error} onClick={() => handleEliminar(mensajeActivo.id)} style={btnEliminarStyle}>
                Eliminar Mensaje
              </button>}
              <button onClick={cerrarModal} className="admin-button-primary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RespuestasConsulta({ consulta, academia, almacen, registrarHistorial, registrarAceptacion, bloqueada }) {
  const { id } = consulta;
  const suscribir = useCallback(escucha => almacen.suscribir(id, escucha), [almacen, id]);
  const obtener = useCallback(() => almacen.obtener(id), [almacen, id]);
  const vista = useSyncExternalStore(suscribir, obtener);
  const vivo = useRef(false);
  const actualizar = cambios => almacen.actualizar(id, cambios);

  useEffect(() => {
    vivo.current = true;
    const controller = new AbortController();
    const revision = almacen.nuevaRevision(id);
    academia.obtenerConsultaAdmin(id, { signal: controller.signal }).then(detalle => {
      if (controller.signal.aborted || !almacen.esActual(id, revision)) return;
      const cache = almacen.obtener(id);
      if (!Array.isArray(detalle.respuestas)) throw new Error('Historial no disponible');
      const cambios = { respuestas: detalle.respuestas, destinatario: detalle.correo, cargando: false };
      // Una visita nueva tampoco debe reemplazar un intento incierto persistido.
      const sinResolver = detalle.respuestas.findLast(r => ['ENVIANDO', 'INCIERTA'].includes(r.estado));
      const confirmado = detalle.respuestas.find(r => r.claveIdempotencia === cache.borrador.claveIdempotencia);
      if (confirmado && cache.borrador.bloqueado && !cache.pendiente) {
        cambios.borrador = confirmarIntento(cache.borrador, confirmado);
        cambios.aviso = 'Consulta respondida correctamente';
        if (confirmado.estado === 'ACEPTADA') registrarAceptacion(id);
      }
      if (sinResolver && !cache.pendiente) cambios.borrador = {
        mensaje: sinResolver.mensaje, claveIdempotencia: sinResolver.claveIdempotencia,
        bloqueado: true, estado: sinResolver.estado,
      };
      if (detalle.respuestas.length) registrarHistorial(id);
      almacen.actualizar(id, cambios);
    }).catch(() => {
      if (!controller.signal.aborted && almacen.esActual(id, revision)) {
        almacen.actualizar(id, { cargando: false, error: 'No se pudo cargar el historial. Cerrá y volvé a abrir la consulta para actualizarlo.' });
      }
    });
    return () => {
      vivo.current = false;
      controller.abort();
    };
  }, [academia, id, almacen, registrarHistorial, registrarAceptacion]);

  const enviar = async evento => {
    evento.preventDefault();
    const cache = almacen.obtener(id);
    if (bloqueada || cache.pendiente || cache.cargando || !cache.destinatario || cache.error) return;
    const borrador = cache.borrador;
    const invalidacion = validarMensaje(borrador.mensaje);
    if (invalidacion) { actualizar({ aviso: invalidacion }); return; }
    almacen.nuevaRevision(id);
    actualizar({ borrador: iniciarIntento(borrador), pendiente: true, aviso: '' });
    registrarHistorial(id); // Desde ahora borrar podría competir con la reserva del envío.
    try {
      const { respuesta } = await academia.responderConsultaAdmin(id, borrador);
      const revision = almacen.nuevaRevision(id);
      actualizar({
        cargando: false,
        borrador: confirmarIntento(borrador, respuesta),
        respuestas: [...almacen.obtener(id).respuestas.filter(r => r.id !== respuesta.id), respuesta],
        aviso: 'Consulta respondida correctamente',
      });
      if (respuesta.estado === 'ACEPTADA') registrarAceptacion(id);
      if (vivo.current) toast.success('Consulta respondida correctamente');
      // La aceptación ya se refleja antes de intentar actualizar: nunca se deshace.
      try {
        const detalle = await academia.obtenerConsultaAdmin(id);
        if (!Array.isArray(detalle.respuestas)) throw new Error('Historial no disponible');
        if (almacen.esActual(id, revision)) actualizar({ respuestas: detalle.respuestas });
      } catch {
        // El registro confirmado se conserva aunque falle la actualización del historial.
      }
    } catch {
      actualizar({ aviso: 'No se pudo guardar la respuesta.' });
    } finally {
      actualizar({ pendiente: false, cargando: false });
    }
  };

  const { borrador, respuestas } = vista;
  return (
    <section className="admin-inquiry-replies" aria-labelledby="respuestas-titulo" aria-busy={vista.pendiente || vista.cargando}>
      <h4 id="respuestas-titulo">Responder consulta</h4>
      {vista.cargando && <p role="status">Cargando historial...</p>}
      {vista.error && <p role="alert">{vista.error}</p>}
      <ol className="admin-reply-history" aria-label="Historial de respuestas">
        {respuestas.map(respuesta => (
          <li key={respuesta.id}>
            <strong>Respuesta registrada</strong>
            <p><time dateTime={respuesta.creadaEn}>{fechaRespuesta(respuesta.creadaEn)}</time></p>
            <div className="admin-reply-body">{respuesta.mensaje}</div>
          </li>
        ))}
      </ol>
      {!vista.cargando && !vista.error && !respuestas.length && <p>Sin respuestas registradas.</p>}
      <form onSubmit={enviar} className="admin-reply-form">
        <label htmlFor="respuesta-destinatario">Destinatario</label>
        <input id="respuesta-destinatario" value={vista.destinatario} readOnly />
        <label htmlFor="respuesta-mensaje">Respuesta</label>
        <textarea id="respuesta-mensaje" rows={6} maxLength={5000} value={borrador.mensaje}
          readOnly={borrador.bloqueado} disabled={bloqueada || vista.cargando || vista.pendiente || !!vista.error}
          aria-describedby="respuesta-contador"
          onChange={evento => actualizar({ borrador: editarBorrador(almacen.obtener(id).borrador, evento.target.value), aviso: '' })} />
        <span id="respuesta-contador">{borrador.mensaje.length}/5000 caracteres</span>
        {vista.aviso && <p role="status" className={vista.aviso === 'Consulta respondida correctamente' ? 'admin-success' : undefined}>{vista.aviso}</p>}
        <div className="admin-actions">
          {borrador.estado === 'FALLIDA' && <button type="button" disabled={vista.pendiente || vista.cargando}
            onClick={() => actualizar({ borrador: nuevoIntento(almacen.obtener(id).borrador), aviso: '' })}>Editar respuesta</button>}
          <button type="submit" className="admin-button-primary"
            disabled={bloqueada || vista.pendiente || vista.cargando || !!vista.error || !!validarMensaje(borrador.mensaje)}>
            {vista.pendiente ? 'Consultando respuesta...' : borrador.bloqueado ? 'Consultar respuesta' : 'Responder consulta'}
          </button>
        </div>
      </form>
    </section>
  );
}

function fechaRespuesta(valor) {
  const fecha = new Date(valor);
  return valor && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleString('es-AR') : 'Sin fecha';
}

const estadosConsulta = { PENDIENTE: 'Pendiente', LEIDA: 'Leída', RESPONDIDA: 'Respondida' };

function formatearFecha(valor) {
  const fecha = new Date(valor);
  return valor && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleDateString('es-AR') : 'Sin fecha';
}

const thStyle = {
  padding: '1rem',
  color: 'var(--text-secondary)',
  fontWeight: '600',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const btnAccionStyle = {
  padding: '0.6rem 0.9rem',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-control)',
  borderRadius: 'var(--radius-control)',
  cursor: 'pointer',
  marginRight: '0.5rem',
  fontSize: '0.85rem'
};

const btnEliminarStyle = {
  padding: '0.6rem 0.9rem',
  backgroundColor: 'var(--status-error-bg)',
  color: 'var(--status-error)',
  border: '1px solid #a14b50',
  borderRadius: 'var(--radius-control)',
  cursor: 'pointer',
  fontSize: '0.85rem'
};