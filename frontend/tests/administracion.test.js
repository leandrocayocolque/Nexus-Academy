import test from 'node:test';
import assert from 'node:assert/strict';
import { crearApiAcademia, mutarYRecargar } from '../src/api/academia.js';
import { crearCliente } from '../src/api/cliente.js';

const pagina = (datos, actual = 1, total = 1) => ({
  datos, paginacion: { pagina: actual, paginasTotales: total },
});

test('dashboard usa resumen real y conserva los ceros', async () => {
  const resumen = { cursosActivos: 0, categoriasActivas: 2, consultasPendientes: 3 };
  const signal = new AbortController().signal;
  const api = crearApiAcademia(async (ruta, opciones) => {
    assert.equal(ruta, '/admin/dashboard');
    assert.equal(opciones.signal, signal);
    return { resumen, consultasPorEstado: [] };
  });
  assert.deepEqual(await api.obtenerResumenAdmin({ signal }), resumen);
  await assert.rejects(crearApiAcademia(async () => ({})).obtenerResumenAdmin(), /válida/);
});

test('categorías administra rutas exactas y excluye campos derivados e IDs del cuerpo', async () => {
  const llamadas = [];
  const api = crearApiAcademia(async (...args) => { llamadas.push(args); return { id: 'servidor' }; });
  const datos = { id: 'falso', nombre: 'Diseño', descripcion: null, activa: false, slug: 'no', cantidadCursos: 8 };
  assert.deepEqual(await api.crearCategoriaAdmin(datos), { id: 'servidor' });
  await api.actualizarCategoriaAdmin('id/con espacio', datos);
  await api.eliminarCategoriaAdmin('id/con espacio');
  assert.deepEqual(llamadas.map(([ruta, { method, body }]) => [ruta, method, body]), [
    ['/admin/categorias', 'POST', { nombre: 'Diseño', descripcion: null, activa: false }],
    ['/admin/categorias/id%2Fcon%20espacio', 'PATCH', { nombre: 'Diseño', descripcion: null, activa: false }],
    ['/admin/categorias/id%2Fcon%20espacio', 'DELETE', undefined],
  ]);
});

test('listas administrativas cargan todas las páginas sin filtros públicos', async () => {
  for (const [metodo, ruta] of [
    ['cargarTodasCategoriasAdmin', '/admin/categorias'],
    ['cargarTodasConsultasAdmin', '/admin/consultas'],
  ]) {
    const llamadas = [];
    const signal = new AbortController().signal;
    const api = crearApiAcademia(async (path, opciones) => {
      llamadas.push([path, opciones.query]);
      assert.equal(opciones.signal, signal);
      return pagina([{ id: opciones.query.pagina, estado: 'RESPONDIDA', creadaEn: '2026-01-01' }], opciones.query.pagina, 2);
    });
    const datos = await api[metodo]({ signal });
    assert.deepEqual(datos.map(d => d.id), [1, 2]);
    assert.equal(datos[0].estado, 'RESPONDIDA');
    assert.equal(datos[0].creadaEn, '2026-01-01');
    assert.deepEqual(llamadas, [[ruta, { pagina: 1, limite: 100 }], [ruta, { pagina: 2, limite: 100 }]]);
    await assert.rejects(crearApiAcademia(async () => pagina([], 9))[metodo](), /válida/);
  }
});

test('lectura consulta estado actual y PATCH solo PENDIENTE, nunca RESPONDIDA o LEIDA', async () => {
  for (const estado of ['PENDIENTE', 'LEIDA', 'RESPONDIDA']) {
    const llamadas = [];
    const api = crearApiAcademia(async (ruta, opciones) => {
      llamadas.push([ruta, opciones]);
      return { id: 'a/b', estado: opciones.method === 'PATCH' ? 'LEIDA' : estado };
    });
    const resultado = await api.marcarConsultaLeidaAdmin('a/b');
    assert.equal(resultado.estado, estado === 'PENDIENTE' ? 'LEIDA' : estado);
    assert.equal(llamadas[0][0], '/admin/consultas/a%2Fb');
    assert.equal(llamadas.length, estado === 'PENDIENTE' ? 2 : 1);
    if (estado === 'PENDIENTE') {
      assert.deepEqual(llamadas[1], ['/admin/consultas/a%2Fb/estado', {
        method: 'PATCH', body: { estado: 'LEIDA' }, signal: undefined,
      }]);
    }
  }
});

test('borrado y fallos no fabrican una respuesta exitosa', async () => {
  const fallo = new Error('La categoría está en uso.');
  const api = crearApiAcademia(async (ruta, opciones) => {
    assert.equal(ruta, '/admin/consultas/x');
    assert.equal(opciones.method, 'DELETE');
    throw fallo;
  });
  await assert.rejects(api.eliminarConsultaAdmin('x'), error => error === fallo);
  let refrescos = 0;
  await assert.rejects(mutarYRecargar(async () => { throw fallo; }, async () => { refrescos++; }), error => error === fallo);
  assert.equal(refrescos, 0);
});

test('mutación confirmada se distingue de fallo de recarga y no se repite', async () => {
  const error = new Error('No se pudo recargar');
  let escrituras = 0;
  const resultado = { id: 'confirmado' };
  assert.deepEqual(await mutarYRecargar(async () => { escrituras++; return resultado; }, async () => { throw error; }), {
    resultado, datos: null, errorActualizacion: error,
  });
  assert.equal(escrituras, 1);
  assert.deepEqual(await mutarYRecargar(async () => resultado, async () => [resultado]), {
    resultado, datos: [resultado], errorActualizacion: null,
  });
});

test('estado inválido no se acepta como lectura confirmada ni dispara PATCH', async () => {
  let llamadas = 0;
  const api = crearApiAcademia(async () => { llamadas++; return { id: 'x', estado: 'DESCONOCIDO' }; });
  await assert.rejects(api.marcarConsultaLeidaAdmin('x'), /válida/);
  assert.equal(llamadas, 1);
});

test('conflicto de categoría y rechazo de estado conservan errores reales sin recargar', async () => {
  for (const [accion, ruta, method, status, codigo, mensaje] of [
    [api => api.eliminarCategoriaAdmin('cat'), '/admin/categorias/cat', 'DELETE', 409, 'CATEGORIA_EN_USO', 'La categoría está en uso.'],
    [api => api.marcarConsultaLeidaAdmin('con'), '/admin/consultas/con/estado', 'PATCH', 403, 'PROHIBIDO', 'No tenés permisos.'],
  ]) {
    const llamadas = [];
    const api = crearApiAcademia(crearCliente({ baseUrl: 'https://academia.test/api', fetchImpl: async (url, opciones) => {
      llamadas.push(url);
      if (opciones.method === 'GET') return new Response(JSON.stringify({ id: 'con', estado: 'PENDIENTE' }));
      assert.equal(url, `https://academia.test/api${ruta}`);
      assert.equal(opciones.method, method);
      return new Response(JSON.stringify({ error: { codigo, mensaje } }), { status });
    } }));
    await assert.rejects(mutarYRecargar(() => accion(api), () => assert.fail('No debe recargar tras rechazo')), error =>
      error.status === status && error.code === codigo && error.message === mensaje);
    assert.equal(llamadas.length, method === 'PATCH' ? 2 : 1);
  }
});

test('cancelación y fallo de página no entregan listas incompletas', async () => {
  const controlador = new AbortController();
  let llamadas = 0;
  const api = crearApiAcademia(async () => {
    llamadas++;
    controlador.abort();
    return pagina([{ id: '1' }], 1, 2);
  });
  await assert.rejects(api.cargarTodasConsultasAdmin({ signal: controlador.signal }), { name: 'AbortError' });
  assert.equal(llamadas, 1);
  const fallo = new Error('Error segunda página');
  await assert.rejects(crearApiAcademia(async (_, { query }) => {
    if (query.pagina === 2) throw fallo;
    return pagina([{ id: '1' }], 1, 2);
  }).cargarTodasCategoriasAdmin(), error => error === fallo);
});
