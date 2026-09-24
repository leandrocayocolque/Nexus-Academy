const CAMPOS_PUBLICOS_USUARIO = Object.freeze([
  'id',
  'correo',
  'nombre',
  'apellido',
  'rol',
  'activo',
  'creadoEn',
  'actualizadoEn'
]);

export function serializarUsuario(usuario) {
  if (!usuario) return usuario;

  return Object.fromEntries(
    CAMPOS_PUBLICOS_USUARIO.filter((campo) => Object.hasOwn(usuario, campo)).map((campo) => [
      campo,
      usuario[campo]
    ])
  );
}

export const sanitizeUser = serializarUsuario;
