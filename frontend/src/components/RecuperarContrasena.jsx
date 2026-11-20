import { useState } from 'react';
import './AdminResponsive.css';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useSesion } from '../auth/SesionContext.js';

export default function RecuperarContrasena() {
  const { solicitar } = useSesion();
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    try {
      const res = await solicitar('/autenticacion/recuperar-contrasena', {
        method: 'POST',
        body: { correo: correo.trim() }
      });
      setEnviado(true);
      toast.success(res?.mensaje || 'Revisá tu correo (o la consola del servidor) para continuar.');
    } catch (error) {
      toast.error(error?.message || 'No se pudo procesar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="admin-login">
      <h1 style={{ marginTop: 0 }}>Recuperar contraseña</h1>
      <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
        Ingresá el correo de tu cuenta de administrador y te enviaremos un enlace para restablecer tu clave.
      </p>

      {enviado ? (
        <div className="admin-auth-success">
          <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>
            Si el correo corresponde a una cuenta activa, se generó un enlace de recuperación válido por 1 hora.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="admin-auth-form">
          <label htmlFor="correo-recuperacion">Correo electrónico</label>
          <input
            id="correo-recuperacion"
            type="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={enviando}
            placeholder="admin@example.com"
          />
          <button
            type="submit"
            disabled={enviando}
            className="admin-button-primary"
          >
            {enviando ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <Link to="/login">
          ← Volver al inicio de sesión
        </Link>
      </div>
    </section>
  );
}