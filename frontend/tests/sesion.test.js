import test from 'node:test';
import assert from 'node:assert/strict';
import { crearSesion, destinoAdmin } from '../src/auth/sesion.js';

const usuario = { id: 'admin-1', correo: 'admin@example.com', rol: 'ADMIN', activo: true };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
const diferido = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const crear = (fetchImpl) => crearSesion({ baseUrl: '/api', fetchImpl });
const credenciales = { correo: usuario.correo, contrasena: 'no-persistir' };

test('login pendiente no autentica hasta validar /usuarios/me; no expone secretos', async () => {
  const perfil = diferido();
  const llamadas = [];
  const sesion = crear(async (url, opciones) => {
    llamadas.push([url, opciones]);
    return url.endsWith('/login') ? json({ tokenAcceso: 'token', usuario }) : perfil.promise;
  });
  let cambios = 0;
  const cancelar = sesion.subscribe(() => cambios++);
  const login = sesion.login(credenciales);
  assert.equal(sesion.getSnapshot().estado, 'cargando');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(sesion.getSnapshot().usuario, null);
  assert.equal(llamadas[1][0], '/api/usuarios/me');
  assert.equal(llamadas[1][1].headers.get('Authorization'), 'Bearer token');
  assert.equal(llamadas[0][1].headers.has('Authorization'), false);
  assert.deepEqual(JSON.parse(llamadas[0][1].body), credenciales);
  perfil.resolve(json(usuario));
  assert.equal(await login, true);
  assert.equal(sesion.getSnapshot().estado, 'autenticada');
  assert.deepEqual(sesion.getSnapshot().usuario, usuario);
  assert.doesNotMatch(JSON.stringify(sesion.getSnapshot()), /token|no-persistir/);
  assert.equal(cambios, 2);
  cancelar();
});

test('errores de credenciales, red, identidad inválida y permisos nunca autentican', async () => {
  for (const respuesta of [null, {}, { ...usuario, id: 'otro' }, { ...usuario, rol: 'ALUMNO' }, { ...usuario, activo: false }]) {
    const sesion = crear(async url => json(url.endsWith('/login') ? { tokenAcceso: 'token', usuario } : respuesta));
    assert.equal(await sesion.login(credenciales), false);
    assert.equal(sesion.getSnapshot().estado, 'anonima');
    assert.ok(sesion.getSnapshot().error);
  }
  for (const status of [401, 403, 500]) {
    const sesion = crear(async () => json({ error: { mensaje: 'Solicitud rechazada' } }, status));
    assert.equal(await sesion.login(credenciales), false);
    assert.equal(sesion.getSnapshot().error.status, status);
  }
  const sesion = crear(async () => { throw new TypeError('offline'); });
  assert.equal(await sesion.login(credenciales), false);
  assert.equal(sesion.getSnapshot().error.code, 'ERROR_RED');
});

test('respuesta de login inválida y rechazo de /me no habilitan admin', async () => {
  for (const respuesta of [null, {}, { tokenAcceso: '', usuario }, { tokenAcceso: 'token', usuario: { ...usuario, rol: 'ALUMNO' } }]) {
    const sesion = crear(async url => {
      assert.ok(url.endsWith('/login'), 'no debe verificar un token inválido');
      return json(respuesta);
    });
    assert.equal(await sesion.login(credenciales), false);
    assert.equal(sesion.getSnapshot().error.code, 'IDENTIDAD_INVALIDA');
  }
  for (const status of [401, 403]) {
    const sesion = crear(async url => url.endsWith('/login')
      ? json({ tokenAcceso: 'token', usuario }) : json({}, status));
    assert.equal(await sesion.login(credenciales), false);
    assert.equal(sesion.getSnapshot().error.status, status);
    assert.equal(sesion.getSnapshot().estado, 'anonima');
  }
});

test('un error de login viejo no sobrescribe una sesión nueva', async () => {
  const viejo = diferido();
  let llamadas = 0;
  const sesion = crear(async url => {
    if (!url.endsWith('/login')) return json(usuario);
    if (++llamadas === 1) return viejo.promise;
    return json({ tokenAcceso: 'nuevo', usuario });
  });
  const pendiente = sesion.login(credenciales);
  assert.equal(await sesion.login(credenciales), true);
  viejo.resolve(json({}, 401));
  assert.equal(await pendiente, false);
  assert.equal(sesion.getSnapshot().estado, 'autenticada');
  assert.equal(sesion.getSnapshot().error, null);
});

test('logout y login nuevo invalidan logins concurrentes sin commits tardíos', async () => {
  const primero = diferido();
  let llamadas = 0;
  const sesion = crear(async url => {
    if (!url.endsWith('/login')) return json(usuario);
    if (++llamadas === 1) return primero.promise;
    return json({ tokenAcceso: 'nuevo', usuario });
  });
  const viejo = sesion.login(credenciales);
  sesion.logout();
  assert.equal(await sesion.login(credenciales), true);
  primero.resolve(json({ tokenAcceso: 'viejo', usuario }));
  assert.equal(await viejo, false);
  assert.equal(sesion.getSnapshot().estado, 'autenticada');
  sesion.logout();
  assert.equal(sesion.getSnapshot().usuario, null);
});

test('logout durante validación impide montar admin', async () => {
  const perfil = diferido();
  const sesion = crear(async url => url.endsWith('/login') ? json({ tokenAcceso: 'token', usuario }) : perfil.promise);
  const login = sesion.login(credenciales);
  await new Promise(resolve => setImmediate(resolve));
  sesion.logout();
  perfil.resolve(json(usuario));
  assert.equal(await login, false);
  assert.equal(sesion.getSnapshot().estado, 'anonima');
});

test('retorno admite solamente rutas internas admin sin escapes ni redirección externa', () => {
  for (const path of ['/admin', '/admin/cursos?pagina=2#editar']) assert.equal(destinoAdmin(path), path);
  for (const path of [null, '//evil/admin', '/administrador', '/admin/../login', '/admin/%2e%2e/login', '/admin/\\evil', 'https://evil/admin', '/login']) {
    assert.equal(destinoAdmin(path), '/admin');
  }
});
