import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../../../', import.meta.url));

const leerArchivoProyecto = (ruta) =>
  readFile(new URL(ruta, `file:///${raiz.replaceAll('\\', '/')}/`), 'utf8');

describe('base de persistencia Prisma', () => {
  it('define los ocho modelos solicitados sin disponibilidad, capacidad ni estado persistidos', async () => {
    const esquema = await leerArchivoProyecto('prisma/schema.prisma');
    const modelos = [...esquema.matchAll(/^model\s+(\w+)\s+\{/gm)].map(
      (coincidencia) => coincidencia[1]
    );

    expect(modelos).toEqual([
      'Usuario',
      'Negocio',
      'Categoria',
      'Curso',
      'ImagenCurso',
      'Consulta',
      'Promocion',
      'TokenRestablecimiento'
    ]);
    const curso = esquema.match(/model Curso \{([\s\S]*?)^\}/m)?.[1] ?? '';
    expect(curso).toContain('activo');
    expect(curso).not.toMatch(/^\s*(capacidad|estado|disponible|capacity|status|isAvailable)\s/m);
    expect(curso).toContain('@db.Decimal(10, 2)');
  });

  it('incluye restricciones PostgreSQL y las reglas de eliminación solicitadas', async () => {
    const esquema = await leerArchivoProyecto('prisma/schema.prisma');
    const migracion = await leerArchivoProyecto(
      'prisma/migrations/20260923000000_init/migration.sql'
    );

    expect(esquema).toContain('onDelete: Restrict');
    expect(esquema).toContain('onDelete: Cascade');
    expect(esquema.match(/onDelete: SetNull/g)).toHaveLength(2);
    expect(migracion).toContain('CHECK ("cupos_disponibles" >= 0)');
    expect(migracion).toContain('CHECK ("precio" >= 0)');
    expect(migracion).toContain(
      'CHECK ("porcentaje_descuento" IS NULL OR "porcentaje_descuento" BETWEEN 0 AND 100)'
    );
    expect(migracion).toContain(
      'CHECK ("fecha_inicio" IS NULL OR "fecha_fin" IS NULL OR "fecha_inicio" <= "fecha_fin")'
    );
  });
});
