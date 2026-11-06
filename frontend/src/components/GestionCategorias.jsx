import React, { useState } from 'react';
import { toast } from 'sonner';

export default function GestionCategorias() {
  const [categorias, setCategorias] = useState([
    { id: 1, nombre: 'Tecnología', descripcion: 'Cursos vinculados a programación, software e IA.' },
    { id: 2, nombre: 'Negocios', descripcion: 'Programas de management, finanzas y marketing.' },
    { id: 3, nombre: 'Diseño y Comunicación', descripcion: 'Formación en UX/UI, diseño gráfico y audiovisual.' }
  ]);

  // Estados del Formulario ABM
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({ id: null, nombre: '', descripcion: '' });

  const handleNuevo = () => {
    setFormData({ id: null, nombre: '', descripcion: '' });
    setMostrarFormulario(true);
  };

  const handleEditar = (categoria) => {
    setFormData(categoria);
    setMostrarFormulario(true);
  };

  const handleEliminar = (id) => {
    toast('¿Eliminar categoría?', {
      description: 'Esto podría afectar a los cursos vinculados.',
      action: {
        label: 'Eliminar',
        onClick: () => {
          setCategorias(categorias.filter((cat) => cat.id !== id));
          toast.success('Categoría eliminada.');
        }
      },
      cancel: { label: 'Cancelar' }
    });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.id) {
      setCategorias(categorias.map(c => c.id === formData.id ? formData : c));
      toast.success('Categoría actualizada correctamente.');
    } else {
      const nuevoId = categorias.length > 0 ? Math.max(...categorias.map(c => c.id)) + 1 : 1;
      setCategorias([...categorias, { ...formData, id: nuevoId }]);
      toast.success('Nueva categoría creada.');
    }
    setMostrarFormulario(false);
  };

  // --- RENDERIZADO DEL FORMULARIO ---
  if (mostrarFormulario) {
    return (
      <div>
        <header style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>
            {formData.id ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
        </header>
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#0a0a0a', padding: '2rem', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
          
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Nombre de la Categoría *</label>
            <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} style={inputStyle} />
          </div>
          
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Descripción breve *</label>
            <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}></textarea>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" onClick={() => setMostrarFormulario(false)} style={btnCancelarStyle}>Cancelar</button>
            <button type="submit" style={btnGuardarStyle}>Guardar Categoría</button>
          </div>
        </form>
      </div>
    );
  }

  // --- RENDERIZADO DE LA TABLA ---
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>Gestión de Categorías</h2>
        <button style={btnGuardarStyle} onClick={handleNuevo}>
          + Nueva Categoría
        </button>
      </header>

      <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #333', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ ...thStyle, width: '80px' }}>ID</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Descripción</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '180px', whiteSpace: 'nowrap' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length > 0 ? (
              categorias.map((categoria) => (
                <tr key={categoria.id} style={{ borderBottom: '1px solid #222', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>#{categoria.id}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: '600' }}>
                    {categoria.nombre}
                  </td>
                  <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                    {categoria.descripcion}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button style={btnEditarStyle} onClick={() => handleEditar(categoria)}>
                      Editar
                    </button>
                    <button style={btnEliminarStyle} onClick={() => handleEliminar(categoria.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  No hay categorías registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Estilos
const thStyle = { padding: '1rem', color: '#d1d5db', fontWeight: '600', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '1rem', verticalAlign: 'middle' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { color: '#d1d5db', fontSize: '0.95rem' };
const inputStyle = { padding: '0.75rem', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#111', color: 'var(--text-main)', outline: 'none' };
const btnGuardarStyle = { padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' };
const btnCancelarStyle = { padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#d1d5db', border: '1px solid #4b5563', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' };
const btnEditarStyle = { padding: '0.4rem 0.8rem', backgroundColor: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.85rem' };
const btnEliminarStyle = { padding: '0.4rem 0.8rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' };