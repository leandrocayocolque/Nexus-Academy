import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ErrorNegocioNoEncontrado } from '../../src/shared/errors/AppError.js';
import { crearAppPrueba, crearServiciosSimulados, ID_ADMIN, tokenAdmin } from './helpers.js';

describe('API de usuario', () => {
  it('obtiene y modifica el perfil del administrador autenticado', async () => {
    const servicios = crearServiciosSimulados();
    servicios.usuarios.obtenerUsuarioActual.mockResolvedValue({ id: ID_ADMIN });
    servicios.usuarios.actualizarPerfil.mockResolvedValue({ id: ID_ADMIN, nombre: 'Ana' });
    const aplicacion = crearAppPrueba(servicios);

    await request(aplicacion)
      .get('/api/usuarios/me')
      .set('Authorization', tokenAdmin())
      .expect(200, { id: ID_ADMIN });
    expect(servicios.usuarios.obtenerUsuarioActual).toHaveBeenCalledWith(ID_ADMIN);

    await request(aplicacion)
      .patch('/api/usuarios/me')
      .set('Authorization', tokenAdmin())
      .send({ nombre: 'Ana' })
      .expect(200, { id: ID_ADMIN, nombre: 'Ana' });
    expect(servicios.usuarios.actualizarPerfil).toHaveBeenCalledWith(ID_ADMIN, { nombre: 'Ana' });
  });

  it('requiere autenticación', async () => {
    const servicios = crearServiciosSimulados();
    await request(crearAppPrueba(servicios)).get('/api/usuarios/me').expect(401);
    await request(crearAppPrueba(servicios))
      .patch('/api/usuarios/me')
      .send({ nombre: 'Ana' })
      .expect(401);
    expect(servicios.usuarios.actualizarPerfil).not.toHaveBeenCalled();
  });
});

describe('API de academia', () => {
  it('expone la información institucional sin autenticación', async () => {
    const servicios = crearServiciosSimulados();
    servicios.negocio.obtenerNegocio.mockResolvedValue({ nombre: 'NEXUS' });

    await request(crearAppPrueba(servicios)).get('/api/academia').expect(200, { nombre: 'NEXUS' });
  });

  it('responde 404 si la academia no está configurada', async () => {
    const servicios = crearServiciosSimulados();
    servicios.negocio.obtenerNegocio.mockRejectedValue(new ErrorNegocioNoEncontrado());

    await request(crearAppPrueba(servicios))
      .get('/api/academia')
      .expect(404)
      .expect(({ body }) => expect(body.error.codigo).toBe('NEGOCIO_NO_ENCONTRADO'));
  });

  it('modifica la información sólo como administrador', async () => {
    const servicios = crearServiciosSimulados();
    servicios.negocio.actualizarNegocio.mockResolvedValue({ nombre: 'Nuevo' });
    const aplicacion = crearAppPrueba(servicios);

    await request(aplicacion).put('/api/admin/academia').send({ nombre: 'Nuevo' }).expect(401);
    await request(aplicacion)
      .put('/api/admin/academia')
      .set('Authorization', tokenAdmin())
      .send({ nombre: 'Nuevo', telefono: '123' })
      .expect(200, { nombre: 'Nuevo' });
    expect(servicios.negocio.actualizarNegocio).toHaveBeenCalledWith({
      nombre: 'Nuevo',
      telefono: '123'
    });
  });
});
