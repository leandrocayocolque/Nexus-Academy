import { useState } from 'react';
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
    <section style={{ maxWidth: '440px', margin: '4rem auto', padding: '2rem', background: 'var(--bg-card)', border: '1px solid #333', borderRadius: '12px' }}>
      <h1 style={{ marginTop: 0 }}>Recuperar contraseña</h1>
      <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
        Ingresá el correo de tu cuenta de administrador y te enviaremos un enlace para restablecer tu clave.
      </p>

      {enviado ? (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--primary-green)', borderRadius: '8px', marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>
            Si el correo corresponde a una cuenta activa, se generó un enlace de recuperación válido por 1 hora.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
          <label htmlFor="correo-recuperacion">Correo electrónico</label>
          <input
            id="correo-recuperacion"
            type="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            disabled={enviando}
            placeholder="admin@example.com"
            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #4b5563', backgroundColor: '#111', color: 'var(--text-main)' }}
          />
          <button
            type="submit"
            disabled={enviando}
            style={{ padding: '0.75rem', background: 'var(--primary-green)', color: '#0a0a0a', fontWeight: '600', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            {enviando ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <Link to="/login" style={{ color: 'var(--primary-green)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Volver al inicio de sesión
        </Link>
      </div>
    </section>
  );
}