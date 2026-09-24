export function exigirDelegado(cliente, nombre) {
  const delegado = cliente?.[nombre];
  if (!delegado) {
    throw new TypeError(`El cliente de persistencia no incluye el delegado ${nombre}.`);
  }
  return delegado;
}

export function limpiarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : valor;
}

export function sinIndefinidos(registro) {
  return Object.fromEntries(Object.entries(registro).filter(([, valor]) => valor !== undefined));
}
