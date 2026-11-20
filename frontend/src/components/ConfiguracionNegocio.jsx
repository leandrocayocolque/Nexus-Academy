import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { crearApiAcademia } from '../api/academia.js';
import { useSesion } from '../auth/SesionContext.js';
import { useNegocio } from './NegocioContext.jsx';

const objetoAFilas = (obj) => {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([clave, valor]) => ({ clave, valor: String(valor ?? '') }));
};

const filasAObjeto = (filas) => {
  const limpio = {};
  for (const { clave, valor } of filas) {
    const k = clave.trim();
    const v = valor.trim();
    if (k && v) limpio[k] = v;
  }
  return Object.keys(limpio).length > 0 ? limpio : null;
};

export default function ConfiguracionNegocio() {
  const { solicitar } = useSesion();
  const { negocio, setNegocio, cargando } = useNegocio();
  const apiAdmin = useMemo(() => crearApiAcademia(solicitar), [solicitar]);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    correo: ''
  });
  const [redes, setRedes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!negocio) return;
    setForm({
      nombre: negocio.nombre || '',
      descripcion: negocio.descripcion || '',
      direccion: negocio.direccion || '',
      telefono: negocio.telefono || '',
      correo: negocio.correo || ''
    });
    setRedes(objetoAFilas(negocio.enlacesSociales));
    setHorarios(objetoAFilas(negocio.horariosAtencion));
  }, [negocio]);

  const actualizarFila = (lista, setLista, idx, campo, valor) => {
    setLista(lista.map((item, i) => (i === idx ? { ...item, [campo]: valor } : item)));
  };

  const eliminarFila = (lista, setLista, idx) => {
    setLista(lista.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error('El nombre del comercio es obligatorio.');
      return;
    }

    // Validación rápida de filas incompletas antes de llamar al servidor
    if (redes.some((r) => (r.clave.trim() && !r.valor.trim()) || (!r.clave.trim() && r.valor.trim()))) {
      toast.error('Completá tanto el nombre de la red social como su URL, o eliminá la fila vacía.');
      return;
    }
    if (horarios.some((h) => (h.clave.trim() && !h.valor.trim()) || (!h.clave.trim() && h.valor.trim()))) {
      toast.error('Completá tanto los días como el horario de atención, o eliminá la fila vacía.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        direccion: form.direccion.trim() || null,
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
        enlacesSociales: filasAObjeto(redes),
        horariosAtencion: filasAObjeto(horarios)
      };

      const actualizado = await apiAdmin.actualizarNegocioAdmin(payload);
      setNegocio(actualizado);
      toast.success('Información de la página actualizada correctamente.');
    } catch (error) {
      toast.error(error?.message || 'Error al guardar la información del negocio.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando && !negocio) {
    return <p style={{ color: '#9ca3af' }}>Cargando información del comercio...</p>;
  }

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>Información del Comercio</h2>
        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
          Editá los datos públicos de la academia que ven los visitantes en el sitio.
        </p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem', maxWidth: '800px' }}>
        {/* Bloque 1: Identidad y Descripción */}
        <section style={cardStyle}>
          <h3 style={{ margin: 0, color: 'var(--primary-green)' }}>Identidad del Comercio</h3>

          <div style={groupStyle}>
            <label style={labelStyle}>Nombre del comercio *</label>
            <input
              type="text"
              required
              maxLength={150}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Descripción</label>
            <textarea
              rows={4}
              maxLength={2000}
              placeholder="Breve presentación de la academia..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </section>

        {/* Bloque 2: Datos de Contacto */}
        <section style={cardStyle}>
          <h3 style={{ margin: 0, color: 'var(--primary-green)' }}>Ubicación y Contacto</h3>

          <div style={groupStyle}>
            <label style={labelStyle}>Dirección</label>
            <input
              type="text"
              maxLength={300}
              placeholder="Ej: Av. Corrientes 1234, CABA"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ ...groupStyle, flex: 1, minWidth: '220px' }}>
              <label style={labelStyle}>Teléfono</label>
              <input
                type="text"
                maxLength={50}
                placeholder="Ej: +54 11 4567-8900"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ ...groupStyle, flex: 1, minWidth: '220px' }}>
              <label style={labelStyle}>Correo público de contacto</label>
              <input
                type="email"
                placeholder="contacto@nexusacademy.com"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        {/* Bloque 3: Horarios de Atención */}
        <section style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-green)' }}>Horarios de Atención</h3>
            <button
              type="button"
              onClick={() => setHorarios([...horarios, { clave: '', valor: '' }])}
              disabled={horarios.length >= 20}
              style={btnAddStyle}
            >
              + Agregar horario
            </button>
          </div>

          {horarios.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>
              No hay horarios cargados. Hacé clic en "+ Agregar horario".
            </p>
          ) : (
            horarios.map((h, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Días (ej: Lunes a Viernes)"
                  maxLength={100}
                  value={h.clave}
                  onChange={(e) => actualizarFila(horarios, setHorarios, idx, 'clave', e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: '180px' }}
                />
                <input
                  type="text"
                  placeholder="Franja horaria (ej: 09:00 a 18:00)"
                  maxLength={100}
                  value={h.valor}
                  onChange={(e) => actualizarFila(horarios, setHorarios, idx, 'valor', e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: '180px' }}
                />
                <button
                  type="button"
                  onClick={() => eliminarFila(horarios, setHorarios, idx)}
                  style={btnDeleteStyle}
                  title="Eliminar horario"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </section>

        {/* Bloque 4: Redes Sociales */}
        <section style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-green)' }}>Redes Sociales</h3>
            <button
              type="button"
              onClick={() => setRedes([...redes, { clave: '', valor: '' }])}
              disabled={redes.length >= 20}
              style={btnAddStyle}
            >
              + Agregar red
            </button>
          </div>

          {redes.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>
              No hay redes sociales cargadas.
            </p>
          ) : (
            redes.map((r, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Red (ej: Instagram, LinkedIn)"
                  value={r.clave}
                  onChange={(e) => actualizarFila(redes, setRedes, idx, 'clave', e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
                />
                <input
                  type="url"
                  placeholder="https://instagram.com/tu-cuenta"
                  value={r.valor}
                  onChange={(e) => actualizarFila(redes, setRedes, idx, 'valor', e.target.value)}
                  style={{ ...inputStyle, flex: 2, minWidth: '240px' }}
                />
                <button
                  type="button"
                  onClick={() => eliminarFila(redes, setRedes, idx)}
                  style={btnDeleteStyle}
                  title="Eliminar red social"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={guardando} style={btnPrimaryStyle}>
            {guardando ? 'Guardando...' : 'Guardar Información'}
          </button>
        </div>
      </form>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#0a0a0a',
  padding: '1.75rem',
  borderRadius: '8px',
  border: '1px solid #333',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem'
};
const groupStyle = { display: 'flex', flexDirection: 'column', gap: '0.4rem' };
const labelStyle = { color: '#d1d5db', fontSize: '0.9rem' };
const inputStyle = {
  padding: '0.7rem',
  borderRadius: '4px',
  border: '1px solid #4b5563',
  backgroundColor: '#111',
  color: 'var(--text-main)',
  outline: 'none'
};
const btnPrimaryStyle = {
  padding: '0.8rem 1.75rem',
  backgroundColor: 'var(--primary-green)',
  color: '#0a0a0a',
  border: 'none',
  borderRadius: '4px',
  fontWeight: '600',
  cursor: 'pointer'
};
const btnAddStyle = {
  padding: '0.45rem 0.9rem',
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  color: 'var(--primary-green)',
  border: '1px solid var(--primary-green)',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontWeight: '600',
  cursor: 'pointer'
};
const btnDeleteStyle = {
  padding: '0.65rem 0.85rem',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: '#ef4444',
  border: '1px solid #ef4444',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold'
};