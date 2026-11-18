import test from 'node:test';
import assert from 'node:assert/strict';
import { crearSesion } from '../src/auth/sesion.js';

const usuario = { id: '1', rol: 'ADMIN', activo: true };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
const diferido = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('academia inyectada usa bearer actual; 403 conserva sesión y 401 autenticado la expira', async () => {
  let status = 200;
  let bearer;
  const sesion = crearSesion({ baseUrl: '/api', fetchImpl: async (url, opciones) => {
    if (url.endsWith('/login')) return json({ tokenAcceso: 'secreto', usuario });
    if (url.endsWith('/me')) return json(usuario);
    bearer = opciones.headers.get('Authorization');
    return json({ error: { mensaje: 'Sin permiso' } }, status);
  } });
  await sesion.login({});
  await sesion.academia.listarCursos();
  assert.equal(bearer, 'Bearer secreto');
  status = 403;
  await assert.rejects(sesion.solicitar('/admin'), e => e.status === 403);
  assert.equal(sesion.getSnapshot().estado, 'autenticada');
  status = 401;
  await assert.rejects(sesion.solicitar('/admin'), e => e.status === 401);
  assert.equal(sesion.getSnapshot().estado, 'anonima');
  assert.match(sesion.getSnapshot().error.message, /expiró/);
  await assert.rejects(sesion.academia.listarCursos());
  assert.equal(bearer, null);
});

test('401 público pendiente y 401 de una sesión anterior no borran identidad nueva', async () => {
  const pendientes = [];
  const sesion = crearSesion({ baseUrl: '/api', fetchImpl: async url => {
    if (url.endsWith('/login')) return json({ tokenAcceso: 'mismo-token', usuario });
    if (url.endsWith('/me')) return json(usuario);
    const pendiente = diferido(); pendientes.push(pendiente); return pendiente.promise;
  } });
  const publico = assert.rejects(sesion.solicitar('/publico'));
  await sesion.login({});
  pendientes[0].resolve(json({}, 401));
  await publico;
  assert.equal(sesion.getSnapshot().estado, 'autenticada');
  const viejo = assert.rejects(sesion.solicitar('/privado'));
  sesion.logout();
  await sesion.login({});
  pendientes[1].resolve(json({}, 401));
  await viejo;
  assert.equal(sesion.getSnapshot().estado, 'autenticada');
});
