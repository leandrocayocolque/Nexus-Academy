import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { academia, modalidadesCurso, nivelesCurso, formatearFechaInicio, asuntoConsultaCurso } from '../api/academia';
import './PublicResponsive.css';

export default function DetalleCurso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resultado, setResultado] = useState(null);
  const [seleccion, setSeleccion] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let vigente = true;
    academia.obtenerCurso(id, { signal: controller.signal }).then(
      (curso) => { if (vigente) setResultado({ id, curso }); },
      (error) => {
        if (vigente && !controller.signal.aborted) setResultado({ id, error });
      },
    );
    return () => { vigente = false; controller.abort(); };
  }, [id]);

  const cargando = resultado?.id !== id;
  const curso = cargando ? null : resultado.curso;
  const error = cargando ? null : resultado.error;
  const imagenes = curso?.imagenes ?? [];
  const indiceImagen = seleccion?.cursoId === id && imagenes[seleccion.indice] ? seleccion.indice : 0;
  const imagenActual = imagenes[indiceImagen];
  if (cargando || error || !curso) {
    return (
      <div className="public-detail-status" style={{ textAlign: 'center', color: 'var(--text-main)' }}>
        {cargando ? <p role="status">Cargando curso...</p> : error?.status === 404 ? (
          <h2>Curso no encontrado</h2>
        ) : (
          <p role="alert">No se pudo cargar el curso. {error?.message || 'La respuesta del servidor no es válida.'}</p>
        )}
        <button 
          onClick={() => navigate('/cursos')} 
          className="public-button public-button-outline"
        >
          Volver al catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="public-detail" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/cursos')} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: '#9ca3af', 
          cursor: 'pointer', 
          fontSize: '1rem', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        &larr; Volver al catálogo
      </button>

      <div className="public-detail-card">
        <header className="public-detail-heading">
          <div className="public-detail-badges">
            <span style={badgeStyle}>{curso.categoria.nombre}</span>
            <span style={badgeStyle}>{nivelesCurso[curso.nivel]}</span>
          </div>
          <h1 className="public-detail-title">{curso.titulo}</h1>
          <p className={`public-detail-availability${curso.disponible ? ' is-available' : ''}`}>
            {curso.disponible ? `${curso.cuposDisponibles} cupos disponibles` : 'Sin disponibilidad'}
          </p>
        </header>

        {imagenActual?.url && (
          <section className="public-detail-gallery" aria-label={`Galería de ${curso.titulo}`}>
            <div className="public-detail-image" style={{ width: '100%' }}>
              <img id="imagen-curso-ampliada" src={imagenActual.url} alt={imagenActual.textoAlternativo || `${curso.titulo}, imagen ${indiceImagen + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <p className="public-gallery-status" role="status">Imagen {indiceImagen + 1} de {imagenes.length}{indiceImagen === 0 ? ' · Portada' : ''}</p>
            {imagenes.length > 1 && <div className="public-gallery-thumbnails" role="group" aria-label="Elegir imagen">
              {imagenes.map((img, indice) => <button key={img.id ?? img.url} type="button"
                aria-label={`Ver imagen ${indice + 1} de ${imagenes.length}${indice === 0 ? ', portada' : ''}`}
                aria-pressed={indice === indiceImagen} aria-controls="imagen-curso-ampliada"
                onClick={() => setSeleccion({ cursoId: id, indice })}>
                <img src={img.url} alt="" loading="lazy" />
              </button>)}
            </div>}
          </section>
        )}

        <div className="public-detail-content">
          <section aria-labelledby="curso-descripcion">
            <h2 id="curso-descripcion" className="public-detail-section-title">Sobre este curso</h2>
            <p className="public-detail-description">{curso.descripcion}</p>
          </section>

          <dl className="public-detail-facts">
            <div>
              <dt>Duración</dt>
              <dd>{curso.duracion}</dd>
            </div>
            <div>
              <dt>Modalidad</dt>
              <dd>{modalidadesCurso[curso.modalidad]}</dd>
            </div>
            <div>
              <dt>Disponibilidad</dt>
              <dd>{curso.disponible ? `${curso.cuposDisponibles} cupos disponibles` : 'Sin disponibilidad'}</dd>
            </div>
            <div>
              <dt>Inicio</dt>
              <dd>{formatearFechaInicio(curso.fechaInicio)}</dd>
            </div>
          </dl>

          <section className="public-detail-contact" aria-label="Precio y consulta">
            <p className="public-detail-price">
              <span>Precio:</span> {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(curso.precio))}
            </p>
            {/* T2 utiliza el UUID y el asunto para contextualizar la consulta. */}
            <Link
              className="public-detail-inquiry public-button public-button-primary"
              to="/contacto"
              state={{ cursoId: curso.id, asunto: asuntoConsultaCurso(curso.titulo) }}
            >
              Consultar sobre este curso &rarr;
            </Link>
          </section>

        </div>
      </div>
    </div>
  );
}

const badgeStyle = {
  padding: '0.4rem 1rem',
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  color: 'var(--primary-green)',
  border: '1px solid var(--primary-green)',
  borderRadius: '999px',
  fontSize: '0.85rem',
  fontWeight: 'bold'
};