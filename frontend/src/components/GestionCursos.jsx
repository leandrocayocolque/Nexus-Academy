import React, { useState } from 'react';
import { cursosMock } from '../data/cursos';

export default function GestionCursos() {
  const [cursos, setCursos] = useState(cursosMock);
  
  // Estados de ABM
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [modoImagen, setModoImagen] = useState('url');

  const [formData, setFormData] = useState({ id: null, titulo: '', categoria: 'Tecnología', tipo: 'Curso', duracion: '', descripcion: '', imagen: '' });

  // Estados de Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10); // Por defecto en 10

  // --- LÓGICA DE PAGINACIÓN ---
  // Calculamos qué porción del arreglo mostrar según la página
  const indiceUltimoCurso = paginaActual * itemsPorPagina;
  const indicePrimerCurso = indiceUltimoCurso - itemsPorPagina;
  const cursosPaginados = cursos.slice(indicePrimerCurso, indiceUltimoCurso);
  
  const totalPaginas = Math.ceil(cursos.length / itemsPorPagina);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const urlTemporal = URL.createObjectURL(file);
      setFormData({ ...formData, imagen: urlTemporal });
    }
  };

  const handleCambioItems = (e) => {
    setItemsPorPagina(Number(e.target.value));
    setPaginaActual(1); // Si cambiás la cantidad, te devuelve a la página 1 para no quedar en una página vacía
  };

  // --- FUNCIONES DE ABM ---
  const handleNuevo = () => {
    setFormData({ id: null, titulo: '', categoria: 'Tecnología', tipo: 'Curso', duracion: '', descripcion: '', imagen: '' });
    setMostrarFormulario(true);
    
  };

  const handleEditar = (curso) => {
    setFormData(curso);
    setMostrarFormulario(true);
  };

  const handleEliminar = (id) => {
    if (window.confirm("¿Estás seguro de que querés eliminar este curso?")) {
      setCursos(cursos.filter((curso) => curso.id !== id));
      // Si borras el último ítem de una página, te retrocede a la anterior
      if (cursosPaginados.length === 1 && paginaActual > 1) {
        setPaginaActual(paginaActual - 1);
      }
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.id) {
      setCursos(cursos.map(c => c.id === formData.id ? formData : c));
    } else {
      setCursos([...cursos, { ...formData, id: Date.now() }]);
    }
    setMostrarFormulario(false);
  };

  // --- RENDERIZADO DEL FORMULARIO ---
  if (mostrarFormulario) {
    return (
      <div>
        <header style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>{formData.id ? 'Editar Curso' : 'Nuevo Curso'}</h2>
        </header>
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#0a0a0a', padding: '2rem', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Título del Curso *</label>
            <input required type="text" name="titulo" value={formData.titulo} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ ...inputGroupStyle, flex: 1 }}>
              <label style={labelStyle}>Categoría *</label>
              <select name="categoria" value={formData.categoria} onChange={handleChange} style={inputStyle}>
                <option value="Tecnología">Tecnología</option>
                <option value="Negocios">Negocios</option>
                <option value="Diseño y Comunicación">Diseño y Comunicación</option>
              </select>
            </div>
            <div style={{ ...inputGroupStyle, flex: 1 }}>
              <label style={labelStyle}>Tipo *</label>
              <select name="tipo" value={formData.tipo} onChange={handleChange} style={inputStyle}>
                <option value="Curso">Curso</option>
                <option value="Programa Ejecutivo">Programa Ejecutivo</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ ...inputGroupStyle, flex: 1 }}>
              <label style={labelStyle}>Duración *</label>
              <input required type="text" name="duracion" value={formData.duracion} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ ...inputGroupStyle, flex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>Imagen del Curso *</label>
                
                {/* Botones para alternar el modo */}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                  <label style={{ color: modoImagen === 'url' ? 'var(--primary-green)' : '#9ca3af', cursor: 'pointer' }}>
                    <input type="radio" checked={modoImagen === 'url'} onChange={() => setModoImagen('url')} style={{ display: 'none' }} />
                    ◉ Usar URL
                  </label>
                  <label style={{ color: modoImagen === 'archivo' ? 'var(--primary-green)' : '#9ca3af', cursor: 'pointer' }}>
                    <input type="radio" checked={modoImagen === 'archivo'} onChange={() => setModoImagen('archivo')} style={{ display: 'none' }} />
                    ◉ Subir de PC
                  </label>
                </div>
              </div>

              {/* Renderizado condicional del input */}
              {modoImagen === 'url' ? (
                <input 
                  type="url" 
                  name="imagen" 
                  // Si el valor actual es un archivo local (blob), mostramos el input vacío para no confundir
                  value={formData.imagen.startsWith('blob:') ? '' : formData.imagen} 
                  onChange={handleChange} 
                  style={inputStyle} 
                  placeholder="https://ejemplo.com/imagen.jpg" 
                />
              ) : (
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange} 
                  style={{ ...inputStyle, padding: '0.6rem', color: '#9ca3af' }} 
                />
              )}
            </div>
          </div>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Descripción *</label>
            <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}></textarea>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" onClick={() => setMostrarFormulario(false)} style={btnCancelarStyle}>Cancelar</button>
            <button type="submit" style={btnGuardarStyle}>Guardar Curso</button>
          </div>
        </form>
      </div>
    );
  }

  // --- RENDERIZADO DE LA TABLA Y PAGINACIÓN ---
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>Gestión de Cursos</h2>
        <button onClick={handleNuevo} style={btnGuardarStyle}>+ Nuevo Curso</button>
      </header>

      <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #333', overflow: 'hidden' }}>
        
        {/* Controles superiores de Paginación */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Mostrar:</span>
            <select value={itemsPorPagina} onChange={handleCambioItems} style={{ ...inputStyle, padding: '0.4rem', width: 'auto' }}>
              {/* Agregué el valor 2 solo para que puedas probar que funciona con los datos mock actuales */}
              <option value={2}>2</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
            <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>cursos</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={thStyle}>Curso</th>
                <th style={thStyle}>Categoría</th>
                <th style={thStyle}>Tipo</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursosPaginados.length > 0 ? (
                // ACA USAMOS cursosPaginados EN LUGAR DEL ARREGLO COMPLETO
                cursosPaginados.map((curso) => (
                  <tr key={curso.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={curso.imagen} alt={curso.titulo} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
                      <div>
                        <span style={{ color: 'var(--text-main)', fontWeight: '600', display: 'block' }}>{curso.titulo}</span>
                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>ID: {curso.id}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#9ca3af' }}>{curso.categoria}</td>
                    <td style={{ padding: '1rem', color: '#9ca3af' }}>{curso.tipo}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => handleEditar(curso)} style={btnEditarStyle}>Editar</button>
                      <button onClick={() => handleEliminar(curso.id)} style={btnEliminarStyle}>Eliminar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                    No hay cursos en esta página.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Controles inferiores de Paginación (Botones Anterior / Siguiente) */}
        {totalPaginas > 0 && (
          <div style={{ padding: '1rem', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Mostrando página {paginaActual} de {totalPaginas} (Total: {cursos.length} cursos)
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

      </div>
    </div>
  );
}

// Estilos base
const thStyle = { padding: '1rem', color: '#d1d5db', fontWeight: '600', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { color: '#d1d5db', fontSize: '0.95rem' };
const inputStyle = { padding: '0.75rem', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#111', color: 'var(--text-main)', outline: 'none' };
const btnGuardarStyle = { padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' };
const btnCancelarStyle = { padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#d1d5db', border: '1px solid #4b5563', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' };
const btnEditarStyle = { padding: '0.4rem 0.8rem', backgroundColor: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.85rem' };
const btnEliminarStyle = { padding: '0.4rem 0.8rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' };
const btnPaginacionStyle = { padding: '0.5rem 1rem', backgroundColor: 'transparent', border: '1px solid #4b5563', borderRadius: '4px', color: 'var(--text-main)' };