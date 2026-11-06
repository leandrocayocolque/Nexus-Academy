import React, { useState } from 'react';
import { toast } from 'sonner';

export default function GestionConsultas() {
  const [consultas, setConsultas] = useState([
    { 
      id: 1, 
      nombre: 'Juan Pérez', 
      correo: 'juan@example.com', 
      asunto: 'Consulta sobre el curso: Data Mindset', 
      mensaje: 'Quería saber si el curso requiere conocimientos previos de programación.', 
      fecha: '01/11/2026', 
      leido: false 
    },
    { 
      id: 2, 
      nombre: 'María Gómez', 
      correo: 'maria@empresa.com', 
      asunto: 'Capacitación para empresas', 
      mensaje: 'Necesitamos capacitar a un equipo de 10 personas en Liderazgo Ágil.', 
      fecha: '30/10/2026', 
      leido: true 
    }
  ]);

  // Estado para controlar la ventana flotante (Modal) del mensaje
  const [mensajeActivo, setMensajeActivo] = useState(null);

  const handleMarcarLeido = (id) => {
    setConsultas(consultas.map(consulta => 
      consulta.id === id ? { ...consulta, leido: true } : consulta
    ));
    toast.success('Consulta marcada como leída.');
  };

  const handleEliminar = (id) => {
    toast('¿Eliminar mensaje?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: () => {
          setConsultas(consultas.filter((c) => c.id !== id));
          toast.success('Mensaje eliminado.');
          if (mensajeActivo && mensajeActivo.id === id) {
            setMensajeActivo(null);
          }
        }
      },
      cancel: { label: 'Cancelar' }
    });
  };

  const handleVerMensaje = (consulta) => {
    setMensajeActivo(consulta);
    if (!consulta.leido) {
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

      {/* TABLA PRINCIPAL DE CONSULTAS */}
      <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #333', overflowX: 'auto' }}>
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
                    backgroundColor: consulta.leido ? 'transparent' : 'rgba(16, 185, 129, 0.05)',
                    transition: 'background-color 0.2s' 
                  }} 
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} 
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = consulta.leido ? 'transparent' : 'rgba(16, 185, 129, 0.05)'}
                >
                  <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>{consulta.fecha}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: consulta.leido ? 'normal' : 'bold', display: 'block' }}>
                      {consulta.nombre}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{consulta.correo}</span>
                  </td>
                  <td style={{ padding: '1rem', color: '#d1d5db', fontWeight: consulta.leido ? 'normal' : 'bold' }}>
                    {consulta.asunto}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {consulta.leido ? (
                      <span style={{ color: '#6b7280', fontSize: '0.85rem', border: '1px solid #4b5563', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>Leído</span>
                    ) : (
                      <span style={{ color: 'var(--primary-green)', fontSize: '0.85rem', border: '1px solid var(--primary-green)', padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>Nuevo</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button style={btnAccionStyle} onClick={() => handleVerMensaje(consulta)}>
                      Leer
                    </button>
                    <button style={btnEliminarStyle} onClick={() => handleEliminar(consulta.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  No hay consultas en la bandeja.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VENTANA MODAL PARA LEER EL MENSAJE COMPLETO */}
      {mensajeActivo && (
        <div style={{
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
          <div style={{
            backgroundColor: '#0a0a0a',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid var(--primary-green)',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ color: 'var(--primary-green)', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.5rem' }}>
              {mensajeActivo.asunto}
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-main)', fontWeight: 'bold', display: 'block' }}>{mensajeActivo.nombre}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{mensajeActivo.correo}</span>
              </div>
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{mensajeActivo.fecha}</span>
            </div>

            <div style={{ backgroundColor: '#111', padding: '1.5rem', borderRadius: '4px', border: '1px solid #333', color: '#d1d5db', minHeight: '120px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {mensajeActivo.mensaje}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => handleEliminar(mensajeActivo.id)} style={btnEliminarStyle}>
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