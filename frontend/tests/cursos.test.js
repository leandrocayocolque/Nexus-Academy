import test from 'node:test';
import assert from 'node:assert/strict';
import { crearCliente } from '../src/api/cliente.js';
import { crearApiAcademia, formularioCurso, prepararCurso, validarImagenCurso, guardarCursoConImagen } from '../src/api/academia.js';

const id = '9a430ae0-6835-42bf-bcd3-001122334455';
const datos = { categoriaId: id, titulo: ' Curso real ', duracion: ' 8 semanas ', cuposDisponibles: '0', fechaInicio: '2026-06-15T14:30:22.123', precio: '99999999.99', nivel: 'PRINCIPIANTE', modalidad: 'EN_LINEA', descripcion: '', activo: false, destacado: true };
const imagen = () => new File([new Uint8Array([255, 216, 255])], 'curso.jpg', { type: 'image/jpeg' });
function entorno(respuestas) {
  const llamadas = [];
  const api = crearApiAcademia(crearCliente({ baseUrl: 'https://test.invalid/api', getToken: () => 'token', fetchImpl: async (url, opciones) => {
    llamadas.push({ url, ...opciones });
    const [status, body] = respuestas.shift();
    return new Response(JSON.stringify(body), { status });
  } }));
  return { api, llamadas };
}

test('curso: mapeo local de fechas reversible, nulos y decimal sin moneda ni campos ajenos', () => {
  const payload = prepararCurso({ ...datos, tipo: 'Curso', imagen: 'url', id });
  assert.equal(payload.precio, '99999999.99');
  assert.equal(payload.descripcion, null);
  assert.equal(payload.cuposDisponibles, 0);
  assert.equal(payload.titulo, 'Curso real');
  assert.equal(payload.activo, false);
  assert.equal(payload.destacado, true);
  assert.equal(payload.tipo, undefined);
  assert.equal(payload.imagen, undefined);
  const form = formularioCurso({ ...payload, id, imagenes: [{ url: 'existente' }] });
  assert.equal(form.fechaInicio, datos.fechaInicio);
  assert.equal(prepararCurso(form).fechaInicio, payload.fechaInicio);
  assert.equal(form.descripcion, '');
  assert.equal(form.imagenes[0].url, 'existente');
});

test('curso: límites, fecha imposible, enums y precio estricto', () => {
  for (const cambio of [ { precio: '-1' }, { precio: '100000000' }, { precio: '1.234' }, { precio: '1e2' }, { precio: '' }, { nivel: 'Básico' }, { modalidad: 'Online' }, { cuposDisponibles: '1.2' }, { cuposDisponibles: '' }, { cuposDisponibles: '1000001' }, { fechaInicio: '2026-02-30T12:00' }, { fechaInicio: '' }, { titulo: 'ab' }, { categoriaId: '' } ]) {
    assert.throws(() => prepararCurso({ ...datos, ...cambio }), /campos/);
  }
  assert.equal(prepararCurso({ ...datos, precio: '0', cuposDisponibles: '1000000', descripcion: null }).precio, '0');
});

test('fecha local acepta fracciones normalizadas del navegador sin perder precisión', () => {
  for (const [entrada, salida] of [['2026-06-15T14:30', '2026-06-15T14:30:00.000'], ['2026-06-15T14:30:22.1', '2026-06-15T14:30:22.100'], ['2026-06-15T14:30:22.12', '2026-06-15T14:30:22.120']]) {
    assert.equal(formularioCurso(prepararCurso({ ...datos, fechaInicio: entrada })).fechaInicio, salida);
  }
});

test('admin: todas las páginas, UUID y whitelist PATCH/POST/DELETE', async () => {
  const { api, llamadas } = entorno([[200, { datos: [{ id }], paginacion: { pagina: 1, paginasTotales: 2 } }], [200, { datos: [], paginacion: { pagina: 2, paginasTotales: 2 } }], [201, { id }], [200, { id }], [200, {}]]);
  assert.equal((await api.cargarTodosCursosAdmin()).length, 1);
  await api.crearCursoAdmin({ ...datos, tipo: 'no' });
  await api.actualizarCursoAdmin(id, { ...datos, imagen: 'no' });
  await api.eliminarCursoAdmin(id);
  assert.match(llamadas[1].url, /admin\/cursos\?pagina=2&limite=100$/);
  assert.equal(llamadas[2].headers.get('Authorization'), 'Bearer token');
  assert.equal(JSON.parse(llamadas[2].body).tipo, undefined);
  assert.equal(llamadas[3].method, 'PATCH');
  assert.equal(llamadas[4].method, 'DELETE');
  assert.ok(llamadas[4].url.endsWith(`/admin/cursos/${id}`));
});

test('imagen: tipo y límite exacto de 5 MiB', () => {
  assert.doesNotThrow(() => validarImagenCurso(imagen()));
  assert.doesNotThrow(() => validarImagenCurso(new File([new Uint8Array(5 * 1024 * 1024)], 'a.png', { type: 'image/png' })));
  assert.throws(() => validarImagenCurso(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' })), /5 MiB/);
  assert.throws(() => validarImagenCurso(new File(['x'], 'a.svg', { type: 'image/svg+xml' })), /JPEG/);
});

test('rechazo del servidor conserva detalles y nunca inicia upload', async () => {
  const { api, llamadas } = entorno([[400, { error: { mensaje: 'Rechazado', detalles: [{ campo: 'titulo', mensaje: 'Duplicado' }] } }]]);
  let aceptado = false;
  await assert.rejects(guardarCursoConImagen(api, { datos, archivo: imagen(), onGuardado: () => { aceptado = true; } }), error => error.detalles[0].campo === 'titulo');
  assert.equal(aceptado, false);
  assert.equal(llamadas.length, 1);
});

test('fallo parcial: ID aceptado antes del upload; retry solo multipart sobre mismo curso', async () => {
  const { api, llamadas } = entorno([[201, { id }], [500, { error: { mensaje: 'Falló imagen' } }], [201, [{ id: 'imagen' }]]]);
  let guardado;
  const parcial = await guardarCursoConImagen(api, { datos, archivo: imagen(), onGuardado: curso => { guardado = curso; assert.equal(llamadas.length, 1); } });
  assert.equal(parcial.guardado.id, id);
  assert.equal(parcial.errorImagen.message, 'Falló imagen');
  const retry = await guardarCursoConImagen(api, { id, guardado, datos: { ...datos, titulo: 'obsoleto' }, archivo: imagen() });
  assert.equal(retry.errorImagen, null);
  assert.equal(llamadas.length, 3);
  for (const llamada of llamadas.slice(1)) {
    assert.ok(llamada.url.endsWith(`/admin/cursos/${id}/imagenes`));
    assert.equal(llamada.method, 'POST');
    assert.equal(llamada.headers.has('Content-Type'), false);
    assert.equal(llamada.body.get('imagenes').name, 'curso.jpg');
  }
});

test('edición parcial reintenta imagen sin reaplicar campos ya confirmados', async () => {
  const { api, llamadas } = entorno([[200, { id }], [413, { error: { mensaje: 'Imagen rechazada' } }], [201, []]]);
  const parcial = await guardarCursoConImagen(api, { id, datos, archivo: imagen() });
  assert.equal(parcial.errorImagen.status, 413);
  await guardarCursoConImagen(api, { guardado: parcial.guardado, archivo: imagen() });
  assert.deepEqual(llamadas.map(c => c.method), ['PATCH', 'POST', 'POST']);
  assert.equal(llamadas.filter(c => c.url.endsWith('/imagenes')).length, 2);
});

test('sin archivo solo guarda; archivo inválido impide toda mutación', async () => {
  const { api, llamadas } = entorno([[201, { id }]]);
  await assert.rejects(guardarCursoConImagen(api, { datos, archivo: new File(['x'], 'x.svg', { type: 'image/svg+xml' }) }), /JPEG/);
  assert.equal(llamadas.length, 0);
  const resultado = await guardarCursoConImagen(api, { datos });
  assert.equal(resultado.guardado.id, id);
  assert.equal(resultado.errorImagen, null);
  assert.equal(llamadas.length, 1);
});

test('editar usa PATCH antes de imagen; abortar evita segunda fase', async () => {
  const { api, llamadas } = entorno([[200, { id }]]);
  const controller = new AbortController();
  await assert.rejects(guardarCursoConImagen(api, { id, datos, archivo: imagen(), signal: controller.signal, onGuardado: () => controller.abort() }), { name: 'AbortError' });
  assert.equal(llamadas[0].method, 'PATCH');
  assert.equal(llamadas.length, 1);
});
