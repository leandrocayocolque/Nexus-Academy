// Acepta solo texto configurado; conserva el fallback sin convertir otros valores.
export function textoConfigurado(valor, fallback) {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : fallback;
}

// Referencia visual, no identificador único: las operaciones conservan el ID original.
export function referenciaId(id) {
  if (id == null || id === '') return 'Sin referencia';
  const texto = String(id);
  return /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(texto)
    ? `${texto.slice(0, 8)}…${texto.slice(-4)}`
    : texto;
}

const etiquetasHorario = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
  'lunes a viernes': 'Lunes a viernes',
  'lunes a sabado': 'Lunes a sábado',
  'fin de semana': 'Fin de semana',
  'dias habiles': 'Días hábiles',
  feriados: 'Feriados',
};

// Solo transforma la etiqueta visible; no modifica horarios ni sus valores.
export function etiquetaHorario(clave) {
  const texto = clave
    .replace(/([A-ZÁÉÍÓÚÑ])([A-ZÁÉÍÓÚÑ][a-záéíóúñ])/g, '$1 $2')
    .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('es');
  const conocida = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return etiquetasHorario[conocida] ?? (texto.charAt(0).toLocaleUpperCase('es') + texto.slice(1));
}
