function esDecimal(valor) {
  return Boolean(
    valor &&
    typeof valor === 'object' &&
    typeof valor.toString === 'function' &&
    valor.constructor?.name === 'Decimal'
  );
}

export function serializarDecimales(valor) {
  if (esDecimal(valor)) return valor.toString();
  if (Array.isArray(valor)) return valor.map(serializarDecimales);
  if (!valor || typeof valor !== 'object' || valor instanceof Date) return valor;

  return Object.fromEntries(
    Object.entries(valor).map(([clave, contenido]) => [clave, serializarDecimales(contenido)])
  );
}

export function mapearCurso(curso) {
  if (!curso) return curso;
  const cursoSerializado = serializarDecimales(curso);
  return {
    ...cursoSerializado,
    disponible: Boolean(curso.activo && curso.cuposDisponibles > 0)
  };
}

export const mapearCursos = (cursos) => cursos.map(mapearCurso);
