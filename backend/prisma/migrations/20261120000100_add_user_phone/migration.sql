-- Nullable by design: legacy administrators keep NULL until they provide a phone.
ALTER TABLE "usuarios" ADD COLUMN "telefono" TEXT;
