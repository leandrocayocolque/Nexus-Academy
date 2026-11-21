import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '../auth/SesionContext.js';
import { registrarAdministrador, mensajeErrorRegistro } from '../auth/registro.js';
import './AdminResponsive.css';

const vacio = { nombre: '', apellido: '', correo: '', telefono: '', contrasena: '', confirmarContrasena: '' };
const campos = [
  ['nombre', 'Nombre', 'text', 'given-name', 100],
  ['apellido', 'Apellido', 'text', 'family-name', 100],
  ['correo', 'Correo electrónico', 'email', 'email', 254],
  ['telefono', 'Teléfono', 'tel', 'tel', 50],
  ['contrasena', 'Contraseña', 'password', 'new-password'],
  ['confirmarContrasena', 'Confirmar contraseña', 'password', 'new-password'],
];

export default function Registro() {
  const { solicitar, estado } = useSesion();
  const [datos, setDatos] = useState(vacio);
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const enviando = useRef(false);

  const enviar = async (event) => {
    event.preventDefault();
    if (enviando.current || estado !== 'autenticada') return;
    enviando.current = true;
    setPendiente(true);
    setError('');
    setExito('');
    try {
      await registrarAdministrador(solicitar, datos);
      setDatos(vacio);
      setExito('Cuenta creada. Tu sesión sigue siendo la del administrador que la creó; no se inició sesión con la nueva cuenta.');
    } catch (fallo) {
      setError(mensajeErrorRegistro(fallo));
      setDatos(actual => ({ ...actual, contrasena: '', confirmarContrasena: '' }));
    } finally {
      enviando.current = false;
      setPendiente(false);
    }
  };

  return (
    <section className="admin-login">
      <h1>Crear cuenta de administración</h1>
      <p>Solo un administrador autenticado puede crear otra cuenta desde este panel.</p>
      <p>Crear una cuenta no inicia ni reemplaza tu sesión.</p>
      <form onSubmit={enviar} className="admin-auth-form" aria-busy={pendiente}>
        <fieldset disabled={pendiente || estado !== 'autenticada'} className="admin-registro-fields">
          {campos.map(([campo, etiqueta, tipo, autocomplete, maximo]) => (
            <div className="admin-auth-form" key={campo}>
              <label htmlFor={`registro-${campo}`}>{etiqueta}</label>
              <input id={`registro-${campo}`} name={campo} type={tipo} autoComplete={autocomplete}
                required maxLength={maximo} value={datos[campo]}
                aria-describedby={tipo === 'password' ? 'registro-requisitos' : undefined}
                onChange={event => setDatos({ ...datos, [campo]: event.target.value })} />
            </div>
          ))}
          <p id="registro-requisitos">Nombre y apellido: 2–100 caracteres. Teléfono obligatorio: hasta 50 caracteres. Contraseña: al menos 12 caracteres, una mayúscula, una minúscula y un número; máximo 72 bytes UTF-8.</p>
          <button type="submit" className="admin-button-primary">{pendiente ? 'Creando cuenta…' : 'Crear administrador'}</button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        {exito && <p role="status">{exito}</p>}
      </form>
      <p><Link to="/admin">Volver al panel</Link></p>
    </section>
  );
}
