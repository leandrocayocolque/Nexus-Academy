import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSesion } from '../auth/SesionContext';
import { mutarYRecargar } from '../api/academia';

export default function GestionCategorias() {
  const { academia } = useSesion();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const vida = useRef(null);
  const ocupado = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    vida.current = controller;
    academia.cargarTodasCategoriasAdmin({ signal: controller.signal }).then(datos => {
      if (!controller.signal.aborted) setCategorias(datos);
    }).catch(fallo => {
      if (!controller.signal.aborted) setError(`No se pudieron cargar las categorías. ${fallo.message}`);
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });
    return () => controller.abort();
  }, [academia, intento]);

  const recargar = () => {
    setError('');
    setCargando(true);
    setIntento(i => i + 1);
  };

  const ejecutar = async (mutar, mensaje, alConfirmar) => {
    const controller = vida.current;
    if (ocupado.current || controller?.signal.aborted || !controller) return;
    ocupado.current = true;
    setPendiente(true);
    setError('');
    try {
      const { datos, errorActualizacion } = await mutarYRecargar(
        () => mutar({ signal: controller.signal }),
        () => academia.cargarTodasCategoriasAdmin({ signal: controller.signal }),
      );
      if (controller.signal.aborted) return;
      alConfirmar?.();
      if (errorActualizacion) {
        setError(`El cambio se guardó, pero no se pudo actualizar la lista. ${errorActualizacion.message}`);
        toast.warning('El cambio se guardó. Actualizá la lista antes de continuar.');
      } else {
        setCategorias(datos);
        toast.success(mensaje);
      }
    } catch (fallo) {
      if (!controller.signal.aborted) {
        setError(fallo.message);
        toast.error(fallo.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        ocupado.current = false;
        setPendiente(false);
      }
    }
  };

  // Estados del Formulario ABM
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({ id: null, nombre: '', descripcion: '', activa: true });

  const handleNuevo = () => {
    if (ocupado.current) return;
    setFormData({ id: null, nombre: '', descripcion: '', activa: true });
    setMostrarFormulario(true);
  };

  const handleEditar = (categoria) => {
    if (ocupado.current) return;
    setFormData({ ...categoria, descripcion: categoria.descripcion ?? '' });
    setMostrarFormulario(true);
  };

  const handleEliminar = (id) => {
    if (ocupado.current) return;
    const controller = vida.current;
    toast('¿Eliminar categoría?', {
      description: 'Esto podría afectar a los cursos vinculados.',
      action: {
        label: 'Eliminar',
        onClick: () => {
          if (controller !== vida.current || controller.signal.aborted) return;
          return ejecutar(opciones => academia.eliminarCategoriaAdmin(id, opciones), 'Categoría eliminada.');
        }
      },
      cancel: { label: 'Cancelar' }
    });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    ejecutar(
      opciones => formData.id
        ? academia.actualizarCategoriaAdmin(formData.id, formData, opciones)
        : academia.crearCategoriaAdmin(formData, opciones),
      formData.id ? 'Categoría actualizada correctamente.' : 'Nueva categoría creada.',
      () => setMostrarFormulario(false),
    );
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
        {error && <p role="alert">{error}</p>}
        {pendiente && <p role="status">Guardando cambios...</p>}
        <form className="admin-form-panel" onSubmit={handleSubmit} style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
          
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Nombre de la Categoría *</label>
            <input disabled={pendiente} required minLength={2} maxLength={120} type="text" name="nombre" value={formData.nombre} onChange={handleChange} style={inputStyle} />
          </div>
          
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Descripción breve</label>
            <textarea disabled={pendiente} maxLength={1000} name="descripcion" value={formData.descripcion} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}></textarea>
          </div>
          
          <label style={labelStyle}><input type="checkbox" name="activa" checked={formData.activa} disabled={pendiente} onChange={handleChange} /> Categoría activa</label>
          <div className="admin-actions" style={{ marginTop: '1rem' }}>
            <button disabled={pendiente} type="button" onClick={() => setMostrarFormulario(false)} style={btnCancelarStyle}>Cancelar</button>
            <button disabled={pendiente} type="submit" style={btnGuardarStyle}>Guardar Categoría</button>
          </div>
        </form>
      </div>
    );
  }

  // --- RENDERIZADO DE LA TABLA ---
  return (
    <div>
      <header className="admin-page-header">
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>Gestión de Categorías</h2>
        <button disabled={pendiente || cargando || !!error} style={btnGuardarStyle} onClick={handleNuevo}>
          + Nueva Categoría
        </button>
      </header>

      {error && <p role="alert">{error} <button disabled={pendiente} onClick={recargar}>Actualizar lista</button></p>}
      {pendiente && <p role="status">Guardando cambios...</p>}
      {cargando && <p role="status">Cargando categorías...</p>}
      <div className="admin-table-scroll" role="region" aria-label="Lista de categorías" tabIndex={0} style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #333' }}>
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
                    {categoria.nombre}{!categoria.activa && ' (Inactiva)'}
                  </td>
                  <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                    {categoria.descripcion}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button disabled={pendiente || cargando || !!error} style={btnEditarStyle} onClick={() => handleEditar(categoria)}>
                      Editar
                    </button>
                    <button disabled={pendiente || cargando || !!error} style={btnEliminarStyle} onClick={() => handleEliminar(categoria.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  {cargando ? 'Cargando categorías...' : error ? 'No se pudo confirmar la lista de categorías.' : 'No hay categorías registradas.'}
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