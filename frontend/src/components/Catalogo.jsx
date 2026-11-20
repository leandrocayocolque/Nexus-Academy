import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { academia, nivelesCurso, modalidadesCurso } from '../api/academia';
import './PublicResponsive.css';

export default function Catalogo() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [errorCursos, setErrorCursos] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let vigente = true;
    async function cargarCursos() {
      try {
        const [datos, areas] = await Promise.all([
          academia.cargarTodosCursos({ signal: controller.signal }),
          academia.cargarTodasCategorias({ signal: controller.signal }),
        ]);
        if (!vigente) return;
        setCursos(datos);
        setCategorias(areas);
      } catch (error) {
        if (vigente && !controller.signal.aborted) {
          setErrorCursos(`No se pudo cargar el catálogo. ${error.message}`);
        }
      } finally {
        if (vigente) setCargando(false);
      }
    }
    cargarCursos();
    return () => { vigente = false; controller.abort(); };
  }, []);

  // 1. Estados para los filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtrosArea, setFiltrosArea] = useState([]);

  // 2. Estados para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(6); // 6 es buen número para grillas

  // 3. Funciones para manejar los checkboxes
  const handleAreaChange = (area) => {
    setPaginaActual(1);
    setFiltrosArea((prev) => 
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  // Cada cambio de filtro vuelve a la primera página desde su evento.

  const handleCambioItems = (e) => {
    setItemsPorPagina(Number(e.target.value));
    setPaginaActual(1);
  };

  // 5. Lógica de filtrado dinámico
  const cursosFiltrados = cursos.filter((curso) => {
    const coincideBusqueda = curso.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             (curso.descripcion ?? '').toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideArea = filtrosArea.length === 0 || filtrosArea.includes(curso.categoria.id);
    return coincideBusqueda && coincideArea;
  });

  // 6. Lógica de Paginación (sobre los cursos ya filtrados)
  const indiceUltimoCurso = paginaActual * itemsPorPagina;
  const indicePrimerCurso = indiceUltimoCurso - itemsPorPagina;
  const cursosPaginados = cursosFiltrados.slice(indicePrimerCurso, indiceUltimoCurso);
  
  const totalPaginas = Math.ceil(cursosFiltrados.length / itemsPorPagina);

  return (
    <div className="public-catalogue">
      
      {/* Columna Izquierda: Buscador y Filtros */}
      <aside className="public-catalogue-filters">
        
        <div style={{ marginBottom: '2rem' }}>
          <input 
            type="text" 
            placeholder="Buscar curso..."
            aria-label="Buscar curso"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
            className="public-control"
          />
        </div>

        <h3 style={{ borderBottom: '2px solid var(--primary-green)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
          Filtrar por:
        </h3>
        
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#d1d5db', marginBottom: '1rem' }}>Área</h4>
          {categorias.map((area) => (
            <label key={area.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={filtrosArea.includes(area.id)}
                onChange={() => handleAreaChange(area.id)}
                style={{ accentColor: 'var(--primary-green)' }} 
              /> {area.nombre}
            </label>
          ))}
        </div>

      </aside>

      {/* Columna Derecha: Grilla de Cursos */}
      <main className="public-catalogue-results" style={{ display: 'flex', flexDirection: 'column' }}>
        {cargando && <p role="status">Cargando catálogo...</p>}
        {errorCursos && <p role="alert">{errorCursos}</p>}
        
        {/* Selector de cantidad por página */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Mostrar:</span>
          <select 
            value={itemsPorPagina} 
            onChange={handleCambioItems} 
            className="public-control"
          >
            <option value={2}>2</option>
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>

        {!cargando && !errorCursos && (cursosPaginados.length > 0 ? (
          <>
            <div className="public-course-grid" style={{ alignContent: 'start', flex: 1 }}>
              {cursosPaginados.map((curso) => (
                <article 
                  key={curso.id} 
                  onClick={() => navigate(`/cursos/${curso.id}`)}
                  className="public-course-card"
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div className="public-course-image">
                    {curso.imagenes?.[0]?.url ? (
                      <img
                        src={curso.imagenes?.[0]?.url}
                        alt={curso.imagenes[0].textoAlternativo || curso.titulo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span className="public-course-image-placeholder">Imagen no disponible</span>
                    )}
                  </div>
                  <div className="public-course-content">
                    <h3 className="public-course-title">
                      {curso.titulo}
                    </h3>
                    <p className="public-course-meta">
                      Área: {curso.categoria.nombre} • {nivelesCurso[curso.nivel]} • {modalidadesCurso[curso.modalidad]} • Duración: {curso.duracion}
                    </p>
                    <p className="public-course-summary">
                      {curso.descripcion}
                    </p>
                    <button className="public-button public-button-outline">
                      Ver Detalles
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Controles de Paginación al pie de la grilla */}
            {totalPaginas > 1 && (
              <div className="public-pagination" style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <div className="public-catalogue-empty" style={{ textAlign: 'center', color: '#9ca3af', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px dashed #4b5563' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>No encontramos cursos</h3>
            <p style={{ margin: 0 }}>{cursos.length === 0 ? 'Por el momento no hay cursos disponibles.' : 'Intentá desmarcar algunos filtros o usar otros términos de búsqueda.'}</p>
          </div>
        ))}
      </main>
    </div>
  );
}

const btnPaginacionStyle = { 
  padding: '0.5rem 1rem', 
  backgroundColor: 'transparent', 
  border: '1px solid var(--border-control)',
  borderRadius: 'var(--radius-control)',
  color: 'var(--text-main)',
};