import { useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useSesion } from '../auth/SesionContext.js';
import { destinoAdmin } from '../auth/sesion.js';

export default function Login() {
  const { estado, error, login, logout } = useSesion();
  const location = useLocation();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const enviando = useRef(false);
  const pendiente = estado === 'cargando';
  if (estado === 'autenticada') {
    return <Navigate to={destinoAdmin(location.state?.desde)} replace />;
  }
  const enviar = async (event) => {
    event.preventDefault();
    if (enviando.current || pendiente) return;
    enviando.current = true;
    // Vaciar el campo tras enviar; nunca guardar contraseñas en contexto/storage.
    const clave = contrasena;
    setContrasena('');
    try {
      await login({ correo: correo.trim(), contrasena: clave });
    } finally {
      enviando.current = false;
    }
  };
  const mensaje = error?.status === 403
    ? 'No tenés permisos de administrador.'
    : error?.status === 401 && error.code !== 'SESION_EXPIRADA'
      ? 'Correo o contraseña incorrectos. Intentá nuevamente.'
      : error?.message;
  return (
    <section style={{ maxWidth: '440px', margin: '4rem auto', padding: '2rem',
      background: 'var(--bg-card)', border: '1px solid #333', borderRadius: '12px' }}>
      <h1>Acceso de administración</h1>
      <p>Iniciá sesión para gestionar la academia.</p>
      <form onSubmit={enviar} aria-busy={pendiente} style={{ display: 'grid', gap: '1rem' }}>
        <label htmlFor="correo">Correo electrónico</label>
        <input id="correo" name="correo" type="email" autoComplete="username" required
          value={correo} onChange={e => setCorreo(e.target.value)} disabled={pendiente} />
        <label htmlFor="contrasena">Contraseña</label>
        <input id="contrasena" name="contrasena" type="password" autoComplete="off" required
          value={contrasena} onChange={e => setContrasena(e.target.value)} disabled={pendiente} />
        {mensaje && <p role="alert" style={{ color: '#f87171' }}>{mensaje}</p>}
        <button type="submit" disabled={pendiente} style={{ padding: '0.75rem',
          background: 'var(--primary-green)', color: '#0a0a0a', borderRadius: '8px' }}>
          {pendiente ? 'Validando acceso…' : 'Iniciar sesión'}
        </button>
        {pendiente && <button type="button" onClick={logout}>Cancelar acceso</button>}
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <Link to="/recuperar-contrasena" style={{ color: 'var(--primary-green)', fontSize: '0.9rem', textDecoration: 'none' }}>
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <p>Por seguridad, al recargar la página deberás iniciar sesión nuevamente.</p>
    </section>
    
  );
}
