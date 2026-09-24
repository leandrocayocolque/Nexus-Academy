import { describe, expect, it } from 'vitest';
import { crearServicioContrasenas } from '../../../src/shared/security/contrasenas.js';
import {
  crearTokenRestablecimiento,
  hashearTokenRestablecimiento
} from '../../../src/shared/security/tokensRestablecimiento.js';

describe('helpers criptográficos de identidad', () => {
  it('hashea y verifica bcrypt con rondas configurables', async () => {
    const servicio = crearServicioContrasenas({ rondas: 10 });
    const hash = await servicio.hashear('ClaveSegura123');

    expect(servicio.rondas).toBe(10);
    expect(hash).not.toContain('ClaveSegura123');
    await expect(servicio.verificar('ClaveSegura123', hash)).resolves.toBe(true);
    await expect(servicio.verificar('ClaveIncorrecta123', hash)).resolves.toBe(false);
  });

  it('genera tokens opacos y produce únicamente su hash SHA-256 persistible', () => {
    const primero = crearTokenRestablecimiento();
    const segundo = crearTokenRestablecimiento();
    const hash = hashearTokenRestablecimiento(primero);

    expect(primero).toHaveLength(43);
    expect(segundo).not.toBe(primero);
    expect(hash).toMatch(/^[a-f\d]{64}$/);
    expect(hash).not.toContain(primero);
  });
});
