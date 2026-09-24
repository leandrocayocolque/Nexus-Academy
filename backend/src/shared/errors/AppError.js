import { codigosError } from './errorCodes.js';

export class AppError extends Error {
  constructor(
    mensaje,
    codigoEstado = 500,
    codigo = codigosError.ERROR_INTERNO,
    detalles = undefined
  ) {
    super(mensaje);
    this.name = this.constructor.name;
    this.codigoEstado = codigoEstado;
    this.codigo = codigo;
    this.detalles = detalles;
    this.esOperacional = true;
    this.statusCode = codigoEstado;
    this.code = codigo;
    this.details = detalles;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ErrorValidacion extends AppError {
  constructor(mensaje = 'Los datos enviados no son válidos.', detalles) {
    super(mensaje, 400, codigosError.DATOS_INVALIDOS, detalles);
  }
}

export class ErrorAutenticacion extends AppError {
  constructor(mensaje = 'Se requiere autenticación.') {
    super(mensaje, 401, codigosError.NO_AUTENTICADO);
  }
}

export class ErrorAutorizacion extends AppError {
  constructor(mensaje = 'No tiene permisos para realizar esta acción.') {
    super(mensaje, 403, codigosError.NO_AUTORIZADO);
  }
}

export class ErrorNoEncontrado extends AppError {
  constructor(mensaje = 'El recurso solicitado no existe.') {
    super(mensaje, 404, codigosError.NO_ENCONTRADO);
  }
}

export class ErrorConflicto extends AppError {
  constructor(mensaje = 'La operación entra en conflicto con el estado actual.', detalles) {
    super(mensaje, 409, codigosError.CONFLICTO, detalles);
  }
}

export class ErrorLimiteSolicitudes extends AppError {
  constructor(mensaje = 'Se alcanzó el límite de solicitudes. Intente nuevamente más tarde.') {
    super(mensaje, 429, codigosError.LIMITE_SOLICITUDES);
  }
}

export class ErrorArchivoInvalido extends AppError {
  constructor(mensaje = 'El archivo enviado no es válido.', detalles) {
    super(mensaje, 400, codigosError.ARCHIVO_INVALIDO, detalles);
  }
}

export class ErrorCorreoDuplicado extends AppError {
  constructor(mensaje = 'Ya existe un usuario registrado con ese correo.') {
    super(mensaje, 409, codigosError.CORREO_DUPLICADO);
  }
}

export class ErrorCredencialesInvalidas extends AppError {
  constructor() {
    super(
      'Las credenciales proporcionadas no son válidas.',
      401,
      codigosError.CREDENCIALES_INVALIDAS
    );
  }
}

export class ErrorUsuarioNoEncontrado extends AppError {
  constructor() {
    super('El usuario solicitado no existe.', 404, codigosError.USUARIO_NO_ENCONTRADO);
  }
}

export class ErrorTokenRestablecimientoInvalido extends AppError {
  constructor() {
    super(
      'El token de restablecimiento no es válido o expiró.',
      400,
      codigosError.TOKEN_RESTABLECIMIENTO_INVALIDO
    );
  }
}

export class ErrorContrasenaActualInvalida extends AppError {
  constructor() {
    super('La contraseña actual no es válida.', 400, codigosError.CONTRASENA_ACTUAL_INVALIDA);
  }
}

export class ErrorNegocioNoEncontrado extends AppError {
  constructor() {
    super(
      'La información del negocio no está configurada.',
      404,
      codigosError.NEGOCIO_NO_ENCONTRADO
    );
  }
}

export class ErrorCategoriaNoEncontrada extends AppError {
  constructor() {
    super('La categoría solicitada no existe.', 404, codigosError.CATEGORIA_NO_ENCONTRADA);
  }
}

export class ErrorCategoriaDuplicada extends AppError {
  constructor() {
    super(
      'Ya existe una categoría con el mismo nombre o slug.',
      409,
      codigosError.CATEGORIA_DUPLICADA
    );
  }
}

export class ErrorCategoriaEnUso extends AppError {
  constructor() {
    super(
      'La categoría no puede eliminarse porque tiene cursos asociados.',
      409,
      codigosError.CATEGORIA_EN_USO
    );
  }
}

export class ErrorCursoNoEncontrado extends AppError {
  constructor() {
    super('El curso solicitado no existe.', 404, codigosError.CURSO_NO_ENCONTRADO);
  }
}

export class ErrorCursoDuplicado extends AppError {
  constructor() {
    super('Ya existe un curso con el mismo slug.', 409, codigosError.CURSO_DUPLICADO);
  }
}

export class ErrorImagenNoEncontrada extends AppError {
  constructor() {
    super('La imagen solicitada no existe en el curso.', 404, codigosError.IMAGEN_NO_ENCONTRADA);
  }
}

export class ErrorLimiteImagenes extends AppError {
  constructor(maximo) {
    super(`Un curso no puede tener más de ${maximo} imágenes.`, 409, codigosError.LIMITE_IMAGENES);
  }
}

export class ErrorConsultaNoEncontrada extends AppError {
  constructor() {
    super('La consulta solicitada no existe.', 404, codigosError.CONSULTA_NO_ENCONTRADA);
  }
}

export class ErrorPromocionNoEncontrada extends AppError {
  constructor() {
    super('La promoción solicitada no existe.', 404, codigosError.PROMOCION_NO_ENCONTRADA);
  }
}

export class ErrorServicioExterno extends AppError {
  constructor(servicio) {
    super(
      `El servicio externo de ${servicio} no está disponible temporalmente.`,
      503,
      codigosError.SERVICIO_EXTERNO_NO_DISPONIBLE
    );
  }
}
