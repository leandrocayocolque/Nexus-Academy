export class ErrorPersistencia extends Error {
  constructor(mensaje, codigo, { causa, detalles } = {}) {
    super(mensaje, { cause: causa });
    this.name = this.constructor.name;
    this.codigo = codigo;
    this.detalles = detalles;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ErrorUnicidadPersistencia extends ErrorPersistencia {
  constructor({ causa, campos, entidad } = {}) {
    super('Ya existe un registro con los mismos datos únicos.', 'VALOR_DUPLICADO', {
      causa,
      detalles: { entidad, campos }
    });
  }
}

export class ErrorReferenciaPersistencia extends ErrorPersistencia {
  constructor({ causa, campo, entidad } = {}) {
    super('La operación viola una referencia entre registros.', 'REFERENCIA_INVALIDA', {
      causa,
      detalles: { entidad, campo }
    });
  }
}

export class ErrorRegistroNoEncontradoPersistencia extends ErrorPersistencia {
  constructor({ causa, entidad } = {}) {
    super('El registro solicitado no existe.', 'REGISTRO_NO_ENCONTRADO', {
      causa,
      detalles: { entidad }
    });
  }
}

export function traducirErrorPersistencia(error, contexto = {}) {
  if (error instanceof ErrorPersistencia) return error;

  if (error?.code === 'P2002') {
    return new ErrorUnicidadPersistencia({
      causa: error,
      campos: Array.isArray(error.meta?.target) ? error.meta.target : undefined,
      entidad: contexto.entidad
    });
  }

  if (error?.code === 'P2003' || error?.code === 'P2014') {
    return new ErrorReferenciaPersistencia({
      causa: error,
      campo: error.meta?.field_name,
      entidad: contexto.entidad
    });
  }

  if (error?.code === 'P2025') {
    return new ErrorRegistroNoEncontradoPersistencia({ causa: error, entidad: contexto.entidad });
  }

  return error;
}

export async function ejecutarOperacionPersistencia(operacion, contexto) {
  try {
    return await operacion();
  } catch (error) {
    throw traducirErrorPersistencia(error, contexto);
  }
}
