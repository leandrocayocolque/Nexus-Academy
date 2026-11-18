import { crearCliente, ErrorApi } from '../api/cliente.js';
import { crearApiAcademia } from '../api/academia.js';

export function destinoAdmin(destino) {
  if (typeof destino !== 'string' || /[\\\s%]/.test(destino)) return '/admin';
  if (!/^\/admin(?:[/?#]|$)/.test(destino)) return '/admin';
  const url = new URL(destino, 'https://interno.invalid');
  if (url.pathname !== '/admin' && !url.pathname.startsWith('/admin/')) return '/admin';
  return destino;
}

function identidadValida(usuario) {
  return typeof usuario?.id === 'string' && usuario.id.trim() &&
    usuario.rol === 'ADMIN' && usuario.activo === true;
}

// Los secretos viven únicamente en este cierre, nunca en snapshots ni storage.
export function crearSesion({ baseUrl, fetchImpl } = {}) {
  let token = null;
  let version = 0;
  let snapshot = Object.freeze({ estado: 'anonima', usuario: null, error: null });
  const listeners = new Set();
  const publicar = (estado, usuario = null, error = null) => {
    snapshot = Object.freeze({ estado, usuario, error });
    listeners.forEach(listener => listener());
  };
  const publico = crearCliente({ baseUrl, fetchImpl });
  const solicitar = (path, opciones) => {
    // Cada solicitud captura su generación: un 401 tardío no cierra otro login,
    // incluso si el servidor devuelve exactamente el mismo token.
    const generacion = version;
    const autenticada = Boolean(token);
    return crearCliente({ baseUrl, fetchImpl, getToken: () => token,
      onUnauthorized: () => {
        if (!autenticada || generacion !== version) return;
        token = null;
        version++;
        publicar('anonima', null, new ErrorApi('Tu sesión expiró. Iniciá sesión nuevamente.', {
          status: 401, code: 'SESION_EXPIRADA',
        }));
      },
    })(path, opciones);
  };
  return Object.freeze({
    getSnapshot: () => snapshot,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    solicitar,
    academia: crearApiAcademia(solicitar),
    logout() {
      version++;
      token = null;
      publicar('anonima');
    },
    async login({ correo, contrasena }) {
      const generacion = ++version;
      token = null;
      publicar('cargando');
      try {
        const respuesta = await publico('/autenticacion/login', {
          method: 'POST', body: { correo, contrasena },
        });
        if (generacion !== version) return false;
        if (typeof respuesta?.tokenAcceso !== 'string' || !respuesta.tokenAcceso.trim() ||
            !identidadValida(respuesta.usuario)) {
          throw new ErrorApi('La identidad recibida no es válida.', { code: 'IDENTIDAD_INVALIDA' });
        }
        // Token candidato solo para verificar identidad; no habilita el panel.
        const verificar = crearCliente({ baseUrl, fetchImpl, getToken: () => respuesta.tokenAcceso });
        const usuario = await verificar('/usuarios/me');
        if (generacion !== version) return false;
        if (!identidadValida(usuario) || usuario.id !== respuesta.usuario.id) {
          throw new ErrorApi('La identidad recibida no es válida.', { code: 'IDENTIDAD_INVALIDA' });
        }
        token = respuesta.tokenAcceso;
        publicar('autenticada', usuario);
        return true;
      } catch (error) {
        if (generacion !== version) return false;
        token = null;
        publicar('anonima', null, error);
        return false;
      }
    },
  });
}
