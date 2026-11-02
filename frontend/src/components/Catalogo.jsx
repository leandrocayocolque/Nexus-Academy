import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cursosMock } from '../data/cursos';

export default function Catalogo() {
  const navigate = useNavigate();

  // 1. Estados para los filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtrosArea, setFiltrosArea] = useState([]);
  const [filtrosTipo, setFiltrosTipo] = useState([]);

  // 2. Estados para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(6); // 6 es buen número para grillas

  // 3. Funciones para manejar los checkboxes
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

  // 4. Resetear la página a 1 si el usuario usa un filtro o busca algo
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtrosArea, filtrosTipo]);

  const handleCambioItems = (e) => {
    setItemsPorPagina(Number(e.target.value));
    setPaginaActual(1);
  };

  // 5. Lógica de filtrado dinámico
  const cursosFiltrados = cursosMock.filter((curso) => {
    const coincideBusqueda = curso.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             curso.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideArea = filtrosArea.length === 0 || filtrosArea.includes(curso.categoria);
    const coincideTipo = filtrosTipo.length === 0 || filtrosTipo.includes(curso.tipo);
    
    return coincideBusqueda && coincideArea && coincideTipo;
  });

  // 6. Lógica de Paginación (sobre los cursos ya filtrados)
  const indiceUltimoCurso = paginaActual * itemsPorPagina;
  const indicePrimerCurso = indiceUltimoCurso - itemsPorPagina;
  const cursosPaginados = cursosFiltrados.slice(indicePrimerCurso, indiceUltimoCurso);
  
  const totalPaginas = Math.ceil(cursosFiltrados.length / itemsPorPagina);

  return (
    <div style={{ display: 'flex', gap: '3rem', padding: '2rem', maxWidth: '1400px', margin: '0 auto', flexWrap: 'wrap' }}>
      
      {/* Columna Izquierda: Buscador y Filtros */}
      <aside style={{ width: '250px', flexShrink: 0 }}>
        
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Selector de cantidad por página */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Mostrar:</span>
          <select 
            value={itemsPorPagina} 
            onChange={handleCambioItems} 
            style={{ padding: '0.4rem', borderRadius: '4px', backgroundColor: '#0a0a0a', color: 'var(--text-main)', border: '1px solid #4b5563' }}
          >
            <option value={2}>2</option>
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>

        {cursosPaginados.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem', alignContent: 'start', flex: 1 }}>
              {cursosPaginados.map((curso) => (
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

            {/* Controles de Paginación al pie de la grilla */}
            {totalPaginas > 1 && (
              <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                  Página {paginaActual} de {totalPaginas} ({cursosFiltrados.length} resultados)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} 
                    disabled={paginaActual === 1}
                    style={{ ...btnPaginacionStyle, opacity: paginaActual === 1 ? 0.5 : 1, cursor: paginaActual === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Anterior
                  </button>
                  <button 
                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} 
                    disabled={paginaActual === totalPaginas}
                    style={{ ...btnPaginacionStyle, opacity: paginaActual === totalPaginas ? 0.5 : 1, cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer' }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px dashed #4b5563' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>No encontramos cursos</h3>
            <p style={{ margin: 0 }}>Intentá desmarcar algunos filtros o usar otros términos de búsqueda.</p>
          </div>
        )}
      </main>
    </div>
  );
}

const btnPaginacionStyle = { 
  padding: '0.5rem 1rem', 
  backgroundColor: 'transparent', 
  border: '1px solid #4b5563', 
  borderRadius: '4px', 
  color: 'var(--text-main)',
  transition: 'background-color 0.2s'
};