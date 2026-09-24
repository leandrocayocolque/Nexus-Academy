import { describe, expect, it, vi } from 'vitest';
import { crearServicios } from '../../src/composition.js';
import { ProveedorAlmacenamientoImagenesMemoria } from '../../src/providers/cloudinary/imageStorage.provider.js';
import { ProveedorCorreoMemoria } from '../../src/providers/email/email.provider.js';

const funcion = () => vi.fn();

function crearRepositorios() {
  return {
    usuarios: {
      buscarPorCorreo: funcion(),
      existePorCorreo: funcion(),
      crear: funcion(),
      buscarPorId: funcion(),
      actualizar: funcion()
    },
    tokensRestablecimiento: { buscarPorHash: funcion() },
    negocio: { obtener: funcion(), actualizar: funcion() },
    categorias: {
      buscarPorId: funcion(),
      buscarPorSlug: funcion(),
      existePorSlug: funcion(),
      existePorNombre: funcion(),
      listar: funcion(),
      crear: funcion(),
      actualizar: funcion(),
      eliminar: funcion()
    },
    cursos: {
      buscarPorId: funcion(),
      buscarPorSlug: funcion(),
      existePorSlug: funcion(),
      listar: funcion(),
      crear: funcion(),
      actualizar: funcion(),
      eliminar: funcion()
    },
    consultas: {
      buscarPorId: funcion(),
      listar: funcion(),
      crear: funcion(),
      actualizarEstado: funcion(),
      eliminar: funcion()
    },
    promociones: {
      buscarPorId: funcion(),
      listar: funcion(),
      crear: funcion(),
      actualizar: funcion(),
      eliminar: funcion()
    },
    dashboard: {
      obtenerResumen: funcion(),
      obtenerConsultasPorEstado: funcion(),
      obtenerConsultasPorMes: funcion(),
      obtenerCursosMasConsultados: funcion(),
      obtenerCategoriasMasConsultadas: funcion(),
      obtenerCursosConBajaDisponibilidad: funcion()
    }
  };
}

describe('Composición de proveedores', () => {
  it('inyecta correo y almacenamiento en servicios sin SDKs externos', async () => {
    const repositorios = crearRepositorios();
    repositorios.consultas.crear.mockResolvedValue({
      id: 'consulta-1',
      nombre: 'Persona',
      correo: 'persona@example.com',
      asunto: 'Información',
      mensaje: 'Quisiera recibir más información.',
      estado: 'PENDIENTE'
    });
    const proveedorCorreo = new ProveedorCorreoMemoria();
    const proveedorImagenes = new ProveedorAlmacenamientoImagenesMemoria();
    const servicios = crearServicios({
      repositorios,
      gestorTransacciones: { ejecutar: funcion() },
      proveedorCorreo,
      proveedorImagenes,
      registrador: { warn: funcion(), error: funcion() }
    });

    await servicios.consultas.crearConsulta({
      nombre: 'Persona',
      correo: 'persona@example.com',
      asunto: 'Información',
      mensaje: 'Quisiera recibir más información.'
    });

    expect(proveedorCorreo.mensajes).toHaveLength(1);
    expect(proveedorCorreo.mensajes[0]).toMatchObject({
      tipo: 'NUEVA_CONSULTA',
      consulta: { id: 'consulta-1' }
    });
    expect(servicios.cursos).toBeDefined();
    expect(servicios.autenticacion).toBeDefined();
  });
});
