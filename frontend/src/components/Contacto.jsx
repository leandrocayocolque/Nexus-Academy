import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { academia, validarConsulta, contextoConsulta } from '../api/academia';

export default function Contacto() {
  const location = useLocation();

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
      toast.success('¡Tu mensaje fue enviado con éxito!', {
        description: 'Nos contactaremos pronto a tu correo.'
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
    padding: '0.75rem', 
    borderRadius: '4px', 
    backgroundColor: '#0a0a0a', 
    color: 'var(--text-main)',
    border: errores[nombreCampo] ? '1px solid #ef4444' : '1px solid #4b5563',
    outline: 'none'
  });

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--primary-green)', fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>
          Contactanos
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '1.1rem', margin: 0 }}>
          Dejanos tu consulta y te responderemos a la brevedad.
        </p>
      </header>

      {/* noValidate apaga los tooltips por defecto del navegador para usar los nuestros */}
      <form 
        onSubmit={handleSubmit}
        aria-busy={pendiente}
        noValidate
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem', 
          backgroundColor: 'var(--bg-card)', 
          padding: '2.5rem', 
          borderRadius: '8px', 
          border: '1px solid #333',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        }}
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
          style={{ 
            padding: '1rem', 
            backgroundColor: 'var(--primary-green)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px', 
            fontSize: '1.05rem', 
            fontWeight: '600', 
            cursor: 'pointer', 
            marginTop: '1rem',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = 'var(--hover-green)'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary-green)'}
        >
          {pendiente ? 'Enviando...' : 'Enviar Mensaje'}
        </button>
      </form>
    </div>
  );
}