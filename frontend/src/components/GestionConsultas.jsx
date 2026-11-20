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
  const vida = useRef(null);
  const ocupado = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    vida.current = controller;
    academia.cargarTodasConsultasAdmin({ signal: controller.signal }).then(datos => {
      if (!controller.signal.aborted) setConsultas(datos);
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

  // Estado para controlar la ventana flotante (Modal) del mensaje
  const [mensajeActivo, setMensajeActivo] = useState(null);

  const handleMarcarLeido = (id) => ejecutar(
    opciones => academia.marcarConsultaLeidaAdmin(id, opciones),
    'Estado de la consulta actualizado.',
    resultado => setMensajeActivo(actual => actual?.id === id ? resultado : actual),
  );

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
      <div className="admin-table-scroll" role="region" aria-label="Lista de consultas" tabIndex={0} style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #333' }}>
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
                  style={{ 
                    borderBottom: '1px solid #222', 
                    backgroundColor: consulta.estado !== 'PENDIENTE' ? 'transparent' : 'rgba(16, 185, 129, 0.05)',
                    transition: 'background-color 0.2s' 
                  }} 
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} 
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = consulta.estado !== 'PENDIENTE' ? 'transparent' : 'rgba(16, 185, 129, 0.05)'}
                >
                  <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>{formatearFecha(consulta.creadaEn)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: consulta.estado !== 'PENDIENTE' ? 'normal' : 'bold', display: 'block' }}>
                      {consulta.nombre}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{consulta.correo}</span>
                  </td>
                  <td style={{ padding: '1rem', color: '#d1d5db', fontWeight: consulta.estado !== 'PENDIENTE' ? 'normal' : 'bold' }}>
                    {consulta.asunto}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {consulta.estado !== 'PENDIENTE' ? (
                      <span style={{ color: '#6b7280', fontSize: '0.85rem', border: '1px solid #4b5563', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>{consulta.estado === 'RESPONDIDA' ? 'Respondida' : 'Leído'}</span>
                    ) : (
                      <span style={{ color: 'var(--primary-green)', fontSize: '0.85rem', border: '1px solid var(--primary-green)', padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>Nuevo</span>
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

      {/* VENTANA MODAL PARA LEER EL MENSAJE COMPLETO */}
      {mensajeActivo && (
        <div className="admin-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="admin-message-panel" style={{
            backgroundColor: '#0a0a0a',
            borderRadius: '8px',
            border: '1px solid var(--primary-green)',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ color: 'var(--primary-green)', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem' }}>
              {mensajeActivo.asunto}
            </h3>
            
            <div className="admin-message-meta" style={{ borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-main)', fontWeight: 'bold', display: 'block' }}>{mensajeActivo.nombre}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{mensajeActivo.correo}</span>
              </div>
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{formatearFecha(mensajeActivo.creadaEn)}</span>
            </div>

            {error && <p role="alert">{error}</p>}
            {pendiente && <p role="status">Actualizando consulta...</p>}
            <p style={{ color: '#9ca3af' }}>Estado: {mensajeActivo.estado === 'RESPONDIDA' ? 'Respondida' : mensajeActivo.estado === 'LEIDA' ? 'Leído' : 'Nuevo'}</p>
            <div style={{ backgroundColor: '#111', padding: '1.5rem', borderRadius: '4px', border: '1px solid #333', color: '#d1d5db', minHeight: '120px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {mensajeActivo.mensaje}
            </div>
            
            <div className="admin-actions" style={{ marginTop: '2rem' }}>
              <button disabled={pendiente || !!error} onClick={() => handleEliminar(mensajeActivo.id)} style={btnEliminarStyle}>
                Eliminar Mensaje
              </button>
              <button onClick={cerrarModal} style={{ padding: '0.6rem 1.5rem', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatearFecha(valor) {
  const fecha = new Date(valor);
  return valor && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleDateString('es-AR') : 'Sin fecha';
}

const thStyle = {
  padding: '1rem',
  color: '#d1d5db',
  fontWeight: '600',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const btnAccionStyle = {
  padding: '0.4rem 0.8rem',
  backgroundColor: 'transparent',
  color: 'var(--primary-green)',
  border: '1px solid var(--primary-green)',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '0.5rem',
  fontSize: '0.85rem'
};

const btnEliminarStyle = {
  padding: '0.4rem 0.8rem',
  backgroundColor: 'transparent',
  color: '#ef4444',
  border: '1px solid #ef4444',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem'
};