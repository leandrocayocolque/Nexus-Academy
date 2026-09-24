-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "NivelCurso" AS ENUM ('PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO', 'TODOS_LOS_NIVELES');

-- CreateEnum
CREATE TYPE "ModalidadCurso" AS ENUM ('EN_LINEA', 'PRESENCIAL', 'HIBRIDA');

-- CreateEnum
CREATE TYPE "EstadoConsulta" AS ENUM ('PENDIENTE', 'LEIDA', 'RESPONDIDA');

-- CreateEnum
CREATE TYPE "EstadoPromocion" AS ENUM ('ACTIVA', 'INACTIVA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "hash_contrasena" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'ADMIN',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocios" (
    "id" TEXT NOT NULL,
    "clave_unica" TEXT NOT NULL DEFAULT 'negocio',
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "enlaces_sociales" JSONB,
    "horarios_atencion" JSONB,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "negocios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "negocios_clave_unica_check" CHECK ("clave_unica" = 'negocio')
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracion" TEXT NOT NULL,
    "cupos_disponibles" INTEGER NOT NULL DEFAULT 0,
    "fecha_inicio" TIMESTAMPTZ(3) NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "nivel" "NivelCurso" NOT NULL DEFAULT 'TODOS_LOS_NIVELES',
    "modalidad" "ModalidadCurso" NOT NULL DEFAULT 'PRESENCIAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cursos_cupos_disponibles_check" CHECK ("cupos_disponibles" >= 0),
    CONSTRAINT "cursos_precio_check" CHECK ("precio" >= 0)
);

-- CreateTable
CREATE TABLE "imagenes_curso" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "id_publico" TEXT,
    "texto_alternativo" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imagenes_curso_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "imagenes_curso_orden_check" CHECK ("orden" >= 0)
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" "EstadoConsulta" NOT NULL DEFAULT 'PENDIENTE',
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promociones" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "porcentaje_descuento" INTEGER,
    "estado" "EstadoPromocion" NOT NULL DEFAULT 'ACTIVA',
    "fecha_inicio" TIMESTAMPTZ(3),
    "fecha_fin" TIMESTAMPTZ(3),
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "promociones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promociones_porcentaje_descuento_check" CHECK ("porcentaje_descuento" IS NULL OR "porcentaje_descuento" BETWEEN 0 AND 100),
    CONSTRAINT "promociones_fechas_check" CHECK ("fecha_inicio" IS NULL OR "fecha_fin" IS NULL OR "fecha_inicio" <= "fecha_fin")
);

-- CreateTable
CREATE TABLE "tokens_restablecimiento" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "hash_token" TEXT NOT NULL,
    "expira_en" TIMESTAMPTZ(3) NOT NULL,
    "usado_en" TIMESTAMPTZ(3),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_restablecimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");
CREATE INDEX "usuarios_activo_idx" ON "usuarios"("activo");
CREATE UNIQUE INDEX "negocios_clave_unica_key" ON "negocios"("clave_unica");
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");
CREATE INDEX "categorias_activa_idx" ON "categorias"("activa");
CREATE UNIQUE INDEX "cursos_slug_key" ON "cursos"("slug");
CREATE INDEX "cursos_categoria_id_activo_idx" ON "cursos"("categoria_id", "activo");
CREATE INDEX "cursos_activo_fecha_inicio_idx" ON "cursos"("activo", "fecha_inicio");
CREATE INDEX "cursos_modalidad_activo_idx" ON "cursos"("modalidad", "activo");
CREATE INDEX "cursos_destacado_activo_idx" ON "cursos"("destacado", "activo");
CREATE UNIQUE INDEX "imagenes_curso_id_publico_key" ON "imagenes_curso"("id_publico");
CREATE INDEX "imagenes_curso_curso_id_orden_idx" ON "imagenes_curso"("curso_id", "orden");
CREATE INDEX "consultas_curso_id_idx" ON "consultas"("curso_id");
CREATE INDEX "consultas_estado_creada_en_idx" ON "consultas"("estado", "creada_en");
CREATE INDEX "consultas_correo_idx" ON "consultas"("correo");
CREATE INDEX "promociones_curso_id_idx" ON "promociones"("curso_id");
CREATE INDEX "promociones_estado_fecha_inicio_fecha_fin_idx" ON "promociones"("estado", "fecha_inicio", "fecha_fin");
CREATE UNIQUE INDEX "tokens_restablecimiento_hash_token_key" ON "tokens_restablecimiento"("hash_token");
CREATE INDEX "tokens_restablecimiento_usuario_id_usado_en_expira_en_idx" ON "tokens_restablecimiento"("usuario_id", "usado_en", "expira_en");

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "imagenes_curso" ADD CONSTRAINT "imagenes_curso_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tokens_restablecimiento" ADD CONSTRAINT "tokens_restablecimiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
