import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ErrorCategoriaEnUso } from '../../src/shared/errors/AppError.js';
import { crearAppPrueba, crearServiciosSimulados, tokenAdmin } from './helpers.js';

const LISTADO = { datos: [], paginacion: { total: 0, pagina: 1, limite: 12, paginasTotales: 0 } };

describe('API de categorías', () => {
  it('lista públicamente sólo categorías activas aunque se pida lo contrario', async () => {
    const servicios = crearServiciosSimulados();
    servicios.categorias.listarCategorias.mockResolvedValue(LISTADO);

    await request(crearAppPrueba(servicios))
      .get('/api/categorias?buscar=diseno&activa=false&pagina=2')
      .expect(200, LISTADO);
    expect(servicios.categorias.listarCategorias).toHaveBeenCalledWith({
      buscar: 'diseno',
      activa: true,
      pagina: '2'
    });
  });

  it('lista todas las categorías para administración', async () => {
    const servicios = crearServiciosSimulados();
    servicios.categorias.listarCategorias.mockResolvedValue(LISTADO);

    await request(crearAppPrueba(servicios))
      .get('/api/admin/categorias?activa=false')
      .set('Authorization', tokenAdmin())
      .expect(200);
    expect(servicios.categorias.listarCategorias).toHaveBeenCalledWith({ activa: 'false' });
  });

  it('crea, modifica y elimina categorías como administrador', async () => {
    const servicios = crearServiciosSimulados();
    servicios.categorias.crearCategoria.mockResolvedValue({ id: 'c1' });
    servicios.categorias.actualizarCategoria.mockResolvedValue({ id: 'c1', nombre: 'B' });
    servicios.categorias.eliminarCategoria.mockResolvedValue({ mensaje: 'ok' });
    const aplicacion = crearAppPrueba(servicios);
    const autorizacion = tokenAdmin();

    await request(aplicacion)
      .post('/api/admin/categorias')
      .set('Authorization', autorizacion)
      .send({ nombre: 'A' })
      .expect(201, { id: 'c1' });
    await request(aplicacion)
      .patch('/api/admin/categorias/c1')
      .set('Authorization', autorizacion)
      .send({ nombre: 'B' })
      .expect(200, { id: 'c1', nombre: 'B' });
    await request(aplicacion)
      .delete('/api/admin/categorias/c1')
      .set('Authorization', autorizacion)
      .expect(200, { mensaje: 'ok' });

    expect(servicios.categorias.actualizarCategoria).toHaveBeenCalledWith('c1', { nombre: 'B' });
    expect(servicios.categorias.eliminarCategoria).toHaveBeenCalledWith('c1');
  });

  it('responde 409 al eliminar una categoría en uso', async () => {
    const servicios = crearServiciosSimulados();
    servicios.categorias.eliminarCategoria.mockRejectedValue(new ErrorCategoriaEnUso());

    await request(crearAppPrueba(servicios))
      .delete('/api/admin/categorias/c1')
      .set('Authorization', tokenAdmin())
      .expect(409)
      .expect(({ body }) => expect(body.error.codigo).toBe('CATEGORIA_EN_USO'));
  });

  it('protege las rutas de administración', async () => {
    const servicios = crearServiciosSimulados();
    await request(crearAppPrueba(servicios))
      .post('/api/admin/categorias')
      .send({ nombre: 'A' })
      .expect(401);
    expect(servicios.categorias.crearCategoria).not.toHaveBeenCalled();
  });
});
