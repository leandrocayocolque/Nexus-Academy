import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { academia, modalidadesCurso, nivelesCurso, formatearFechaInicio, asuntoConsultaCurso } from '../api/academia';

export default function DetalleCurso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resultado, setResultado] = useState(null);

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
  if (cargando || error || !curso) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-main)' }}>
        {cargando ? <p role="status">Cargando curso...</p> : error?.status === 404 ? (
          <h2>Curso no encontrado</h2>
        ) : (
          <p role="alert">No se pudo cargar el curso. {error?.message || 'La respuesta del servidor no es válida.'}</p>
        )}
        <button 
          onClick={() => navigate('/cursos')} 
          style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer', backgroundColor: 'var(--bg-card)', color: 'white', border: '1px solid #333' }}
        >
          Volver al catálogo
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
        
        {curso.imagenes?.[0]?.url && (
          <div style={{ height: '400px', width: '100%' }}>
            <img src={curso.imagenes[0].url} alt={curso.imagenes[0].textoAlternativo || curso.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={badgeStyle}>{curso.categoria.nombre}</span>
            <span style={badgeStyle}>{nivelesCurso[curso.nivel]}</span>
            <span style={{ ...badgeStyle, backgroundColor: 'rgba(255,255,255,0.05)', color: '#d1d5db', border: '1px solid #333' }}>
              🕒 {curso.duracion}
            </span>
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '3.5rem', color: 'var(--text-main)', margin: '0', lineHeight: '1.1' }}>
            {curso.titulo}
          </h1>

          <p style={{ fontSize: '1.25rem', lineHeight: '1.7', color: '#d1d5db', margin: '0' }}>
            {curso.descripcion}
          </p>

          {/* Información publicada por la academia */}
          <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem', padding: '2rem 0', borderTop: '1px solid #333', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ color: '#9ca3af', margin: '0 0 0.5rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Modalidad</h4>
              <p style={{ color: 'var(--text-main)', margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{modalidadesCurso[curso.modalidad]}</p>
            </div>
            <div>
              <h4 style={{ color: '#9ca3af', margin: '0 0 0.5rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Disponibilidad</h4>
              <p style={{ color: 'var(--primary-green)', margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{curso.disponible ? `${curso.cuposDisponibles} cupos disponibles` : 'Sin disponibilidad'}</p>
            </div>
            <div>
              <h4 style={{ color: '#9ca3af', margin: '0 0 0.5rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Inicio</h4>
              <p style={{ color: 'var(--text-main)', margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{formatearFechaInicio(curso.fechaInicio)}</p>
            </div>
          </div>

          <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.25rem' }}>
            Precio: {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(curso.precio))}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            {/* T2 utiliza el UUID y el asunto para contextualizar la consulta. */}
            <Link 
              to="/contacto"
              state={{ cursoId: curso.id, asunto: asuntoConsultaCurso(curso.titulo) }}
              style={{
                padding: '1rem 2.5rem',
                backgroundColor: 'var(--primary-green)',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '999px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'var(--hover-green)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary-green)'}
            >
              Consultar sobre este curso &rarr;
            </Link>
          </div>

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