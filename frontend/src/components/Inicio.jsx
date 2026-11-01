import React from 'react';
import { Link } from 'react-router-dom';

export default function Inicio() {
  return (
    <div style={{ padding: '0', fontFamily: 'sans-serif', overflowX: 'hidden' }}>
      
      {/* SECCIÓN 1: HERO (Basado en la cabecera centrada con botones duales) */}
      <section style={{
        textAlign: 'center',
        padding: '8rem 2rem 6rem',
        // Un degradado sutil verde de fondo para simular el efecto de la primera imagen
        background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.15), var(--bg-dark) 50%)'
      }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '4.5rem',
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
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/cursos" style={{ ...botonStyle, backgroundColor: 'var(--text-main)', color: 'var(--bg-dark)' }}>
            Empezar ahora &rarr;
          </Link>
          <Link to="/contacto" style={{ ...botonStyle, backgroundColor: 'transparent', border: '1px solid var(--text-main)', color: 'var(--text-main)' }}>
            Para empresas
          </Link>
        </div>
      </section>

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
      <section style={{ display: 'flex', flexWrap: 'wrap', padding: '8rem 4rem', gap: '4rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ flex: '1 1 400px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '3.5rem', margin: 0, lineHeight: '1.1' }}>
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
      <section style={{ padding: '4rem 4rem 10rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '3rem', margin: '0 0 5rem', textAlign: 'center' }}>
          Reflejá tu aprendizaje con trabajo real
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6rem', alignItems: 'center' }}>
          
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
          <div style={{ flex: '1.5 1 400px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <div className="img-hover-effect" style={{ height: '300px' }}>
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80" alt="Alumnos trabajando en equipo" />
            </div>
            {/* Le agrego un "translateY" para que la segunda imagen baje un poco y rompa la simetría, dando un look más moderno */}
            <div className="img-hover-effect" style={{ height: '300px', transform: 'translateY(3rem)' }}>
              <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80" alt="Desarrollo y tecnología" />
            </div>
          </div>

        </div>
      </section>
    </div>
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