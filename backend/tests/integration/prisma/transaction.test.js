import { describe, expect, it, vi } from 'vitest';
import { createTransactionManager } from '../../../src/database/transactionManager.js';

describe('transaction manager', () => {
  it('builds callback-scoped repositories from the transaction client', async () => {
    const tx = { marker: 'transaction-client' };
    const repositories = { marker: 'scoped-repositories' };
    const createRepositories = vi.fn((client) => (client === tx ? repositories : null));
    const prisma = { $transaction: vi.fn((work) => work(tx)) };

    const result = await createTransactionManager(prisma, createRepositories).run(
      (scoped) => scoped.marker
    );

    expect(result).toBe('scoped-repositories');
    expect(createRepositories).toHaveBeenCalledWith(tx);
  });

  it('propagates failure so Prisma can roll back the transaction', async () => {
    const prisma = { $transaction: vi.fn((work) => work({})) };
    const manager = createTransactionManager(prisma, () => ({}));

    await expect(
      manager.run(async () => {
        throw new Error('later write failed');
      })
    ).rejects.toThrow('later write failed');
  });
});
