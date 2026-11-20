const camposRegistro = ['nombre', 'apellido', 'correo', 'telefono', 'contrasena', 'confirmarContrasena'];

function texto(valor, etiqueta, minimo, maximo) {
  if (typeof valor !== 'string') throw new Error(`${etiqueta} es obligatorio.`);
  const limpio = valor.trim();
  if (limpio.length < minimo || limpio.length > maximo) {
    throw new Error(`${etiqueta} debe contener entre ${minimo} y ${maximo} caracteres.`);
  }
  return limpio;
}

function identidad(entrada) {
  const nombre = texto(entrada.nombre, 'El nombre', 2, 100);
  const apellido = texto(entrada.apellido, 'El apellido', 2, 100);
  const correo = texto(entrada.correo, 'El correo', 1, 254).toLowerCase();
  // Same email syntax as the backend's Zod string().email().
  if (!/^(?!\.)(?!.*\.\.)([a-z0-9_'+.-]*)[a-z0-9_+-]@([a-z0-9][a-z0-9-]*\.)+[a-z]{2,}$/i.test(correo)) {
    throw new Error('El correo no tiene un formato válido.');
  }
  return { nombre, apellido, correo };
}

export function validarRegistro(entrada) {
  if (!entrada || Object.keys(entrada).some(campo => !camposRegistro.includes(campo))) {
    throw new Error('Los datos de registro contienen campos no permitidos.');
  }
  const datos = identidad(entrada);
  const telefono = texto(entrada.telefono, 'El teléfono', 1, 50);
  const clave = entrada.contrasena;
  if (typeof clave !== 'string' || clave.length < 12 || !/[a-záéíóúñ]/.test(clave) ||
      !/[A-ZÁÉÍÓÚÑ]/.test(clave) || !/\d/.test(clave) || new TextEncoder().encode(clave).length > 72) {
    throw new Error('La contraseña debe tener al menos 12 caracteres, mayúscula, minúscula y número; máximo 72 bytes UTF-8.');
  }
  if (clave !== entrada.confirmarContrasena) throw new Error('Las contraseñas no coinciden.');
  return { ...datos, telefono, contrasena: clave, confirmarContrasena: clave };
}

// Only creates a user. Login/session ownership remains with SesionProvider.
export function registrarAdministrador(solicitar, entrada) {
  const body = validarRegistro(entrada);
  return solicitar('/autenticacion/registro', { method: 'POST', body });
}

export function datosPerfil(entrada, usuario) {
  const datos = identidad(entrada);
  if (entrada.telefono?.trim() || usuario?.telefono != null) {
    datos.telefono = texto(entrada.telefono, 'El teléfono', 1, 50);
  }
  return datos;
}

export function mensajeErrorRegistro(error) {
  if (error?.code === 'CORREO_DUPLICADO') return 'Ese correo ya está registrado. Usá otro correo o iniciá sesión.';
  if (error?.status === 401) return 'Para crear otra cuenta necesitás iniciar sesión como administrador. Si tu sesión venció, volvé a ingresar.';
  if (error?.status === 403) return 'Solo un administrador autenticado puede crear otra cuenta de administración.';
  if (error?.status === 400 || error?.code === 'DATOS_INVALIDOS') return 'Revisá los datos: nombre y apellido de 2 a 100 caracteres, correo válido, teléfono de hasta 50 caracteres y contraseña con los requisitos indicados.';
  return error?.message || 'No se pudo crear la cuenta. Intentá nuevamente.';
}
