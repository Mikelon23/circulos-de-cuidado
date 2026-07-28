# Servicios gratuitos (stack zero-cost)

Documento: Lista y recomendaciones de servicios con planes gratuitos para implementar un proyecto "zero-cost".

## Objetivo
Proveer alternativas prácticas y combinables para desplegar frontend, backend, base de datos, vídeo y envío de emails usando principalmente planes gratuitos.

## Consideraciones generales
- Los planes gratuitos suelen tener límites (requests, ejecución en segundo plano, almacenamiento, número de conexiones, límites de envío de email). Revisar condiciones antes de producción.
- Priorizar servicios que soporten: despliegue continuo (Git), SSL automático, rollbacks y múltiples regiones si es posible.
- Evitar vendor lock-in: preferir estándares (GitHub Actions, Postgres, S3-compatible storage).

## Frontend (static / SPA)
- **Vercel (free)**: despliegue estático y serverless para React/Vite. Integración con Git, previews de PR.
- **Netlify (free)**: hosting estático + funciones serverless, CDN global.
- **GitHub Pages**: hosting estático para páginas estáticas (ideal para landing y docs).

Uso recomendado: desplegar `apps/web` en Vercel o Netlify ligado a main/PRs.

## Backend (APIs)
- **Railway (free)**: rápido deploy para Node/Express, ofrece Postgres y envs.
- **Render (free tier)** / **Fly.io (free credits)**: alternativas para servicios web con instancias pequeñas.
- **Vercel Serverless Functions** / **Netlify Functions**: para APIs ligeras sin servidor dedicado.

Uso recomendado: APIs pequeñas y endpoints públicos en Vercel Functions; si se necesita base de datos, usar Railway o Supabase.

## Bases de datos
- **Supabase (free)**: Postgres gestionado, autenticación, realtime y storage básico. Muy útil para prototipos.
- **Neon (free)** / **PlanetScale (free)**: Postgres/MariaDB serverless con planes gratuitos para desarrollo.
- **SQLite**: opción local o en disco para despliegues sin DB gestionada (más simple pero menos adecuada para escalado).

Uso recomendado: Supabase para acelerar desarrollo (esquema Postgres + auth integrada).

## Autenticación
- **Supabase Auth (free)**: email/password, OAuth providers básicos.
- **Clerk / Auth0 (free tiers)**: proveedores para login social; revisar limitaciones de usuarios activos.

## Envío de email
- **SendGrid (free tier)**: envío de emails transaccionales limitado.
- **Mailgun (free tier)**: alternativas con límites similares.
- **SMTP propio**: usar un VPS barato o el SMTP del proveedor de correo si es una prueba local.

Uso recomendado: SendGrid para confirmaciones y recuperación de contraseña en desarrollo.

## Video y reuniones (comunicación en tiempo real)
- **Jitsi Meet (meet.jit.si)**: instancia pública gratuita para videoconferencias; se puede integrar en el frontend.
- **Daily.co (free tier)**: SDKs y salas con límite en minutos; buena experiencia para prototipos.

Uso recomendado: integrar Jitsi embed para sesiones de grupo en primera fase.

## Almacenamiento de archivos
- **Supabase Storage (free)**: storage S3-like básico incluido en el plan gratuito.
- **Cloudflare R2 (free tier)**: S3-compatible con ventajas en costos de salida, revisar cuota gratuita.

## Colas y realtime
- **Supabase Realtime**: buena para notificaciones en tiempo real en prototipos.
- **Pusher / Ably (free tiers)**: alternativas para websockets pub/sub con límites.

## CI / CD
- **GitHub Actions (free for public repos)**: pipelines de CI, build y deploy automáticos.
- **Vercel/Netlify**: integran despliegue desde Git sin configuración adicional.

## Observabilidad y errores
- **Sentry (free tier)**: captura de errores y trazas para backend/frontend.
- **Logflare / Logtail (free tiers)**: logs en tiempo real con planes de entrada.

## Recomendación de stack zero-cost (ejemplo)
- Frontend: `apps/web` desplegado en Vercel (previews de PR).
- Backend: Node/Express pequeño en Vercel Functions o Railway para endpoints que requieren ejecución continua.
- DB: Supabase (Postgres) para datos, auth y storage.
- Vídeo: Jitsi embed para sesiones grupales.
- Emails: SendGrid para envíos transaccionales.
- CI: GitHub Actions para lint, test y despliegue.

## Checklist mínimo para integrar estos servicios
- [ ] Configurar repositorio con secrets en GitHub (API keys, DB URLs, SENDGRID_API_KEY).
- [ ] Crear proyecto en Supabase y migrar esquema inicial (o usar seeds para dev).
- [ ] Configurar despliegue automático en Vercel/Netlify.
- [ ] Probar envío de correos en entorno de staging.
- [ ] Probar integración de Jitsi en la vista de sala.

## Notas finales
- Revisar límites y políticas de uso de cada proveedor antes de confiar en el servicio para producción.
- Para crecimiento se recomienda migrar a planes pagos o infra más robusta (p. ej. proveedores gestionados, clusters DB, etc.).

---

Archivo generado para la Tarea 08 del roadmap: `docs/SERVICIOS_GRATUITOS.md`.
