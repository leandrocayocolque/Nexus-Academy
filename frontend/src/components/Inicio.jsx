import React, { useEffect, useState } from 'react';
import { academia, formatearFechaInicio } from '../api/academia';
import { Link } from 'react-router-dom';
import './PublicResponsive.css';

export default function Inicio() {
  return (
    <div className="public-home" style={{ padding: '0', fontFamily: 'sans-serif' }}>
      
      {/* SECCIÓN 1: HERO (Basado en la cabecera centrada con botones duales) */}
      <section className="public-home-hero" style={{
        textAlign: 'center',
        // Un degradado sutil verde de fondo para simular el efecto de la primera imagen
        background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.15), var(--bg-dark) 50%)'
      }}>
        <h1 className="public-home-title" style={{
          fontFamily: 'Georgia, serif',
          color: 'var(--text-main)',
          margin: '0 0 1.5rem',
          letterSpacing: '-1px'
        }}>
          Formate para la era <span style={{color: 'var(--primary-green)'}}>agéntica</span>
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
          El rol del profesional ha cambiado a ser un orquestador de tecnología. 
          La teoría tradicional ya no es suficiente para destacar en el mercado actual.
        </p>
        <div className="public-home-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/cursos" style={{ ...botonStyle, backgroundColor: 'var(--text-main)', color: 'var(--bg-dark)' }}>
            Empezar ahora &rarr;
          </Link>
          <Link to="/contacto" style={{ ...botonStyle, backgroundColor: 'transparent', border: '1px solid var(--text-main)', color: 'var(--text-main)' }}>
            Para empresas
          </Link>
        </div>
      </section>

      <SeccionPublica tipo="promociones" />
      <SeccionPublica tipo="destacados" />

      {/* SECCIÓN 2: FRANJA DE DATOS (Reemplazando los logos de empresas) */}
      <section style={{ 
        borderTop: '1px solid #333', 
        borderBottom: '1px solid #333', 
        padding: '2rem', 
        display: 'flex', 
        justifyContent: 'space-around', 
        color: '#6b7280', 
        fontSize: '1.1rem', 
        fontWeight: 'bold', 
        flexWrap: 'wrap', 
        gap: '2rem' 
      }}>
        <span>+10,000 ALUMNOS</span>
        <span>50+ CURSOS</span>
        <span>95% INSERCIÓN LABORAL</span>
        <span>APRENDIZAJE PRÁCTICO</span>
      </section>

      {/* SECCIÓN 3: TEXTO TACHADO (Basado en el diseño dividido) */}
      <section className="public-home-intro" style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ flex: '1 1 400px' }}>
          <h2 className="public-home-intro-title" style={{ fontFamily: 'Georgia, serif', margin: 0, lineHeight: '1.1' }}>
            La educación <span style={{ textDecoration: 'line-through', opacity: 0.4 }}>teórica</span><br/> ha evolucionado
          </h2>
        </div>
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '1.5rem', color: '#d1d5db', margin: '0 0 1.5rem', lineHeight: '1.4' }}>
            Los estudiantes ya no solo memorizan conceptos. Planean, construyen y revisan utilizando herramientas reales e IA.
          </p>
          <p style={{ fontSize: '1.1rem', color: '#9ca3af', margin: 0, lineHeight: '1.6' }}>
            Te ayudamos a convertirte en el profesional del futuro, combinando fundamentos técnicos sólidos con fluidez en las nuevas tecnologías del mercado.
          </p>
        </div>
      </section>

      {/* SECCIÓN 4: CARACTERÍSTICAS Y VISUALES (Texto a la izq, recuadros dinámicos a la der) */}
      <section className="public-home-features" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 className="public-home-features-title" style={{ fontFamily: 'Georgia, serif', textAlign: 'center' }}>
          Reflejá tu aprendizaje con trabajo real
        </h2>

        <div className="public-home-feature-columns" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          
          <div style={{ flex: '1 1 350px' }}>
            <h3 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 1rem' }}>
              Tareas reales, no simulacros
            </h3>
            <p style={{ fontSize: '1.1rem', color: '#9ca3af', margin: '0 0 3rem', lineHeight: '1.6' }}>
              Sumergite en proyectos prácticos desde el día uno. Utilizá los frameworks, modelos y metodologías en los que confían las empresas de primera línea todos los días.
            </p>
            <h3 style={{ fontSize: '2rem', color: '#4b5563', margin: '0 0 1rem', opacity: 0.5 }}>
              Fluidez técnica, no solo teoría
            </h3>
          </div>

          {/* Grilla de imágenes con el efecto hover que armamos antes */}
          <div className="public-home-images" style={{ flex: '1.5 1 400px', display: 'grid' }}>
            <div className="img-hover-effect public-home-image">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80" alt="Alumnos trabajando en equipo" />
            </div>
            {/* Le agrego un "translateY" para que la segunda imagen baje un poco y rompa la simetría, dando un look más moderno */}
            <div className="img-hover-effect public-home-image public-home-image-offset">
              <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80" alt="Desarrollo y tecnología" />
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

// Cada sección mantiene su petición y su estado: un fallo no oculta la otra.
function SeccionPublica({ tipo }) {
  const promociones = tipo === 'promociones';
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const titulo = promociones ? 'Promociones vigentes' : 'Cursos destacados';

  useEffect(() => {
    const controller = new AbortController();
    const cargar = tipo === 'promociones' ? academia.cargarPromocionesActivas : academia.cargarCursosDestacados;
    cargar({ signal: controller.signal }).then(resultado => {
      if (!controller.signal.aborted) setDatos(resultado);
    }).catch(fallo => {
      if (!controller.signal.aborted) setError(fallo.message);
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });
    return () => controller.abort();
  }, [tipo, intento]);

  return (
    <section className="public-home-publications" aria-labelledby={`inicio-${tipo}`} aria-busy={cargando}>
      <h2 id={`inicio-${tipo}`}>{titulo}</h2>
      {cargando ? <p role="status">Cargando {titulo.toLowerCase()}...</p>
        : error ? <div role="alert"><p>No se pudieron cargar {titulo.toLowerCase()}. {error}</p>
          <button onClick={() => { setError(''); setCargando(true); setIntento(i => i + 1); }}>Reintentar</button></div>
          : datos.length === 0 ? <p>{promociones ? 'No hay promociones vigentes en este momento.' : 'No hay cursos destacados en este momento.'}</p>
            : <div className="public-home-publication-grid">
              {datos.map(item => <article key={item.id} className="public-home-publication-card">
                <h3>{item.titulo}</h3>
                {promociones ? <>
                  <p className="public-home-discount">{item.porcentajeDescuento}% de descuento</p>
                  {item.descripcion && <p className="public-home-publication-text">{item.descripcion}</p>}
                  {item.fechaInicio && <p>Desde: {new Date(item.fechaInicio).toLocaleString('es-AR')} (hora local)</p>}
                  {item.fechaFin && <p>Hasta: {new Date(item.fechaFin).toLocaleString('es-AR')} (hora local)</p>}
                  {item.curso?.id ? <Link to={`/cursos/${encodeURIComponent(item.curso.id)}`}>Ver curso: {item.curso.titulo}</Link>
                    : <Link to="/cursos">Explorar cursos</Link>}
                </> : <>
                  {item.descripcion && <p className="public-home-publication-text">{item.descripcion}</p>}
                  <p>Inicio: {formatearFechaInicio(item.fechaInicio)}</p>
                  <Link to={`/cursos/${encodeURIComponent(item.id)}`}>Ver curso: {item.titulo}</Link>
                </>}
              </article>)}
            </div>}
    </section>
  );
}

// Objeto de estilos para los botones redondeados
const botonStyle = {
  padding: '0.85rem 1.75rem',
  borderRadius: '999px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '1rem',
  display: 'inline-block',
  transition: 'transform 0.2s',
};