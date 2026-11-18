import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { crearApiAcademia, formatearFechaInicio } from '../src/api/academia.js';
import { crearCliente } from '../src/api/cliente.js';

test('inicio público respeta el día local al cruzar medianoche UTC', () => {
  const source = readFileSync(new URL('../src/components/DetalleCurso.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('{formatearFechaInicio(curso.fechaInicio)}'));
  const instante = '2026-06-16T02:30:00Z';
  assert.equal(formatearFechaInicio(instante, 'America/Argentina/Buenos_Aires'), '15 de junio de 2026');
  assert.equal(formatearFechaInicio(instante, 'UTC'), '16 de junio de 2026');
  assert.equal(formatearFechaInicio(instante), new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(new Date(instante)));
  for (const fecha of [null, undefined, '', 'inválida']) {
    assert.equal(formatearFechaInicio(fecha), 'Fecha no disponible');
  }
});

const envelope = (datos, pagina, paginasTotales) => ({ datos, paginacion: { pagina, limite: 100, total: datos.length, paginasTotales } });

test('endpoints públicos explícitos, consulta y detalle UUID sin conversión numérica', async () => {
  const calls = [];
  const curso = { id: '0d3e2ce0-f945-4cec-bc1f-17ef05bb0042', categoria: { id: 'cat', nombre: 'Diseño' }, precio: '123.50', disponible: true };
  const api = crearApiAcademia(async (path, options) => { calls.push([path, options]); return curso; });
  const signal = new AbortController().signal;
  assert.equal(await api.obtenerCurso(curso.id, { signal }), curso);
  assert.equal(calls[0][0], `/cursos/${curso.id}`);
  assert.equal(calls[0][1].signal, signal);
  await api.listarCursos({ categoria: 'diseno', pagina: 2 }, { signal });
  assert.deepEqual(calls[1], ['/cursos', { signal, query: { categoria: 'diseno', pagina: 2 } }]);
  await api.listarCategorias({ pagina: 3 }, { signal });
  assert.deepEqual(calls[2], ['/categorias', { signal, query: { pagina: 3 } }]);
  await api.obtenerCurso('id/con espacio');
  assert.equal(calls[3][0], '/cursos/id%2Fcon%20espacio');
});

test('carga todas las páginas de cursos y categorías sin truncar más de cien', async () => {
  const calls = [];
  const api = crearApiAcademia(async (path, { query, signal }) => {
    calls.push([path, query, signal]);
    const datos = query.pagina === 1 ? Array.from({ length: 100 }, (_, i) => ({ id: `${path}-${i}` })) : [{ id: `${path}-100` }];
    return envelope(datos, query.pagina, 2);
  });
  const signal = new AbortController().signal;
  assert.equal((await api.cargarTodosCursos({ signal })).length, 101);
  assert.equal((await api.cargarTodasCategorias({ signal })).length, 101);
  assert.deepEqual(calls.map(([path, query]) => [path, query]), [
    ['/cursos', { pagina: 1, limite: 100 }], ['/cursos', { pagina: 2, limite: 100 }],
    ['/categorias', { pagina: 1, limite: 100 }], ['/categorias', { pagina: 2, limite: 100 }],
  ]);
  assert.ok(calls.every((call) => call[2] === signal));
});

test('vacío es válido; contrato inválido y fallo de página no retornan catálogo parcial', async () => {
  const vacia = crearApiAcademia(async () => envelope([], 1, 0));
  assert.deepEqual(await vacia.cargarTodosCursos(), []);
  for (const respuesta of [{}, { datos: [], paginacion: { pagina: 1, paginasTotales: -1 } }]) {
    const api = crearApiAcademia(async () => respuesta);
    await assert.rejects(api.cargarTodosCursos(), /respuesta/i);
  }
  const error = new Error('Servicio no disponible');
  const api = crearApiAcademia(async (_path, { query }) => {
    if (query.pagina === 2) throw error;
    return envelope([{ id: 'uno' }], 1, 2);
  });
  await assert.rejects(api.cargarTodosCursos(), (e) => e === error);
});

test('cancelación entre páginas y antes de iniciar evita solicitudes posteriores', async () => {
  const controller = new AbortController();
  let calls = 0;
  const api = crearApiAcademia(async () => {
    calls++;
    controller.abort();
    return envelope([{ id: 'uno' }], 1, 2);
  });
  await assert.rejects(api.cargarTodosCursos({ signal: controller.signal }), { name: 'AbortError' });
  assert.equal(calls, 1);
  await assert.rejects(api.cargarTodasCategorias({ signal: controller.signal }), { name: 'AbortError' });
  assert.equal(calls, 1);
});

test('detalle propaga 404 real sin fallback', async () => {
  const cliente = crearCliente({ baseUrl: '/api', fetchImpl: async () => new Response(JSON.stringify({ error: { codigo: 'CURSO_NO_ENCONTRADO', mensaje: 'Curso no encontrado.' } }), { status: 404 }) });
  await assert.rejects(crearApiAcademia(cliente).obtenerCurso('uuid-inexistente'), { status: 404, code: 'CURSO_NO_ENCONTRADO' });
});
