import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSesion } from '../auth/SesionContext';
import { formularioCurso, guardarCursoConImagen, modalidadesCurso, nivelesCurso, validarImagenCurso } from '../api/academia';

export default function GestionCursos() {
  const { academia } = useSesion();
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState('');
  const [detalles, setDetalles] = useState({});
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState(formularioCurso);
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState('');
  const [guardado, setGuardado] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const vida = useRef(null);
  const ocupado = useRef(false);
  const aceptado = useRef(null);
  const urlPreview = useRef('');

  useEffect(() => {
    const controller = new AbortController();
    vida.current = controller;
    Promise.all([
      academia.cargarTodosCursosAdmin({ signal: controller.signal }),
      academia.cargarTodasCategoriasAdmin({ signal: controller.signal }),
    ]).then(([lista, opciones]) => {
      if (!controller.signal.aborted) { setCursos(lista); setCategorias(opciones); }
    }).catch(fallo => {
      if (!controller.signal.aborted) setError(`No se pudieron cargar los cursos y categorías. ${fallo.message}`);
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });
    return () => {
      controller.abort();
      URL.revokeObjectURL(urlPreview.current);
    };
  }, [academia]);

  const seleccionarArchivo = (file) => {
    URL.revokeObjectURL(urlPreview.current);
    urlPreview.current = file ? URL.createObjectURL(file) : '';
    setPreview(urlPreview.current);
    setArchivo(file);
  };

  const actualizarLista = async (signal) => {
    const lista = await academia.cargarTodosCursosAdmin({ signal });
    if (!signal.aborted) {
      setCursos(lista);
      setPaginaActual(p => Math.min(p, Math.max(1, Math.ceil(lista.length / itemsPorPagina))));
    }
  };

  const recargar = async () => {
    const signal = vida.current?.signal;
    if (!signal || signal.aborted || ocupado.current) return;
    ocupado.current = true;
    setCargando(true);
    setError('');
    try {
      const [lista, opciones] = await Promise.all([
        academia.cargarTodosCursosAdmin({ signal }), academia.cargarTodasCategoriasAdmin({ signal }),
      ]);
      if (!signal.aborted) { setCursos(lista); setCategorias(opciones); setPaginaActual(1); }
    } catch (fallo) {
      if (!signal.aborted) setError(fallo.message);
    } finally {
      if (!signal.aborted) { ocupado.current = false; setCargando(false); }
    }
  };

  const abrir = (curso) => {
    if (ocupado.current) return;
    setFormData(formularioCurso(curso));
    aceptado.current = null;
    setGuardado(null);
    seleccionarArchivo(null);
    setDetalles({});
    setError('');
    setMostrarFormulario(true);
  };
  const cerrar = () => {
    if (ocupado.current) return;
    setMostrarFormulario(false);
    seleccionarArchivo(null);
  };
  const handleChange = (e) => setFormData(prev => ({ ...prev,
    [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) { seleccionarArchivo(null); return; }
    try { validarImagenCurso(file); seleccionarArchivo(file); setError(''); }
    catch (fallo) { e.target.value = ''; seleccionarArchivo(null); setError(fallo.message); }
  };
  const mostrarFallo = (fallo) => {
    setError(fallo.message);
    setDetalles(Array.isArray(fallo.detalles)
      ? Object.fromEntries(fallo.detalles.map(d => [d.campo, d.mensaje]))
      : fallo.detalles ?? {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const signal = vida.current?.signal;
    if (!signal || signal.aborted || ocupado.current) return;
    ocupado.current = true;
    setPendiente(true);
    setError('');
    setDetalles({});
    try {
      const resultado = await guardarCursoConImagen(academia, {
        id: formData.id, datos: formData, archivo, guardado: aceptado.current, signal,
        onGuardado: curso => {
          aceptado.current = curso;
          if (!signal.aborted) { setGuardado(curso); setFormData(prev => ({ ...prev, id: curso.id })); }
        },
      });
      if (signal.aborted) return;
      const parcial = resultado.errorImagen;
      if (parcial) {
        setError(`El curso ${resultado.guardado.id} se guardó, pero la imagen no se pudo confirmar. ${parcial.message} Reintentá solo la imagen o cerrá.`);
      } else {
        setMostrarFormulario(false);
        seleccionarArchivo(null);
        toast.success('Curso guardado correctamente.');
      }
      try { await actualizarLista(signal); }
      catch (fallo) {
        if (!signal.aborted) setError(prev => `${prev ? `${prev} ` : ''}El curso se guardó, pero no se pudo actualizar la lista. ${fallo.message}`);
      }
    } catch (fallo) {
      if (!signal.aborted) mostrarFallo(fallo);
    } finally {
      if (!signal.aborted) { ocupado.current = false; setPendiente(false); }
    }
  };

  const handleEliminar = (id) => {
    if (ocupado.current) return;
    const controller = vida.current;
    toast('¿Eliminar curso?', {
      description: 'Se borrará del catálogo público y se eliminarán sus imágenes.',
      action: { label: 'Eliminar', onClick: async () => {
        if (controller !== vida.current || controller.signal.aborted || ocupado.current) return;
        ocupado.current = true;
        setPendiente(true);
        setError('');
        try {
          await academia.eliminarCursoAdmin(id, { signal: controller.signal });
          if (controller.signal.aborted) return;
          toast.success('El curso fue eliminado.');
          try { await actualizarLista(controller.signal); }
          catch (fallo) {
            if (!controller.signal.aborted) setError(`El curso se eliminó, pero no se pudo actualizar la lista. ${fallo.message}`);
          }
        } catch (fallo) {
          if (!controller.signal.aborted) setError(fallo.message);
        } finally {
          if (!controller.signal.aborted) { ocupado.current = false; setPendiente(false); }
        }
      } },
      cancel: { label: 'Cancelar' },
    });
  };

  const campo = (nombre, etiqueta, opciones = {}) => (
    <label style={inputGroupStyle}>
      <span style={labelStyle}>{etiqueta}</span>
      <input name={nombre} value={formData[nombre]} onChange={handleChange} style={inputStyle} required {...opciones} />
      {detalles[nombre] && <span role="alert">{detalles[nombre]}</span>}
    </label>
  );
  const seleccion = (nombre, etiqueta, opciones) => (
    <label style={inputGroupStyle}>
      <span style={labelStyle}>{etiqueta}</span>
      <select required name={nombre} value={formData[nombre]} onChange={handleChange} style={inputStyle}>
        <option value="">Seleccioná una opción</option>
        {opciones.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
      </select>
      {detalles[nombre] && <span role="alert">{detalles[nombre]}</span>}
    </label>
  );
  const bloqueado = pendiente || cargando || !!error;
  const totalPaginas = Math.max(1, Math.ceil(cursos.length / itemsPorPagina));
  const pagina = Math.min(paginaActual, totalPaginas);
  const cursosPaginados = cursos.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina);

  if (mostrarFormulario) return (
    <div>
      <h2 style={{ color: 'var(--text-main)', fontSize: '2rem' }}>{formData.id ? 'Editar Curso' : 'Nuevo Curso'}</h2>
      {error && <p role="alert">{error}</p>}
      {pendiente && <p role="status">Guardando cambios...</p>}
      {guardado && <p role="status">Curso guardado (ID: {guardado.id}). Los campos ya están confirmados; solo se reintentará la imagen.</p>}
      <form onSubmit={handleSubmit} style={panelStyle}>
        <fieldset disabled={pendiente || !!guardado} style={{ border: 0, padding: 0, display: 'grid', gap: '1.5rem' }}>
          {campo('titulo', 'Título del Curso *', { minLength: 3, maxLength: 180 })}
          {seleccion('categoriaId', 'Categoría *', [
            ...categorias.map(c => [c.id, `${c.nombre}${c.activa ? ' (Activa)' : ' (Inactiva)'}`]),
            ...(formData.categoriaId && !categorias.some(c => c.id === formData.categoriaId) ? [[formData.categoriaId, 'Categoría actual no disponible']] : []),
          ])}
          {campo('duracion', 'Duración *', { maxLength: 100 })}
          {campo('cuposDisponibles', 'Cupos disponibles *', { type: 'number', min: 0, max: 1000000, step: 1 })}
          {campo('fechaInicio', 'Fecha y hora de inicio (hora local) *', { type: 'datetime-local', step: '0.001' })}
          {campo('precio', 'Precio (sin símbolo de moneda) *', { inputMode: 'decimal', pattern: '[0-9]{1,8}([.][0-9]{1,2})?', placeholder: '0.00' })}
          {seleccion('nivel', 'Nivel *', Object.entries(nivelesCurso))}
          {seleccion('modalidad', 'Modalidad *', Object.entries(modalidadesCurso))}
          <label style={inputGroupStyle}><span style={labelStyle}>Descripción</span>
            <textarea name="descripcion" value={formData.descripcion} maxLength={5000} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px' }} />
            {detalles.descripcion && <span role="alert">{detalles.descripcion}</span>}
          </label>
          <label style={labelStyle}><input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} /> Curso activo</label>
          <label style={labelStyle}><input type="checkbox" name="destacado" checked={formData.destacado} onChange={handleChange} /> Curso destacado</label>
        </fieldset>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {formData.imagenes.map(img => <img key={img.id ?? img.url} src={img.url} alt={img.textoAlternativo ?? formData.titulo} style={imagenStyle} />)}
        </div>
        <label style={inputGroupStyle}><span style={labelStyle}>Agregar imagen (JPEG, PNG o WebP; máximo 5 MiB)</span>
          <input disabled={pendiente} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={inputStyle} />
        </label>
        <p style={labelStyle}>Las imágenes existentes se conservan. La nueva imagen se agrega después de guardar el curso.</p>
        {archivo && preview && <img src={preview} alt="Vista previa de la imagen seleccionada" style={imagenStyle} />}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button disabled={pendiente} type="button" onClick={cerrar} style={btnCancelarStyle}>{guardado ? 'Cerrar (curso guardado)' : 'Cancelar'}</button>
          <button disabled={pendiente || (!!guardado && !archivo)} type="submit" style={btnGuardarStyle}>{guardado ? 'Reintentar solo imagen' : 'Guardar Curso'}</button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>Gestión de Cursos</h2>
        <button disabled={bloqueado} onClick={() => abrir()} style={btnGuardarStyle}>+ Nuevo Curso</button>
      </header>
      {error && <p role="alert">{error} <button disabled={pendiente || cargando} onClick={recargar}>Actualizar lista</button></p>}
      {cargando && <p role="status">Cargando cursos y categorías...</p>}
      {pendiente && <p role="status">Guardando cambios...</p>}
      <div style={{ ...panelStyle, maxWidth: 'none', padding: 0, overflow: 'hidden' }}>
        <label style={{ ...labelStyle, padding: '1rem' }}>Mostrar: <select value={itemsPorPagina} onChange={e => { setItemsPorPagina(Number(e.target.value)); setPaginaActual(1); }} style={inputStyle}>
          {[2, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
        </select> cursos</label>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead><tr>{['Curso', 'Categoría', 'Estado', 'Acciones'].map(t => <th key={t} style={thStyle}>{t}</th>)}</tr></thead>
            <tbody>
              {cursosPaginados.map(curso => <tr key={curso.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={tdStyle}>
                  {curso.imagenes?.[0]?.url && <img src={curso.imagenes[0].url} alt="" style={{ ...imagenStyle, width: '48px', height: '48px', marginRight: '1rem' }} />}
                  <strong>{curso.titulo}</strong><br /><small>ID: {curso.id}</small>
                </td>
                <td style={tdStyle}>{categorias.find(c => c.id === curso.categoriaId)?.nombre ?? curso.categoria?.nombre ?? 'Sin categoría disponible'}</td>
                <td style={tdStyle}>{curso.activo ? 'Activo' : 'Inactivo'}{curso.destacado && ' · Destacado'}</td>
                <td style={tdStyle}>
                  <button disabled={bloqueado} onClick={() => abrir(curso)} style={btnEditarStyle}>Editar</button>
                  <button disabled={bloqueado} onClick={() => handleEliminar(curso.id)} style={btnEliminarStyle}>Eliminar</button>
                </td>
              </tr>)}
              {!cursosPaginados.length && <tr><td colSpan={4} style={tdStyle}>{cargando ? 'Cargando...' : error ? 'No se pudo confirmar la lista.' : 'No hay cursos registrados.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span style={labelStyle}>Mostrando página {pagina} de {totalPaginas} (Total: {cursos.length} cursos)</span>
          <div>
            <button disabled={pagina === 1} onClick={() => setPaginaActual(pagina - 1)} style={btnCancelarStyle}>Anterior</button>
            <button disabled={pagina === totalPaginas} onClick={() => setPaginaActual(pagina + 1)} style={btnCancelarStyle}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const panelStyle = { backgroundColor: '#0a0a0a', padding: '2rem', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' };
const thStyle = { padding: '1rem', color: '#d1d5db', fontWeight: '600', fontSize: '0.9rem', textTransform: 'uppercase' };
const tdStyle = { padding: '1rem', color: '#9ca3af' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { color: '#d1d5db', fontSize: '0.95rem' };
const inputStyle = { padding: '0.75rem', borderRadius: '4px', border: '1px solid #4b5563', backgroundColor: '#111', color: 'var(--text-main)', outline: 'none' };
const imagenStyle = { width: '140px', height: '90px', borderRadius: '4px', objectFit: 'cover' };
const btnGuardarStyle = { padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' };
const btnCancelarStyle = { padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#d1d5db', border: '1px solid #4b5563', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' };
const btnEditarStyle = { padding: '0.4rem 0.8rem', backgroundColor: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' };
const btnEliminarStyle = { padding: '0.4rem 0.8rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer' };
