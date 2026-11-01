import React from 'react';

export default function Dashboard() {
  return (
    <div>
      <h2 style={{ color: 'var(--text-main)', margin: '0 0 2.5rem 0', fontSize: '2rem' }}>Resumen General</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Cursos Activos</h4>
          <p style={cardValueStyle}>6</p>
        </div>

        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Categorías</h4>
          <p style={cardValueStyle}>3</p>
        </div>

        <div style={{ ...cardStyle, borderLeftColor: '#ef4444' }}>
          <h4 style={cardTitleStyle}>Consultas Pendientes</h4>
          <p style={{ ...cardValueStyle, color: '#ef4444' }}>4</p>
        </div>

      </div>

      <div style={{ marginTop: '3rem', padding: '2rem', backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #333' }}>
        <h3 style={{ color: 'var(--text-main)', margin: '0 0 1rem 0' }}>Accesos Rápidos</h3>
        <p style={{ color: '#9ca3af', lineHeight: '1.6', margin: 0 }}>
          Utilizá el menú lateral para navegar por las distintas secciones. Desde "Cursos" podrás agregar nueva oferta académica, y en "Consultas" podrás leer y responder los mensajes recibidos desde el formulario de contacto público.
        </p>
      </div>
    </div>
  );
}

// Estilos reutilizables para las tarjetas de métricas
const cardStyle = {
  backgroundColor: '#0a0a0a',
  padding: '1.5rem',
  borderRadius: '8px',
  border: '1px solid #333',
  borderLeft: '4px solid var(--primary-green)',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
};

const cardTitleStyle = {
  color: '#9ca3af',
  margin: '0 0 0.5rem 0',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const cardValueStyle = {
  color: 'var(--text-main)',
  margin: 0,
  fontSize: '2.5rem',
  fontWeight: 'bold'
};