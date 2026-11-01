import React, { useState } from 'react';
import { cursosMock } from '../data/cursos';

export default function GestionCursos() {
  // Inicializamos el estado con los datos simulados para poder "borrarlos" visualmente
  const [cursos, setCursos] = useState(cursosMock);

  // Función para simular la eliminación de un curso
  const handleEliminar = (id) => {
    const confirmar = window.confirm("¿Estás seguro de que querés eliminar este curso?");
    if (confirmar) {
      // Filtramos el array para dejar afuera el curso con ese ID
      setCursos(cursos.filter((curso) => curso.id !== id));
      // Más adelante acá irá la petición DELETE al backend
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>Gestión de Cursos</h2>
        <button style={btnNuevoStyle}>
          + Nuevo Curso
        </button>
      </header>

      <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #333', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={thStyle}>Curso</th>
              <th style={thStyle}>Categoría</th>
              <th style={thStyle}>Tipo</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cursos.length > 0 ? (
              cursos.map((curso) => (
                <tr key={curso.id} style={{ borderBottom: '1px solid #222', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={curso.imagen} alt={curso.titulo} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div>
                      <span style={{ color: 'var(--text-main)', fontWeight: '600', display: 'block' }}>{curso.titulo}</span>
                      <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>ID: {curso.id}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: '#9ca3af' }}>{curso.categoria}</td>
                  <td style={{ padding: '1rem', color: '#9ca3af' }}>{curso.tipo}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button style={btnEditarStyle} onClick={() => alert(`Simulando edición del curso: ${curso.titulo}`)}>
                      Editar
                    </button>
                    <button style={btnEliminarStyle} onClick={() => handleEliminar(curso.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  No hay cursos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Estilos extraídos para mantener el JSX limpio
const thStyle = {
  padding: '1rem',
  color: '#d1d5db',
  fontWeight: '600',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const btnNuevoStyle = {
  padding: '0.75rem 1.5rem',
  backgroundColor: 'var(--primary-green)',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const btnEditarStyle = {
  padding: '0.4rem 0.8rem',
  backgroundColor: 'transparent',
  color: '#3b82f6', // Azul para editar
  border: '1px solid #3b82f6',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '0.5rem',
  fontSize: '0.85rem'
};

const btnEliminarStyle = {
  padding: '0.4rem 0.8rem',
  backgroundColor: 'transparent',
  color: '#ef4444', // Rojo para eliminar
  border: '1px solid #ef4444',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem'
};