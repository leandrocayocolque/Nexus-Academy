import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearAppPrueba } from './helpers.js';

const ENDPOINTS_DOCUMENTADOS = [
  ['post', '/api/autenticacion/registro'],
  ['post', '/api/autenticacion/login'],
  ['post', '/api/autenticacion/logout'],
  ['post', '/api/autenticacion/recuperar-contrasena'],
  ['post', '/api/autenticacion/restablecer-contrasena'],
  ['get', '/api/usuarios/me'],
  ['patch', '/api/usuarios/me'],
  ['get', '/api/academia'],
  ['put', '/api/admin/academia'],
  ['get', '/api/categorias'],
  ['post', '/api/admin/categorias'],
  ['patch', '/api/admin/categorias/{id}'],
  ['delete', '/api/admin/categorias/{id}'],
  ['get', '/api/cursos'],
  ['get', '/api/cursos/{id}'],
  ['post', '/api/admin/cursos'],
  ['patch', '/api/admin/cursos/{id}'],
  ['delete', '/api/admin/cursos/{id}'],
  ['patch', '/api/admin/cursos/{id}/estado'],
  ['patch', '/api/admin/cursos/{id}/destacado'],
  ['post', '/api/admin/cursos/{id}/imagenes'],
  ['delete', '/api/admin/cursos/{id}/imagenes/{imagenId}'],
  ['post', '/api/consultas'],
  ['get', '/api/admin/consultas'],
  ['get', '/api/admin/consultas/{id}'],
  ['patch', '/api/admin/consultas/{id}/estado'],
  ['delete', '/api/admin/consultas/{id}'],
  ['get', '/api/promociones'],
  ['post', '/api/admin/promociones'],
  ['patch', '/api/admin/promociones/{id}'],
  ['delete', '/api/admin/promociones/{id}'],
  ['get', '/api/admin/dashboard']
];

describe('Documentación OpenAPI', () => {
  it('publica la especificación con todos los endpoints del contrato', async () => {
    const { body } = await request(crearAppPrueba()).get('/api/docs.json').expect(200);

    expect(body.openapi).toBe('3.0.3');
    for (const [metodo, ruta] of ENDPOINTS_DOCUMENTADOS) {
      expect(body.paths[ruta]?.[metodo], `${metodo.toUpperCase()} ${ruta}`).toBeDefined();
    }
  });

  it('sirve Swagger UI en /api/docs', async () => {
    const respuesta = await request(crearAppPrueba()).get('/api/docs/').expect(200);
    expect(respuesta.text).toContain('swagger-ui');
  });

  it('autoriza Swagger UI con el token del login y lo conserva al recargar', async () => {
    const { text } = await request(crearAppPrueba())
      .get('/api/docs/swagger-ui-init.js')
      .expect(200);
    expect(text).toContain('persistAuthorization');
    expect(text).toContain("preauthorizeApiKey('bearerAuth', token)");
  });
});
