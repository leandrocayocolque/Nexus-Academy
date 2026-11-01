import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cursosMock } from '../data/cursos';

export default function DetalleCurso() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Buscamos el curso exacto convirtiendo el ID de la URL a número
  const curso = cursosMock.find((c) => c.id === parseInt(id));

  // Manejo de error si el usuario ingresa un ID que no existe
  if (!curso) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-main)' }}>
        <h2>Curso no encontrado</h2>
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
        
        <div style={{ height: '400px', width: '100%' }}>
          <img src={curso.imagen} alt={curso.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={badgeStyle}>{curso.categoria}</span>
            <span style={badgeStyle}>{curso.tipo}</span>
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

          {/* Información extra simulada visualmente */}
          <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem', padding: '2rem 0', borderTop: '1px solid #333', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ color: '#9ca3af', margin: '0 0 0.5rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Modalidad</h4>
              <p style={{ color: 'var(--text-main)', margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>Online Sincrónico</p>
            </div>
            <div>
              <h4 style={{ color: '#9ca3af', margin: '0 0 0.5rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Disponibilidad</h4>
              <p style={{ color: 'var(--primary-green)', margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>Últimos 5 cupos</p>
            </div>
            <div>
              <h4 style={{ color: '#9ca3af', margin: '0 0 0.5rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Inicio</h4>
              <p style={{ color: 'var(--text-main)', margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>Próximo mes</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            {/* Se envía el título del curso por state para precompletar el formulario a futuro */}
            <Link 
              to="/contacto"
              state={{ asunto: `Consulta sobre el curso: ${curso.titulo}` }}
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