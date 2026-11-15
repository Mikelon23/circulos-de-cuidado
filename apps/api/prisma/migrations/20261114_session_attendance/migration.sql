CREATE TABLE "asistencias_sesion" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sesion_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "primera_entrada" TIMESTAMPTZ,
    "ultima_entrada" TIMESTAMPTZ,
    "ultima_salida" TIMESTAMPTZ,
    "segundos_conectado" INTEGER NOT NULL DEFAULT 0,
    "numero_conexiones" INTEGER NOT NULL DEFAULT 0,
    "numero_participaciones" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "asistencias_sesion_sesion_id_fkey"
        FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE,
    CONSTRAINT "asistencias_sesion_usuario_id_fkey"
        FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE,
    CONSTRAINT "asistencias_sesion_sesion_usuario_unique"
        UNIQUE ("sesion_id", "usuario_id")
);

CREATE INDEX "asistencias_sesion_usuario_id_idx" ON "asistencias_sesion" ("usuario_id");
