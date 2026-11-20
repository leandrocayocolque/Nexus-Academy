import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSesion } from '../auth/SesionContext';
import { mutarYRecargar } from '../api/academia';

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
    if (ocupado.current) return;
    const controller = vida.current;
    toast('¿Eliminar mensaje?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: () => {
          if (controller !== vida.current || controller.signal.aborted) return;
          return ejecutar(
            opciones => academia.eliminarConsultaAdmin(id, opciones),
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

      {error && <p role="alert">{error} <button disabled={pendiente} onClick={recargar}>Actualizar lista</button></p>}
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
                    <button disabled={pendiente || cargando || !!error} style={btnEliminarStyle} onClick={() => handleEliminar(consulta.id)}>
                      Eliminar
                    </button>
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
          <div className="admin-message-panel">
            <h3 style={{ color: 'var(--primary-green)', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem' }}>
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cambiar el estado a Respondida solo organiza la bandeja; no envía ningún correo.</p>
            <div className="admin-message-body">
              {mensajeActivo.mensaje}
            </div>
            
            <div className="admin-actions" style={{ marginTop: '2rem' }}>
              <button disabled={pendiente || cargando || !!error} onClick={() => handleEliminar(mensajeActivo.id)} style={btnEliminarStyle}>
                Eliminar Mensaje
              </button>
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