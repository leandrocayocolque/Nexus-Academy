import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { crearApiAcademia, validarConsulta, contextoConsulta, asuntoConsultaCurso } from '../src/api/academia.js';
import { crearCliente } from '../src/api/cliente.js';

const datos = { nombre: ' Ana ', correo: ' ANA@EXAMPLE.COM ', asunto: ' Consulta ', mensaje: ' Quiero más información. ', telefono: ' 1234 ' };
const cursoId = '0d3e2ce0-f945-4cec-bc1f-17ef05bb0042';

test('CTA conserva prefijo y cursoId con título máximo sin superar 200 caracteres', () => {
  const source = readFileSync(new URL('../src/components/DetalleCurso.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('state={{ cursoId: curso.id, asunto: asuntoConsultaCurso(curso.titulo) }}'));
  const state = contextoConsulta({ cursoId, asunto: asuntoConsultaCurso('a'.repeat(180)) });
  assert.equal(state.cursoId, cursoId);
  assert.ok(state.asunto.startsWith('Consulta sobre el curso: '));
  assert.equal(state.asunto.length, 200);
  assert.deepEqual(validarConsulta({ ...datos, ...state }), {});
  assert.equal(asuntoConsultaCurso('Diseño'), 'Consulta sobre el curso: Diseño');
});

test('consulta envía POST JSON normalizado con contexto y devuelve la aceptación real', async () => {
  const calls = [];
  const aceptada = { id: 'consulta-1', estado: 'PENDIENTE' };
  const api = crearApiAcademia(crearCliente({ baseUrl: '/api', fetchImpl: async (url, options) => {
    calls.push([url, options]);
    return Response.json(aceptada, { status: 201 });
  } }));
  assert.deepEqual(await api.crearConsulta({ ...datos, cursoId }), aceptada);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], '/api/consultas');
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].headers.get('Content-Type'), 'application/json');
  assert.deepEqual(JSON.parse(calls[0][1].body), {
    nombre: 'Ana', correo: 'ana@example.com', asunto: 'Consulta', mensaje: 'Quiero más información.', telefono: '1234', cursoId,
  });
  assert.equal(datos.nombre, ' Ana ');
});

test('validación protege mínimos, máximos y opcionales del contrato real', async () => {
  assert.deepEqual(validarConsulta(datos), {});
  for (const [campo, valores] of Object.entries({
    nombre: ['a', 'a'.repeat(151)], asunto: ['ab', 'a'.repeat(201)],
    mensaje: ['123456789', 'a'.repeat(5001)], telefono: ['1'.repeat(51)],
    correo: ['invalido', `${'a'.repeat(245)}@example.com`], cursoId: ['', 42, 'a'.repeat(101)],
  })) {
    for (const valor of valores) assert.ok(validarConsulta({ ...datos, [campo]: valor })[campo], `${campo}: ${String(valor).length}`);
  }
  for (const [campo, valores] of Object.entries({ nombre: ['ab', 'a'.repeat(150)], asunto: ['abc', 'a'.repeat(200)], mensaje: ['1234567890', 'a'.repeat(5000)], telefono: [null, '', '1'.repeat(50)], cursoId: [null, 'x', 'a'.repeat(100)] })) {
    for (const valor of valores) assert.deepEqual(validarConsulta({ ...datos, [campo]: valor }), {});
  }
  let llamadas = 0;
  const api = crearApiAcademia(async () => { llamadas++; });
  await assert.rejects(api.crearConsulta({ ...datos, mensaje: 'corto' }), { code: 'VALIDACION_CONSULTA' });
  assert.equal(llamadas, 0);
});

test('asunto libre demasiado largo se rechaza sin truncar ni enviar', async () => {
  const asunto = 'a'.repeat(201);
  const entrada = { ...datos, asunto };
  let llamadas = 0;
  const api = crearApiAcademia(async () => { llamadas++; });
  assert.equal(contextoConsulta({ asunto }).asunto, asunto);
  await assert.rejects(api.crearConsulta(entrada), { code: 'VALIDACION_CONSULTA' });
  assert.equal(entrada.asunto, asunto);
  assert.equal(llamadas, 0);
});

test('consulta general omite opcionales vacíos y propiedades ajenas', async () => {
  const api = crearApiAcademia(async (path, options) => ({ path, ...options }));
  const resultado = await api.crearConsulta({ ...datos, telefono: ' ', estado: 'RESPONDIDA' });
  assert.deepEqual(Object.keys(resultado.body).sort(), ['asunto', 'correo', 'mensaje', 'nombre']);
});

test('rechazo del servidor o red conserva datos y mensaje sin reintentar', async () => {
  for (const status of [400, 404, 500, null]) {
    let llamadas = 0;
    const copia = { ...datos, cursoId };
    const api = crearApiAcademia(crearCliente({ baseUrl: '/api', fetchImpl: async () => {
      llamadas++;
      if (status === null) throw new TypeError('offline');
      return Response.json({ error: { mensaje: 'No se pudo guardar la consulta.', codigo: 'RECHAZADA' } }, { status });
    } }));
    await assert.rejects(api.crearConsulta(copia), status === null ? { code: 'ERROR_RED' } : { status, message: 'No se pudo guardar la consulta.' });
    assert.equal(llamadas, 1);
    assert.deepEqual(copia, { ...datos, cursoId });
  }
});

test('contexto refleja navegación nueva y solo acepta identificadores de texto', () => {
  assert.deepEqual(contextoConsulta(null), { asunto: '' });
  assert.deepEqual(contextoConsulta({ cursoId: 42, asunto: {} }), { asunto: '' });
  assert.deepEqual(contextoConsulta({ cursoId, asunto: 'Curso A' }), { cursoId, asunto: 'Curso A' });
  assert.deepEqual(contextoConsulta({ cursoId: 'otro', asunto: 'Curso B' }), { cursoId: 'otro', asunto: 'Curso B' });
});
