import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { academia, validarConsulta, contextoConsulta } from '../api/academia';
import { useNegocio } from './NegocioContext';
import { etiquetaHorario } from '../utils/presentacion.js';
import './PublicResponsive.css';

export default function Contacto() {
  const location = useLocation();
  const { negocio } = useNegocio();

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    asunto: null,
    mensaje: ''
  });

  const [errores, setErrores] = useState({});
  const [pendiente, setPendiente] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const enviando = useRef(false);
  const contexto = contextoConsulta(location.state);
  // null indica un asunto sin editar: sigue la navegación sin efectos.
  // Una edición (incluso vacía) siempre tiene prioridad sobre el contexto.
  const asunto = formData.asunto ?? contexto.asunto;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    // Si el usuario empieza a escribir, borramos el error de ese campo para limpiar la pantalla
    if (errores[e.target.name]) {
      setErrores({ ...errores, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando.current) return;
    const datos = { ...formData, asunto, cursoId: contexto.cursoId };
    const nuevosErrores = validarConsulta(datos);
    setErrores(nuevosErrores);
    setErrorEnvio('');
    if (Object.keys(nuevosErrores).length) {
      toast.error('No se pudo enviar el mensaje', {
        description: 'Por favor, revisá los campos marcados en rojo.'
      });
      return;
    }

    // El ref bloquea otro envío antes del siguiente render.
    enviando.current = true;
    setPendiente(true);
    try {
      await academia.crearConsulta(datos);
      setFormData({ nombre: '', correo: '', telefono: '', asunto: '', mensaje: '' });
      toast.success('¡Recibimos tu consulta!', {
        description: 'Tu consulta quedó guardada para que nuestro equipo pueda responderte.'
      });
    } catch (error) {
      const mensaje = error.message || 'No se pudo enviar la consulta. Intentá nuevamente.';
      setErrorEnvio(mensaje);
      toast.error('No se pudo enviar el mensaje', { description: mensaje });
    } finally {
      enviando.current = false;
      setPendiente(false);
    }
  };

  // Función auxiliar para aplicar el borde rojo si hay un error
  const getStyleInput = (nombreCampo) => ({
    borderColor: errores[nombreCampo] ? 'var(--status-error)' : 'var(--border-control)'
  });

  const horarios = negocio?.horariosAtencion ? Object.entries(negocio.horariosAtencion) : [];
  const redes = negocio?.enlacesSociales ? Object.entries(negocio.enlacesSociales) : [];
  const hayInfoNegocio = Boolean(
    negocio?.direccion || negocio?.telefono || negocio?.correo || horarios.length > 0 || redes.length > 0
  );

  return (
    <div className="public-contact" style={{ maxWidth: '1050px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 className="public-contact-title">
          Contactanos
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '1.1rem', margin: 0 }}>
          Dejanos tu consulta y te responderemos a la brevedad.
        </p>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start', justifyContent: 'center' }}>
        {/* Tarjeta de Información del Comercio */}
        {hayInfoNegocio && (
          <aside className="public-contact-info">
            <h3 style={{ margin: 0, color: 'var(--primary-green)', fontSize: '1.35rem' }}>
              {negocio?.nombre || 'Información de Contacto'}
            </h3>

            {negocio?.direccion && (
              <div>
                <strong style={{ color: '#d1d5db', display: 'block', marginBottom: '0.25rem' }}>Dirección</strong>
                <span style={{ color: '#9ca3af' }}>{negocio.direccion}</span>
              </div>
            )}

            {negocio?.telefono && (
              <div>
                <strong style={{ color: '#d1d5db', display: 'block', marginBottom: '0.25rem' }}>Teléfono</strong>
                <span style={{ color: '#9ca3af' }}>{negocio.telefono}</span>
              </div>
            )}

            {negocio?.correo && (
              <div>
                <strong style={{ color: '#d1d5db', display: 'block', marginBottom: '0.25rem' }}>Correo</strong>
                <a href={`mailto:${negocio.correo}`} style={{ color: 'var(--primary-green)', textDecoration: 'none' }}>
                  {negocio.correo}
                </a>
              </div>
            )}

            {horarios.length > 0 && (
              <div>
                <strong style={{ color: '#d1d5db', display: 'block', marginBottom: '0.5rem' }}>Horarios de atención</strong>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.35rem', color: '#9ca3af', fontSize: '0.95rem' }}>
                  {horarios.map(([dias, franja]) => (
                    <li key={dias}>
                      <span style={{ color: '#d1d5db' }}>{etiquetaHorario(dias)}:</span> {franja}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {redes.length > 0 && (
              <div>
                <strong style={{ color: '#d1d5db', display: 'block', marginBottom: '0.6rem' }}>Redes sociales</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  {redes.map(([nombreRed, url]) => (
                    <a
                      key={nombreRed}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.4rem 0.9rem',
                        borderRadius: '999px',
                        border: '1px solid var(--primary-green)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--primary-green)',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      {nombreRed} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Formulario de Consulta */}
        <form
          className="public-contact-form"
          onSubmit={handleSubmit}
          aria-busy={pendiente}
          noValidate
        >
          {/* Campo Nombre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="nombre" style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Nombre completo *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              disabled={pendiente}
              value={formData.nombre}
              onChange={handleChange}
              style={getStyleInput('nombre')}
            />
            {errores.nombre && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{errores.nombre}</span>}
          </div>

          {/* Campo Correo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="correo" style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Correo electrónico *</label>
            <input
              type="email"
              id="correo"
              name="correo"
              disabled={pendiente}
              value={formData.correo}
              onChange={handleChange}
              style={getStyleInput('correo')}
            />
            {errores.correo && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{errores.correo}</span>}
          </div>

          {/* Campo Teléfono (Sin validación obligatoria) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="telefono" style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Teléfono (opcional)</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              disabled={pendiente}
              value={formData.telefono}
              onChange={handleChange}
              style={getStyleInput('telefono')}
            />
          </div>

          {errores.telefono && <span role="alert" style={{ color: '#ef4444' }}>{errores.telefono}</span>}
          {errores.cursoId && <p role="alert" style={{ color: '#ef4444' }}>{errores.cursoId}</p>}

          {/* Campo Asunto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="asunto" style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Asunto *</label>
            <input
              type="text"
              id="asunto"
              name="asunto"
              disabled={pendiente}
              value={asunto}
              onChange={handleChange}
              style={getStyleInput('asunto')}
            />
            {errores.asunto && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{errores.asunto}</span>}
          </div>

          {/* Campo Mensaje */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="mensaje" style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Mensaje *</label>
            <textarea
              id="mensaje"
              name="mensaje"
              disabled={pendiente}
              rows="5"
              value={formData.mensaje}
              onChange={handleChange}
              style={{ ...getStyleInput('mensaje'), resize: 'vertical' }}
            ></textarea>
            {errores.mensaje && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{errores.mensaje}</span>}
          </div>

          {errorEnvio && <p role="alert" style={{ color: '#ef4444' }}>{errorEnvio}</p>}
          {pendiente && <p role="status">Enviando consulta...</p>}
          <button
            type="submit"
            disabled={pendiente}
            className="public-button public-button-primary"
            onMouseOver={(e) => e.target.style.backgroundColor = 'var(--hover-green)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary-green)'}
          >
            {pendiente ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
        </form>
      </div>
    </div>
  );
}