import { describe, expect, it, vi } from 'vitest';
import { crearManejadorApagado } from '../../src/server.js';

describe('Apagado controlado', () => {
  it('cierra HTTP y base de datos una sola vez', async () => {
    const servidor = {
      listening: true,
      close: vi.fn((callback) => {
        servidor.listening = false;
        callback();
      })
    };
    const cicloVidaBaseDatos = { desconectar: vi.fn().mockResolvedValue(undefined) };
    const registrador = { info: vi.fn(), error: vi.fn() };
    const apagar = crearManejadorApagado({ servidor, cicloVidaBaseDatos, registrador });

    const primera = apagar('SIGTERM');
    const segunda = apagar('SIGINT');
    expect(segunda).toBe(primera);
    await primera;

    expect(servidor.close).toHaveBeenCalledOnce();
    expect(cicloVidaBaseDatos.desconectar).toHaveBeenCalledOnce();
    expect(registrador.error).not.toHaveBeenCalled();
  });
});
