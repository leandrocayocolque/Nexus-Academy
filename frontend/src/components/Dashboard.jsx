import React from 'react';
import { cursosMock } from '../data/cursos';

export default function Dashboard() {
  // 1. IMPORTACIÓN DE DATOS
  // Usamos tus cursos simulados. Para categorías y consultas, definimos una pequeña 
  // base temporal acá para replicar la lógica hasta que conectemos con el backend.
  const categoriasMock = [
    { id: 1, nombre: 'Tecnología' },
    { id: 2, nombre: 'Negocios' },
    { id: 3, nombre: 'Diseño y Comunicación' }
  ];

  const consultasMock = [
    { id: 1, asunto: 'Consulta 1', leido: false }, // Nuevo
    { id: 2, asunto: 'Consulta 2', leido: true },  // Leído
    { id: 3, asunto: 'Consulta 3', leido: false }  // Nuevo
  ];

  // 2. LÓGICA DINÁMICA (Cálculos)
  const totalCursos = cursosMock.length;
  const totalCategorias = categoriasMock.length;
  
  // Filtramos el arreglo de consultas para contar solamente las que tienen leido: false
  const consultasPendientes = consultasMock.filter(consulta => consulta.leido === false).length;

  return (
    <div>
      <h2 style={{ color: 'var(--text-main)', margin: '0 0 2.5rem 0', fontSize: '2rem' }}>Resumen General</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        {/* Tarjeta de Cursos */}
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Cursos Activos</h4>
          <p style={cardValueStyle}>{totalCursos}</p>
        </div>

        {/* Tarjeta de Categorías */}
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Categorías</h4>
          <p style={cardValueStyle}>{totalCategorias}</p>
        </div>

        {/* Tarjeta de Consultas (Cambia de color si hay mensajes pendientes) */}
        <div style={{ 
          ...cardStyle, 
          borderLeftColor: consultasPendientes > 0 ? '#ef4444' : 'var(--primary-green)' 
        }}>
          <h4 style={cardTitleStyle}>Consultas Pendientes</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <p style={{ 
              ...cardValueStyle, 
              color: consultasPendientes > 0 ? '#ef4444' : 'var(--text-main)' 
            }}>
              {consultasPendientes}
            </p>
            
            {/* Pequeño indicador visual (Puntito rojo) si hay mensajes sin leer */}
            {consultasPendientes > 0 && (
              <span style={{ 
                display: 'block', 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#ef4444', 
                borderRadius: '50%',
                boxShadow: '0 0 8px #ef4444'
              }}></span>
            )}
          </div>
        </div>

      </div>

      {/* Sección Informativa Adicional */}
      <div style={{ marginTop: '3rem', padding: '2rem', backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #333' }}>
        <h3 style={{ color: 'var(--text-main)', margin: '0 0 1rem 0' }}>Estado del Sistema</h3>
        <ul style={{ color: '#9ca3af', lineHeight: '1.8', margin: 0, paddingLeft: '1.5rem' }}>
          <li>
            El catálogo público cuenta actualmente con <strong>{totalCursos}</strong> opciones educativas distribuidas en <strong>{totalCategorias}</strong> áreas de estudio.
          </li>
          <li>
            {consultasPendientes > 0 
              ? `Tenés ${consultasPendientes} mensajes nuevos esperando respuesta en la bandeja de entrada.`
              : 'Tu bandeja de consultas está al día, no hay mensajes pendientes.'}
          </li>
        </ul>
      </div>
    </div>
  );
}

// Estilos reutilizables
const cardStyle = {
  backgroundColor: '#0a0a0a',
  padding: '1.5rem',
  borderRadius: '8px',
  border: '1px solid #333',
  borderLeft: '4px solid var(--primary-green)',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  transition: 'transform 0.2s'
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