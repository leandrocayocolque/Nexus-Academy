import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearServicioDashboard } from '../../src/modules/dashboard/dashboard.service.js';
import {
  ErrorConsultaNoEncontrada,
  ErrorPromocionNoEncontrada
} from '../../src/shared/errors/AppError.js';
import { crearLimitador } from '../../src/shared/middlewares/rateLimiters.js';
import { crearAppPrueba, crearServiciosSimulados, tokenAdmin } from './helpers.js';

const CONSULTA = {
  nombre: 'Persona',
  correo: 'persona@example.com',
  asunto: 'Información',
  mensaje: 'Quisiera recibir más información.'
};

describe('API de consultas', () => {
  it('recibe consultas públicas', async () => {
    const servicios = crearServiciosSimulados();
    servicios.consultas.crearConsulta.mockResolvedValue({ id: 'q1', estado: 'PENDIENTE' });

    await request(crearAppPrueba(servicios))
      .post('/api/consultas')
      .send(CONSULTA)
      .expect(201, { id: 'q1', estado: 'PENDIENTE' });
    expect(servicios.consultas.crearConsulta).toHaveBeenCalledWith(CONSULTA);
  });

  it('limita el envío de consultas', async () => {
    const aplicacion = crearAppPrueba(crearServiciosSimulados(), {
      limitadorConsulta: crearLimitador({ ventanaMs: 60_000, maximo: 1 })
    });

    await request(aplicacion).post('/api/consultas').send(CONSULTA).expect(201);
    await request(aplicacion).post('/api/consultas').send(CONSULTA).expect(429);
  });

  it('gestiona las consultas como administrador', async () => {
    const servicios = crearServiciosSimulados();
    servicios.consultas.cambiarEstadoConsulta.mockResolvedValue({ id: 'q1', estado: 'LEIDA' });
    const aplicacion = crearAppPrueba(servicios);
    const autorizacion = tokenAdmin();

    await request(aplicacion)
      .get('/api/admin/consultas?estado=PENDIENTE')
      .set('Authorization', autorizacion)
      .expect(200);
    await request(aplicacion)
      .get('/api/admin/consultas/q1')
      .set('Authorization', autorizacion)
      .expect(200);
    await request(aplicacion)
      .patch('/api/admin/consultas/q1/estado')
      .set('Authorization', autorizacion)
      .send({ estado: 'LEIDA' })
      .expect(200, { id: 'q1', estado: 'LEIDA' });
    await request(aplicacion)
      .delete('/api/admin/consultas/q1')
      .set('Authorization', autorizacion)
      .expect(200);

    expect(servicios.consultas.listarConsultas).toHaveBeenCalledWith({ estado: 'PENDIENTE' });
    expect(servicios.consultas.obtenerConsulta).toHaveBeenCalledWith('q1');
    expect(servicios.consultas.cambiarEstadoConsulta).toHaveBeenCalledWith('q1', {
      estado: 'LEIDA'
    });
    expect(servicios.consultas.eliminarConsulta).toHaveBeenCalledWith('q1');
  });

  it('no expone el listado sin autenticación y traduce 404', async () => {
    const servicios = crearServiciosSimulados();
    servicios.consultas.obtenerConsulta.mockRejectedValue(new ErrorConsultaNoEncontrada());
    const aplicacion = crearAppPrueba(servicios);

    await request(aplicacion).get('/api/admin/consultas').expect(401);
    await request(aplicacion)
      .get('/api/admin/consultas/nada')
      .set('Authorization', tokenAdmin())
      .expect(404);
  });
});

describe('API de promociones', () => {
  it('lista públicamente sólo las promociones vigentes', async () => {
    const servicios = crearServiciosSimulados();
    servicios.promociones.listarPromocionesActivas.mockResolvedValue({ datos: [] });

    await request(crearAppPrueba(servicios))
      .get('/api/promociones?buscar=verano')
      .expect(200, { datos: [] });
    expect(servicios.promociones.listarPromocionesActivas).toHaveBeenCalledWith({
      buscar: 'verano'
    });
    expect(servicios.promociones.listarPromocionesAdministracion).not.toHaveBeenCalled();
  });

  it('administra promociones', async () => {
    const servicios = crearServiciosSimulados();
    servicios.promociones.crearPromocion.mockResolvedValue({ id: 'p1' });
    servicios.promociones.eliminarPromocion.mockRejectedValue(new ErrorPromocionNoEncontrada());
    const aplicacion = crearAppPrueba(servicios);
    const autorizacion = tokenAdmin();
    const promocion = { titulo: 'Verano', porcentajeDescuento: 20 };

    await request(aplicacion)
      .get('/api/admin/promociones?estado=INACTIVA')
      .set('Authorization', autorizacion)
      .expect(200);
    await request(aplicacion)
      .post('/api/admin/promociones')
      .set('Authorization', autorizacion)
      .send(promocion)
      .expect(201, { id: 'p1' });
    await request(aplicacion)
      .patch('/api/admin/promociones/p1')
      .set('Authorization', autorizacion)
      .send({ porcentajeDescuento: 30 })
      .expect(200);
    await request(aplicacion)
      .delete('/api/admin/promociones/p1')
      .set('Authorization', autorizacion)
      .expect(404);

    expect(servicios.promociones.crearPromocion).toHaveBeenCalledWith(promocion);
    expect(servicios.promociones.actualizarPromocion).toHaveBeenCalledWith('p1', {
      porcentajeDescuento: 30
    });
  });
});

describe('API de dashboard', () => {
  it('arma el período desde los query params y devuelve las métricas', async () => {
    const repositorioDashboard = {
      obtenerResumen: async () => ({ cursos: 24 }),
      obtenerConsultasPorEstado: async () => [],
      obtenerConsultasPorMes: async (periodo) => [periodo],
      obtenerCursosMasConsultados: async () => [],
      obtenerCategoriasMasConsultadas: async () => [],
      obtenerCursosConBajaDisponibilidad: async () => []
    };
    const servicios = crearServiciosSimulados({
      dashboard: crearServicioDashboard({ repositorioDashboard })
    });
    const aplicacion = crearAppPrueba(servicios);

    const respuesta = await request(aplicacion)
      .get('/api/admin/dashboard?desde=2027-01-01&hasta=2027-06-30&limite=5')
      .set('Authorization', tokenAdmin())
      .expect(200);

    expect(respuesta.body.resumen).toEqual({ cursos: 24 });
    expect(respuesta.body.consultasPorMes[0]).toEqual({
      desde: '2027-01-01T00:00:00.000Z',
      hasta: '2027-06-30T00:00:00.000Z'
    });

    await request(aplicacion)
      .get('/api/admin/dashboard?desde=2027-06-30&hasta=2027-01-01')
      .set('Authorization', tokenAdmin())
      .expect(400);
    await request(aplicacion).get('/api/admin/dashboard').expect(401);
  });
});
