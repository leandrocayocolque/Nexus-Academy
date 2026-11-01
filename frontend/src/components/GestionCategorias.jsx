import React, { useState } from 'react';

export default function GestionCategorias() {
  // Datos simulados iniciales para las categorías
  const [categorias, setCategorias] = useState([
    { id: 1, nombre: 'Tecnología', descripcion: 'Cursos vinculados a programación, software e IA.' },
    { id: 2, nombre: 'Negocios', descripcion: 'Programas de management, finanzas y marketing.' },
    { id: 3, nombre: 'Diseño y Comunicación', descripcion: 'Formación en UX/UI, diseño gráfico y audiovisual.' }
  ]);

  const handleEliminar = (id) => {
    const confirmar = window.confirm("¿Estás seguro de que querés eliminar esta categoría? Esto podría afectar a los cursos vinculados.");
    if (confirmar) {
      setCategorias(categorias.filter((cat) => cat.id !== id));
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>Gestión de Categorías</h2>
        <button style={btnNuevoStyle}>
          + Nueva Categoría
        </button>
      </header>

      <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #333', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ ...thStyle, width: '80px' }}>ID</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Descripción</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length > 0 ? (
              categorias.map((categoria) => (
                <tr key={categoria.id} style={{ borderBottom: '1px solid #222', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>#{categoria.id}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: '600' }}>
                    {categoria.nombre}
                  </td>
                  <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                    {categoria.descripcion}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button style={btnEditarStyle} onClick={() => alert(`Simulando edición de: ${categoria.nombre}`)}>
                      Editar
                    </button>
                    <button style={btnEliminarStyle} onClick={() => handleEliminar(categoria.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  No hay categorías registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reutilizamos los mismos estilos para mantener coherencia visual
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
  color: '#3b82f6',
  border: '1px solid #3b82f6',
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