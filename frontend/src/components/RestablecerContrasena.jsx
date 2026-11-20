import { useState } from 'react';
import './AdminResponsive.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSesion } from '../auth/SesionContext.js';

export default function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { solicitar } = useSesion();

  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarContrasenaNueva, setConfirmarContrasenaNueva] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('El enlace no contiene un token válido.');
      return;
    }
    if (contrasenaNueva !== confirmarContrasenaNueva) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    try {
      const res = await solicitar('/autenticacion/restablecer-contrasena', {
        method: 'POST',
        body: {
          token,
          contrasenaNueva,
          confirmarContrasenaNueva
        }
      });
      toast.success(res?.mensaje || 'Contraseña restablecida correctamente.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error?.message || 'El enlace expiró o la contraseña no cumple los requisitos.');
    } finally {
      setEnviando(false);
    }
  };

  if (!token) {
    return (
      <section className="admin-login admin-auth-invalid">
        <h2>Enlace inválido</h2>
        <p style={{ color: '#9ca3af' }}>No se encontró el token de restablecimiento en la URL.</p>
        <Link to="/recuperar-contrasena" style={{ color: 'var(--primary-green)' }}>Solicitar un nuevo enlace</Link>
      </section>
    );
  }

  return (
    <section className="admin-login">
      <h1 style={{ marginTop: 0 }}>Nueva contraseña</h1>
      <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
        Debe tener al menos 12 caracteres, incluyendo una mayúscula, una minúscula y un número.
      </p>

      <form onSubmit={handleSubmit} className="admin-auth-form">
        <label htmlFor="nueva-clave">Nueva contraseña</label>
        <input
          id="nueva-clave"
          type="password"
          required
          minLength={12}
          value={contrasenaNueva}
          onChange={(e) => setContrasenaNueva(e.target.value)}
          disabled={enviando}
        />

        <label htmlFor="confirmar-clave">Confirmar nueva contraseña</label>
        <input
          id="confirmar-clave"
          type="password"
          required
          minLength={12}
          value={confirmarContrasenaNueva}
          onChange={(e) => setConfirmarContrasenaNueva(e.target.value)}
          disabled={enviando}
        />

        <button
          type="submit"
          disabled={enviando}
          className="admin-button-primary"
        >
          {enviando ? 'Guardando...' : 'Restablecer contraseña'}
        </button>
      </form>
    </section>
  );
}