import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSesion } from '../auth/SesionContext';
import { mutarYRecargar } from '../api/academia';
import { referenciaId } from '../utils/presentacion';

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
        <form className="admin-form-panel admin-stacked-form" onSubmit={handleSubmit}>
          
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
      <div className="admin-table-scroll" role="region" aria-label="Lista de categorías" tabIndex={0}>
        <table className="admin-categories-table">
          <colgroup>
            <col className="category-reference-column" />
            <col className="category-name-column" />
            <col />
            <col className="category-actions-column" />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <th scope="col" style={thStyle}>Referencia</th>
              <th scope="col" style={thStyle}>Nombre</th>
              <th scope="col" style={thStyle}>Descripción</th>
              <th scope="col" className="category-actions-heading" style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length > 0 ? (
              categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td>
                    <span className="category-reference" title={String(categoria.id ?? 'Sin referencia')} aria-label={`Referencia completa: ${categoria.id ?? 'Sin referencia'}`}>
                      {referenciaId(categoria.id)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: '600' }}>
                    <span className="category-preview category-name-preview" title={`${categoria.nombre}${!categoria.activa ? ' (Inactiva)' : ''}`}>
                      {categoria.nombre}{!categoria.activa && ' (Inactiva)'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                    <span className="category-preview category-description-preview" title={categoria.descripcion || 'Sin descripción'}>
                      {categoria.descripcion || 'Sin descripción'}
                    </span>
                  </td>
                  <td>
                    <div className="category-row-actions">
                      <button disabled={pendiente || cargando || !!error} style={btnEditarStyle} onClick={() => handleEditar(categoria)}>
                        Editar
                      </button>
                      <button disabled={pendiente || cargando || !!error} style={btnEliminarStyle} onClick={() => handleEliminar(categoria.id)}>
                        Eliminar
                      </button>
                    </div>
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

const thStyle = { padding: 'var(--space-3)', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.95rem' };
const inputStyle = { padding: 'var(--space-2)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-control)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' };
const btnGuardarStyle = { padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary-green)', color: 'var(--text-on-primary)', border: '1px solid transparent', borderRadius: 'var(--radius-control)', fontWeight: '600', cursor: 'pointer' };
const btnCancelarStyle = { padding: '0.75rem 1.5rem', backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-control)', borderRadius: 'var(--radius-control)', fontWeight: '600', cursor: 'pointer' };
const btnEditarStyle = { padding: '0.6rem 0.9rem', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-control)', borderRadius: 'var(--radius-control)', cursor: 'pointer' };
const btnEliminarStyle = { padding: '0.6rem 0.9rem', backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid #a14b50', borderRadius: 'var(--radius-control)', cursor: 'pointer' };