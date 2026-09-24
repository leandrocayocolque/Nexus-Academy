import slugify from 'slugify';

export function crearSlug(texto) {
  if (typeof texto !== 'string' || !texto.trim()) {
    throw new TypeError('Se requiere un texto para generar el slug.');
  }

  const slug = slugify(texto, {
    lower: true,
    strict: true,
    locale: 'es',
    trim: true
  });

  if (!slug) throw new TypeError('No se pudo generar un slug válido.');
  return slug;
}
