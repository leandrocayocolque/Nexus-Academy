import test from 'node:test';
import assert from 'node:assert/strict';
import { crearCliente, ErrorApi } from '../src/api/cliente.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('normaliza URL, consulta, JSON, bearer dinámico y AbortSignal', async () => {
  const controller = new AbortController();
  let token = 'primero';
  const calls = [];
  const cliente = crearCliente({ baseUrl: 'https://api.example/api/', getToken: () => token,
    fetchImpl: async (...args) => { calls.push(args); return json({ ok: true }); } });
  assert.deepEqual(await cliente('/cursos', { method: 'POST', query: { buscar: 'diseño web', disponible: false, vacio: undefined }, body: { titulo: 'Curso' }, signal: controller.signal }), { ok: true });
  const [url, options] = calls[0];
  assert.equal(url, 'https://api.example/api/cursos?buscar=dise%C3%B1o+web&disponible=false');
  assert.equal(options.headers.get('Content-Type'), 'application/json');
  assert.equal(options.headers.get('Authorization'), 'Bearer primero');
  assert.equal(options.body, '{"titulo":"Curso"}');
  assert.equal(options.signal, controller.signal);
  token = 'segundo';
  await cliente('/cursos');
  assert.equal(calls[1][1].headers.get('Authorization'), 'Bearer segundo');
});

test('FormData conserva el cuerpo y deja el boundary al navegador; 204 no tiene JSON', async () => {
  const body = new FormData();
  body.append('imagenes', new Blob(['imagen']), 'foto.png');
  const cliente = crearCliente({ baseUrl: '/api', fetchImpl: async (url, options) => {
    assert.equal(url, '/api/cursos');
    assert.equal(options.body, body);
    assert.equal(options.headers.has('Content-Type'), false);
    return new Response(null, { status: 204 });
  } });
  assert.equal(await cliente('/cursos', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } }), null);
});

test('expone mensaje, status, code y detalles del backend; avisa 401 pero no 403', async () => {
  let avisos = 0;
  for (const status of [401, 403, 404, 422, 500]) {
    const cliente = crearCliente({ baseUrl: '/api', onUnauthorized: () => { avisos++; },
      fetchImpl: async () => json({ error: { mensaje: 'Acceso denegado.', codigo: 'SIN_ACCESO', detalles: [{ campo: 'correo' }] } }, status) });
    await assert.rejects(cliente('/cursos'), (error) => {
      assert.ok(error instanceof ErrorApi);
      assert.equal(error.message, 'Acceso denegado.');
      assert.equal(error.status, status);
      assert.equal(error.code, 'SIN_ACCESO');
      assert.deepEqual(error.detalles, [{ campo: 'correo' }]);
      return true;
    });
  }
  assert.equal(avisos, 1);
});

test('errores de red, HTTP no JSON y respuesta inválida son significativos en español', async () => {
  for (const [fetchImpl, code, status] of [
    [async () => { throw new TypeError('Failed to fetch'); }, 'ERROR_RED', 0],
    [async () => new Response('<html>falló</html>', { status: 502 }), 'ERROR_HTTP', 502],
    [async () => new Response('no json'), 'RESPUESTA_INVALIDA', 200],
  ]) {
    const cliente = crearCliente({ baseUrl: '/api', fetchImpl });
    await assert.rejects(cliente('/cursos'), (error) => error.code === code && error.status === status && /[a-záéíóúñ]/i.test(error.message));
  }
});

test('sin URL no inventa servidor ni ejecuta fetch; abort conserva identidad', async () => {
  const cliente = crearCliente({ baseUrl: '', fetchImpl: () => assert.fail('no debe pedir datos') });
  await assert.rejects(cliente('/cursos'), /VITE_API_URL/);
  const abort = new DOMException('Cancelado', 'AbortError');
  const cancelable = crearCliente({ baseUrl: '/api', fetchImpl: async () => { throw abort; } });
  await assert.rejects(cancelable('/cursos'), (error) => error === abort);
});
