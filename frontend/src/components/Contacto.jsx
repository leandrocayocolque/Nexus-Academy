import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Contacto() {
  const location = useLocation();

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    asunto: '',
    mensaje: ''
  });

  // Estado para guardar los textos de error de cada campo
  const [errores, setErrores] = useState({});
  // Estado para mostrar un mensaje de éxito al enviar
  const [enviado, setEnviado] = useState(false);

  // Si llegamos a esta pantalla desde un curso, autocompletamos el asunto
  useEffect(() => {
    if (location.state && location.state.asunto) {
      setFormData(prev => ({ ...prev, asunto: location.state.asunto }));
    }
  }, [location]);

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

  const validarFormulario = () => {
    const nuevosErrores = {};
    
    // Validación Nombre
    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    }
    
    // Validación Correo (vacío o formato inválido usando una expresión regular)
    if (!formData.correo.trim()) {
      nuevosErrores.correo = 'El correo electrónico es obligatorio.';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.correo)) {
      nuevosErrores.correo = 'Por favor, ingresá un correo electrónico válido.';
    }

    // Validación Asunto
    if (!formData.asunto.trim()) {
      nuevosErrores.asunto = 'El asunto es obligatorio.';
    }

    // Validación Mensaje (vacío o menos de 10 caracteres)
    if (!formData.mensaje.trim()) {
      nuevosErrores.mensaje = 'El mensaje es obligatorio.';
    } else if (formData.mensaje.trim().length < 10) {
      nuevosErrores.mensaje = 'El mensaje debe tener al menos 10 caracteres.';
    }

    setErrores(nuevosErrores);
    
    // Si el objeto nuevosErrores está vacío, significa que pasó todas las pruebas
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEnviado(false); // Reiniciamos el estado de éxito por si está reenviando
    
    if (validarFormulario()) {
      console.log('Datos listos para enviar al backend:', formData);
      setEnviado(true);
      
      // Limpiar el formulario
      setFormData({ nombre: '', correo: '', telefono: '', asunto: '', mensaje: '' });
      
      // Ocultar el cartel de éxito después de 5 segundos
      setTimeout(() => setEnviado(false), 5000);
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

      {/* Cartel flotante de éxito */}
      {enviado && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary-green)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center', border: '1px solid var(--primary-green)' }}>
          ¡Tu mensaje fue enviado con éxito! Nos contactaremos pronto.
        </div>
      )}

      {/* noValidate apaga los tooltips por defecto del navegador para usar los nuestros */}
      <form 
        onSubmit={handleSubmit} 
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
            value={formData.telefono} 
            onChange={handleChange} 
            style={getStyleInput('telefono')}
          />
        </div>

        {/* Campo Asunto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="asunto" style={{ color: '#d1d5db', fontSize: '0.95rem' }}>Asunto *</label>
          <input 
            type="text" 
            id="asunto" 
            name="asunto" 
            value={formData.asunto} 
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
            rows="5" 
            value={formData.mensaje} 
            onChange={handleChange} 
            style={{ ...getStyleInput('mensaje'), resize: 'vertical' }}
          ></textarea>
          {errores.mensaje && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{errores.mensaje}</span>}
        </div>

        <button 
          type="submit" 
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
          Enviar Mensaje
        </button>
      </form>
    </div>
  );
}