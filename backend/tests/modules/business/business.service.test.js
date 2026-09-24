import { describe, expect, it, vi } from 'vitest';
import { crearServicioNegocio } from '../../../src/modules/business/business.service.js';

function crearContexto() {
  const repositorioNegocio = {
    obtener: vi.fn(),
    actualizar: vi.fn()
  };
  return {
    repositorioNegocio,
    servicio: crearServicioNegocio({ repositorioNegocio })
  };
}

describe('Servicio de negocio', () => {
  it('obtiene el singleton configurado', async () => {
    const { servicio, repositorioNegocio } = crearContexto();
    repositorioNegocio.obtener.mockResolvedValue({ id: 'negocio-1', nombre: 'NEXUS Academy' });

    await expect(servicio.obtenerNegocio()).resolves.toMatchObject({ nombre: 'NEXUS Academy' });
  });

  it('actualiza únicamente campos permitidos y normalizados', async () => {
    const { servicio, repositorioNegocio } = crearContexto();
    repositorioNegocio.obtener.mockResolvedValue({ id: 'negocio-1' });
    repositorioNegocio.actualizar.mockImplementation(async (datos) => ({
      id: 'negocio-1',
      ...datos
    }));

    await servicio.actualizarNegocio({
      nombre: ' NEXUS ',
      correo: ' HOLA@NEXUS.EXAMPLE ',
      enlacesSociales: { sitio: 'https://nexus.example' }
    });

    expect(repositorioNegocio.actualizar).toHaveBeenCalledWith({
      nombre: 'NEXUS',
      correo: 'hola@nexus.example',
      enlacesSociales: { sitio: 'https://nexus.example' }
    });
  });

  it('rechaza un singleton ausente y campos desconocidos', async () => {
    const { servicio, repositorioNegocio } = crearContexto();
    repositorioNegocio.obtener.mockResolvedValue(null);

    await expect(servicio.obtenerNegocio()).rejects.toMatchObject({
      codigo: 'NEGOCIO_NO_ENCONTRADO'
    });
    await expect(servicio.actualizarNegocio({ claveUnica: 'otra' })).rejects.toMatchObject({
      name: 'ZodError'
    });
  });
});
