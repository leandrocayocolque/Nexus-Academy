import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSesion } from '../auth/SesionContext.js';
import { datosPerfil } from '../auth/registro.js';

export default function PerfilAdmin() {
  const { usuario, solicitar, actualizarUsuario } = useSesion();

  // Estado formulario datos personales
  const [datos, setDatos] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    correo: usuario?.correo || '',
    telefono: usuario?.telefono || ''
  });
  const [guardandoDatos, setGuardandoDatos] = useState(false);

  // Estado formulario cambio de contraseña
  const [claves, setClaves] = useState({
    contrasenaActual: '',
    contrasenaNueva: '',
    confirmarContrasenaNueva: ''
  });
  const [guardandoClave, setGuardandoClave] = useState(false);

  useEffect(() => {
    if (usuario) {
      setDatos({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        correo: usuario.correo || '',
        telefono: usuario.telefono || ''
      });
    }
  }, [usuario]);

  const handleGuardarDatos = async (e) => {
    e.preventDefault();
    setGuardandoDatos(true);
    try {
      const actualizado = await solicitar('/usuarios/me', {
        method: 'PATCH',
        body: datosPerfil(datos, usuario)
      });
      actualizarUsuario(actualizado);
      toast.success('Datos personales actualizados correctamente.');
    } catch (error) {
      toast.error(error?.message || 'Error al actualizar los datos personales.');
    } finally {
      setGuardandoDatos(false);
    }
  };

  const handleCambiarClave = async (e) => {
    e.preventDefault();
    if (claves.contrasenaNueva !== claves.confirmarContrasenaNueva) {
      toast.error('Las contraseñas nuevas no coinciden.');
      return;
    }

    setGuardandoClave(true);
    try {
      const res = await solicitar('/usuarios/me/contrasena', {
        method: 'PATCH',
        body: claves
      });
      toast.success(res?.mensaje || 'Contraseña actualizada correctamente.');
      setClaves({ contrasenaActual: '', contrasenaNueva: '', confirmarContrasenaNueva: '' });
    } catch (error) {
      toast.error(error?.message || 'No se pudo cambiar la contraseña. Verificá tu clave actual.');
    } finally {
      setGuardandoClave(false);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem' }}>Mi Perfil</h2>
        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
          Administrá tu información personal y la seguridad de tu cuenta.
        </p>
      </header>

      <div style={{ display: 'grid', gap: '2rem', maxWidth: '700px' }}>
        {/* Bloque 1: Datos Personales */}
        <form onSubmit={handleGuardarDatos} className="admin-section-card">
          <h3 style={{ marginTop: 0, color: 'var(--primary-green)' }}>Datos Personales</h3>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ ...groupStyle, flex: 1 }}>
              <label style={labelStyle}>Nombre *</label>
              <input
                type="text"
                required
                minLength={2}
                value={datos.nombre}
                onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ ...groupStyle, flex: 1 }}>
              <label style={labelStyle}>Apellido *</label>
              <input
                type="text"
                required
                minLength={2}
                value={datos.apellido}
                onChange={(e) => setDatos({ ...datos, apellido: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Correo electrónico *</label>
            <input
              type="email"
              required
              value={datos.correo}
              onChange={(e) => setDatos({ ...datos, correo: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={groupStyle}>
            <label htmlFor="perfil-telefono" style={labelStyle}>Teléfono</label>
            <input id="perfil-telefono" type="tel" autoComplete="tel" maxLength={50}
              required={usuario?.telefono != null} value={datos.telefono}
              onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
              style={inputStyle} aria-describedby="perfil-telefono-ayuda" />
            <small id="perfil-telefono-ayuda">Hasta 50 caracteres. Si tu cuenta aún no tiene teléfono, podés dejarlo vacío sin modificar ese dato.</small>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={guardandoDatos} style={btnPrimaryStyle}>
              {guardandoDatos ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        {/* Bloque 2: Seguridad / Contraseña */}
        <form onSubmit={handleCambiarClave} className="admin-section-card">
          <h3 style={{ marginTop: 0, color: 'var(--primary-green)' }}>Cambiar Contraseña</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>
            La nueva contraseña debe contener al menos 12 caracteres, una mayúscula, una minúscula y un número.
          </p>

          <div style={groupStyle}>
            <label style={labelStyle}>Contraseña actual *</label>
            <input
              type="password"
              required
              value={claves.contrasenaActual}
              onChange={(e) => setClaves({ ...claves, contrasenaActual: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ ...groupStyle, flex: 1 }}>
              <label style={labelStyle}>Nueva contraseña *</label>
              <input
                type="password"
                required
                minLength={12}
                value={claves.contrasenaNueva}
                onChange={(e) => setClaves({ ...claves, contrasenaNueva: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ ...groupStyle, flex: 1 }}>
              <label style={labelStyle}>Confirmar nueva contraseña *</label>
              <input
                type="password"
                required
                minLength={12}
                value={claves.confirmarContrasenaNueva}
                onChange={(e) => setClaves({ ...claves, confirmarContrasenaNueva: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={guardandoClave} style={btnPrimaryStyle}>
              {guardandoClave ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const groupStyle = { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', minWidth: 'min(100%, 200px)' };
const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.9rem' };
const inputStyle = {
  padding: 'var(--space-2)',
  borderRadius: 'var(--radius-control)',
  border: '1px solid var(--border-control)',
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-main)'
};
const btnPrimaryStyle = {
  padding: '0.7rem 1.4rem',
  backgroundColor: 'var(--primary-green)',
  color: 'var(--text-on-primary)',
  border: '1px solid transparent',
  borderRadius: 'var(--radius-control)',
  fontWeight: '600',
  cursor: 'pointer'
};