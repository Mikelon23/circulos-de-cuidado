CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "usuarios" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255),
    "nombre_real" VARCHAR(255),
    "nombre_visible" VARCHAR(255),
    "avatar_url" TEXT,
    "rol" VARCHAR(20) NOT NULL,
    "email_verificado" BOOLEAN NOT NULL DEFAULT FALSE,
    "anonimo" BOOLEAN NOT NULL DEFAULT FALSE,
    "oauth_provider" VARCHAR(50),
    "oauth_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMPTZ
);

CREATE TABLE "perfil_cuidador" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL UNIQUE,
    "edad" INTEGER,
    "enfermedad_principal" VARCHAR(255),
    "fase_cuidado" VARCHAR(50),
    "disponibilidad_horaria" JSONB,
    "idioma" VARCHAR(50),
    "ubicacion" VARCHAR(255),
    "urgencia" INTEGER,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "perfil_cuidador_usuario_id_fkey"
        FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE TABLE "facilitadores" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL UNIQUE,
    "experiencia_years" INTEGER,
    "especialidades" JSONB,
    "certificaciones" JSONB,
    "disponibilidad" JSONB,
    "calificacion_promedio" DECIMAL(3,2),
    "activo" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "facilitadores_usuario_id_fkey"
        FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE TABLE "circulos" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(255) NOT NULL,
    "tema" VARCHAR(255),
    "descripcion" TEXT,
    "facilitador_id" UUID,
    "capacidad_minima" INTEGER NOT NULL,
    "capacidad_maxima" INTEGER NOT NULL,
    "estado" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "circulos_facilitador_id_fkey"
        FOREIGN KEY ("facilitador_id") REFERENCES "facilitadores"("id") ON DELETE SET NULL
);

CREATE TABLE "miembros_circulo" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "circulo_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "rol" VARCHAR(20) NOT NULL,
    "estado" VARCHAR(20) NOT NULL,
    "fecha_ingreso" TIMESTAMPTZ,
    "fecha_salida" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "miembros_circulo_circulo_id_fkey"
        FOREIGN KEY ("circulo_id") REFERENCES "circulos"("id") ON DELETE CASCADE,
    CONSTRAINT "miembros_circulo_usuario_id_fkey"
        FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE,
    CONSTRAINT "miembros_circulo_unique"
        UNIQUE ("circulo_id", "usuario_id")
);

CREATE TABLE "sesiones" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "circulo_id" UUID NOT NULL,
    "facilitador_id" UUID,
    "titulo" VARCHAR(255) NOT NULL,
    "fecha_programada" TIMESTAMPTZ NOT NULL,
    "duracion_minutos" INTEGER NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "estado" VARCHAR(20) NOT NULL,
    "enlace_reunion" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "sesiones_circulo_id_fkey"
        FOREIGN KEY ("circulo_id") REFERENCES "circulos"("id") ON DELETE CASCADE,
    CONSTRAINT "sesiones_facilitador_id_fkey"
        FOREIGN KEY ("facilitador_id") REFERENCES "facilitadores"("id") ON DELETE SET NULL
);

CREATE TABLE "mensajes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "circulo_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "reply_to_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "mensajes_circulo_id_fkey"
        FOREIGN KEY ("circulo_id") REFERENCES "circulos"("id") ON DELETE CASCADE,
    CONSTRAINT "mensajes_usuario_id_fkey"
        FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE,
    CONSTRAINT "mensajes_reply_to_id_fkey"
        FOREIGN KEY ("reply_to_id") REFERENCES "mensajes"("id") ON DELETE SET NULL
);

CREATE TABLE "check_ins_emocionales" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "pregunta" VARCHAR(255) NOT NULL,
    "escala" INTEGER NOT NULL,
    "nota" TEXT,
    "respondido_en" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "check_ins_usuario_id_fkey"
        FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE INDEX "perfil_cuidador_usuario_id_idx" ON "perfil_cuidador" ("usuario_id");
CREATE INDEX "circulos_facilitador_id_idx" ON "circulos" ("facilitador_id");
CREATE INDEX "miembros_circulo_circulo_id_idx" ON "miembros_circulo" ("circulo_id");
CREATE INDEX "miembros_circulo_usuario_id_idx" ON "miembros_circulo" ("usuario_id");
CREATE INDEX "sesiones_circulo_id_idx" ON "sesiones" ("circulo_id");
CREATE INDEX "sesiones_facilitador_id_idx" ON "sesiones" ("facilitador_id");
CREATE INDEX "mensajes_circulo_id_idx" ON "mensajes" ("circulo_id");
CREATE INDEX "mensajes_usuario_id_idx" ON "mensajes" ("usuario_id");
CREATE INDEX "check_ins_usuario_id_idx" ON "check_ins_emocionales" ("usuario_id");
