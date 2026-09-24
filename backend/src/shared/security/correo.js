export function normalizarCorreo(correo) {
  if (typeof correo !== 'string') {
    throw new TypeError('El correo debe ser una cadena de texto.');
  }

  const normalizado = correo.trim().toLowerCase();
  if (!normalizado) throw new TypeError('El correo es obligatorio.');
  return normalizado;
}
