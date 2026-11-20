import React, { useEffect, useRef, useState } from 'react';
import { useSesion } from '../auth/SesionContext';
import { estadosPromocion, formularioPromocion, mutarYRecargar } from '../api/academia';

const fechaVisible = valor => valor ? new Date(valor).toLocaleString('es-AR') : 'Sin límite';

export default function GestionPromociones() {
  const { academia } = useSesion();
  const [promociones, setPromociones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorCursos, setErrorCursos] = useState('');
  const [detalles, setDetalles] = useState([]);
  const [aviso, setAviso] = useState('');
  const [pendiente, setPendiente] = useState(false);
  const [desactualizada, setDesactualizada] = useState(false);
  const [intento, setIntento] = useState(0);
  const [formulario, setFormulario] = useState(null);
  const [eliminar, setEliminar] = useState(null);
  const vida = useRef(null);
  const ocupado = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    vida.current = controller;
    const opciones = { signal: controller.signal };
    const lista = academia.cargarTodasPromocionesAdmin(opciones).then(datos => {
      if (!controller.signal.aborted) { setPromociones(datos); setDesactualizada(false); }
    }).catch(fallo => {
      if (!controller.signal.aborted) { setError(fallo.message); setDesactualizada(true); }
    });
    const asociados = academia.cargarTodosCursosAdmin(opciones).then(datos => {
      if (!controller.signal.aborted) setCursos(datos);
    }).catch(fallo => {
      if (!controller.signal.aborted) setErrorCursos(fallo.message);
    });
    Promise.all([lista, asociados]).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });
    return () => controller.abort();
  }, [academia, intento]);

  const recargar = () => {
    setError(''); setErrorCursos(''); setDetalles([]); setCargando(true);
    setIntento(i => i + 1);
  };
  const abrir = promocion => {
    setFormulario(formularioPromocion(promocion)); setEliminar(null);
    setError(''); setDetalles([]); setAviso('');
  };
  const cambiar = e => setFormulario(actual => ({ ...actual, [e.target.name]: e.target.value }));
  const ejecutar = async mutar => {
    const controller = vida.current;
    if (ocupado.current || !controller || controller.signal.aborted) return;
    ocupado.current = true; setPendiente(true); setError(''); setDetalles([]); setAviso('');
    try {
      const { datos, errorActualizacion } = await mutarYRecargar(
        () => mutar({ signal: controller.signal }),
        () => academia.cargarTodasPromocionesAdmin({ signal: controller.signal }),
      );
      if (controller.signal.aborted) return;
      setFormulario(null); setEliminar(null);
      setAviso('El cambio se guardó correctamente.');
      if (errorActualizacion) {
        setDesactualizada(true);
        setError(`El cambio se guardó, pero no se pudo actualizar la lista. ${errorActualizacion.message}`);
      } else { setPromociones(datos); setDesactualizada(false); }
    } catch (fallo) {
      if (!controller.signal.aborted) {
        setError(fallo.message);
        setDetalles(Array.isArray(fallo.detalles) ? fallo.detalles
          : Object.entries(fallo.detalles ?? {}).map(([campo, mensaje]) => ({ campo, mensaje })));
      }
    } finally {
      ocupado.current = false;
      if (!controller.signal.aborted) setPendiente(false);
    }
  };
  const guardar = e => {
    e.preventDefault();
    ejecutar(opciones => formulario.id
      ? academia.actualizarPromocionAdmin(formulario.id, formulario, opciones)
      : academia.crearPromocionAdmin(formulario, opciones));
  };
  const bloqueada = pendiente || cargando || desactualizada;

  return (
    <div className="admin-promotions">
      <header className="admin-page-header">
        <h2>Gestión de Promociones</h2>
        {!formulario && <button disabled={bloqueada} onClick={() => abrir()}>Nueva promoción</button>}
      </header>
      {aviso && <p role="status">{aviso}</p>}
      {pendiente && <p role="status">Guardando cambios...</p>}
      {cargando && <p role="status">Cargando promociones y cursos...</p>}
      {error && <div role="alert"><p>{error}</p>
        {detalles.length > 0 && <ul>{detalles.map((detalle, i) => <li key={i}>{detalle.campo}: {String(detalle.mensaje)}</li>)}</ul>}
        {desactualizada && <button disabled={pendiente || cargando} onClick={recargar}>Actualizar lista</button>}
      </div>}
      {errorCursos && <p role="alert">No se pudieron cargar los cursos asociados. {errorCursos} Podés conservar la asociación actual o elegir una promoción general. <button disabled={pendiente || cargando} onClick={recargar}>Reintentar carga</button></p>}

      {formulario ? (
        <form className="admin-form-panel admin-promotion-form" onSubmit={guardar}>
          <h3>{formulario.id ? 'Editar promoción' : 'Nueva promoción'}</h3>
          <fieldset disabled={bloqueada}>
            <legend>Datos de la promoción</legend>
            <label htmlFor="promo-titulo">Título *</label>
            <input id="promo-titulo" name="titulo" required minLength={3} maxLength={180} value={formulario.titulo} onChange={cambiar} />
            <label htmlFor="promo-descripcion">Descripción (texto plano)</label>
            <textarea id="promo-descripcion" name="descripcion" rows={4} maxLength={2000} value={formulario.descripcion} onChange={cambiar} />
            <label htmlFor="promo-descuento">Descuento (%) *</label>
            <input id="promo-descuento" name="porcentajeDescuento" type="number" required min={0} max={100} step={1} value={formulario.porcentajeDescuento} onChange={cambiar} />
            <label htmlFor="promo-estado">Estado</label>
            <select id="promo-estado" name="estado" value={formulario.estado} onChange={cambiar}>
              {Object.entries(estadosPromocion).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
            <label htmlFor="promo-curso">Curso asociado (opcional)</label>
            <select id="promo-curso" name="cursoId" value={formulario.cursoId} onChange={cambiar}>
              <option value="">General, sin curso asociado</option>
              {formulario.cursoId && !cursos.some(c => c.id === formulario.cursoId) && <option value={formulario.cursoId}>Asociación actual ({formulario.cursoId})</option>}
              {cursos.map(curso => <option key={curso.id} value={curso.id}>{curso.titulo}</option>)}
            </select>
            <p id="promo-fechas-ayuda">Horarios en la zona local de tu navegador. Se guardan como instantes UTC. Dejá la fecha vacía para no establecer ese límite; la fecha final es inclusiva.</p>
            <label htmlFor="promo-inicio">Inicio (opcional)</label>
            <input id="promo-inicio" name="fechaInicio" type="datetime-local" step="0.001" aria-describedby="promo-fechas-ayuda" value={formulario.fechaInicio} onChange={cambiar} />
            <label htmlFor="promo-fin">Fin (opcional)</label>
            <input id="promo-fin" name="fechaFin" type="datetime-local" step="0.001" aria-describedby="promo-fechas-ayuda" value={formulario.fechaFin} onChange={cambiar} />
          </fieldset>
          <div className="admin-actions">
            <button type="button" disabled={pendiente} onClick={() => { setFormulario(null); setError(''); setDetalles([]); }}>Cancelar</button>
            <button type="submit" disabled={bloqueada}>Guardar promoción</button>
          </div>
        </form>
      ) : (
        <>
          {eliminar && <section className="admin-promotion-confirm" role="group" aria-labelledby="promo-confirmar">
            <h3 id="promo-confirmar">¿Eliminar «{eliminar.titulo}»?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div className="admin-actions">
              <button disabled={pendiente} onClick={() => setEliminar(null)}>Cancelar</button>
              <button disabled={bloqueada} onClick={() => ejecutar(opciones => academia.eliminarPromocionAdmin(eliminar.id, opciones))}>Confirmar eliminación</button>
            </div>
          </section>}
          {!cargando && !desactualizada && promociones.length === 0 && <p>No hay promociones registradas.</p>}
          {!cargando && !desactualizada && <ul className="admin-promotion-list">
            {promociones.map(promocion => <li key={promocion.id}>
              <h3>{promocion.titulo}</h3>
              <p className="admin-promotion-description">{promocion.descripcion}</p>
              <p>{promocion.porcentajeDescuento}% de descuento · {estadosPromocion[promocion.estado] ?? promocion.estado} · {promocion.vigente ? 'Vigente' : 'No vigente'}</p>
              <p>Curso: {promocion.curso?.titulo ?? 'General'}</p>
              <p>Inicio: {fechaVisible(promocion.fechaInicio)}<br />Fin: {fechaVisible(promocion.fechaFin)} (hora local)</p>
              <div className="admin-actions">
                <button disabled={bloqueada} aria-label={`Editar ${promocion.titulo}`} onClick={() => abrir(promocion)}>Editar</button>
                <button disabled={bloqueada} aria-label={`Eliminar ${promocion.titulo}`} onClick={() => { setEliminar(promocion); setError(''); setDetalles([]); }}>Eliminar</button>
              </div>
            </li>)}
          </ul>}
        </>
      )}
    </div>
  );
}
