import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cursosMock } from '../data/cursos';

export default function Catalogo() {
  // 1. Estados para los filtros
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [filtrosArea, setFiltrosArea] = useState([]);
  const [filtrosTipo, setFiltrosTipo] = useState([]);

  // 2. Funciones para manejar los checkboxes
  const handleAreaChange = (area) => {
    setFiltrosArea((prev) => 
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleTipoChange = (tipo) => {
    setFiltrosTipo((prev) => 
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  // 3. Lógica de filtrado dinámico
  const cursosFiltrados = cursosMock.filter((curso) => {
    const coincideBusqueda = curso.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             curso.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    
    // Si el array de filtros está vacío, mostramos todo. Si tiene algo, verificamos si incluye la categoría/tipo del curso.
    const coincideArea = filtrosArea.length === 0 || filtrosArea.includes(curso.categoria);
    const coincideTipo = filtrosTipo.length === 0 || filtrosTipo.includes(curso.tipo);
    
    return coincideBusqueda && coincideArea && coincideTipo;
  });

  return (
    <div style={{ display: 'flex', gap: '3rem', padding: '2rem', maxWidth: '1400px', margin: '0 auto', flexWrap: 'wrap' }}>
      
      {/* Columna Izquierda: Buscador y Filtros */}
      <aside style={{ width: '250px', flexShrink: 0 }}>
        
        {/* Buscador de texto */}
        <div style={{ marginBottom: '2rem' }}>
          <input 
            type="text" 
            placeholder="Buscar curso..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              borderRadius: '4px', 
              border: '1px solid #4b5563', 
              backgroundColor: '#0a0a0a', 
              color: 'var(--text-main)',
              boxSizing: 'border-box'
            }} 
          />
        </div>

        <h3 style={{ borderBottom: '2px solid var(--primary-green)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
          Filtrar por:
        </h3>
        
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#d1d5db', marginBottom: '1rem' }}>Área</h4>
          {['Tecnología', 'Negocios', 'Diseño y Comunicación'].map((area) => (
            <label key={area} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={filtrosArea.includes(area)}
                onChange={() => handleAreaChange(area)}
                style={{ accentColor: 'var(--primary-green)' }} 
              /> {area}
            </label>
          ))}
        </div>

        <div>
          <h4 style={{ color: '#d1d5db', marginBottom: '1rem' }}>Tipo</h4>
          {['Curso', 'Programa Ejecutivo', 'Diplomatura', 'Programa Universitario'].map((tipo) => (
            <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={filtrosTipo.includes(tipo)}
                onChange={() => handleTipoChange(tipo)}
                style={{ accentColor: 'var(--primary-green)' }} 
              /> {tipo}
            </label>
          ))}
        </div>
      </aside>

      {/* Columna Derecha: Grilla de Cursos */}
      <main style={{ flex: 1 }}>
        {cursosFiltrados.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem', alignContent: 'start' }}>
            {cursosFiltrados.map((curso) => (
              <article 
                key={curso.id} 
                onClick={() => navigate(`/cursos/${curso.id}`)}
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  border: '1px solid #333',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: '200px', overflow: 'hidden' }}>
                  <img 
                    src={curso.imagen} 
                    alt={curso.titulo} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ color: 'var(--primary-green)', margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
                    {curso.titulo}
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#9ca3af' }}>
                    {curso.tipo} • Área: {curso.categoria} • 🕒 {curso.duracion}
                  </p>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#d1d5db', margin: '0 0 1.5rem 0', flex: 1 }}>
                    {curso.descripcion}
                  </p>
                  <button style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--primary-green)',
                    color: 'var(--primary-green)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}>
                    Ver Detalles
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Mensaje de fallback si los filtros no coinciden con nada */
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px dashed #4b5563' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1rem' }}>No encontramos cursos</h3>
            <p>Intentá desmarcar algunos filtros o usar otros términos de búsqueda.</p>
          </div>
        )}
      </main>
    </div>
  );
}