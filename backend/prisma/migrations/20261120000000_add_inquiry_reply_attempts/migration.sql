-- Preparada manualmente. Aplicar únicamente con autorización operativa.
CREATE TYPE "EstadoRespuestaConsulta" AS ENUM ('ENVIANDO', 'ACEPTADA', 'FALLIDA', 'INCIERTA');

CREATE TABLE "respuestas_consulta" (
    "id" TEXT NOT NULL,
    "consulta_id" TEXT NOT NULL,
    "clave_idempotencia" VARCHAR(100) NOT NULL,
    "actor_id" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "mensaje" VARCHAR(5000) NOT NULL,
    "estado" "EstadoRespuestaConsulta" NOT NULL DEFAULT 'ENVIANDO',
    "proveedor_id" VARCHAR(500),
    "error_codigo" VARCHAR(100),
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizada_en" TIMESTAMPTZ(3),
    CONSTRAINT "respuestas_consulta_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "respuestas_consulta_mensaje_check" CHECK (length(trim("mensaje")) BETWEEN 1 AND 5000),
    CONSTRAINT "respuestas_consulta_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "respuestas_consulta_consulta_id_clave_idempotencia_key" ON "respuestas_consulta"("consulta_id", "clave_idempotencia");
CREATE INDEX "respuestas_consulta_consulta_id_creada_en_idx" ON "respuestas_consulta"("consulta_id", "creada_en");
