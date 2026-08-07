# Arquitectura técnica — Círculos de Cuidado

## 1. Filosofía de diseño

1. **Zero-cost**: la arquitectura prioriza herramientas y plataformas gratuitas o self-hosted, evitando gastos de infraestructura y servicios pagos.
2. **Open source**: el código permanece accesible bajo licencia MIT; las decisiones buscan maximizar transparencia y colaboración comunitaria.
3. **Privacidad primero**: se minimiza el tratamiento de datos sensibles, se protege la información de cuidadores y se emplean prácticas de seguridad desde el diseño.
4. **Escalable**: se define una base modular que permite crecer en usuarios y datos con cambios incrementales en despliegue y cache.
5. **Accesible**: el sistema debe ser usable en dispositivos móviles y escritorio, con UI ligera y opciones de accesibilidad para personas con diversidad funcional.

## 2. Stack tecnológico detallado

### Resumen general

- **Frontend**: React 19, Vite 6, Tailwind CSS 4, React Router 7, Zustand 5, React Query 5, Jitsi iframe, Web Push API.
- **Backend**: Node.js 22 LTS, Express 5, Prisma 6, PostgreSQL 16, Redis 7, JWT, bcryptjs, Zod, Socket.io, node-cron.
- **Shared**: TypeScript, Zod schemas, constantes compartidas.
- **DevOps**: Vercel, Railway, Supabase, Upstash Redis, Resend, GitHub Actions, Jitsi Meet, Cloudflare Pages.

### Comparativa de stack

| Área             | Tecnología elegida | Por qué                                                       | Alternativa mencionada | Motivo de elección                                                                           |
| ---------------- | ------------------ | ------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| Frontend         | React 19           | Ecosistema maduro, rendimiento, compatibilidad con Vite       | Next.js                | Next aporta SSR pero React + Vite ofrece simplicidad, builds rápidos y menor costo operativo |
| Bundler          | Vite 6             | Desarrollo instantáneo y compilación eficiente                | -                      | -                                                                                            |
| UI               | Tailwind CSS 4     | Estilos utilitarios, rápido prototipado y menor CSS custom    | -                      | -                                                                                            |
| Routing          | React Router 7     | Control claro de rutas SPA y navegación accesible             | -                      | -                                                                                            |
| Estado           | Zustand 5          | Ligero, simple y fácil de usar en apps pequeñas/medianas      | Redux                  | Más complejo y verboso                                                                       |
| Datos            | React Query 5      | Fetching y cache de datos optimizado, revalidación automática | SWR                    | Similar, pero React Query es más completo para este proyecto                                 |
| Video            | Jitsi iframe       | Video conferencia open source gratuita, fácil de integrar     | Twilio/Zoom/Daily      | Servicios pagos o no gratuitos                                                               |
| PWA              | Web Push API       | Permite notificaciones y engagement sin costo                 | -                      | -                                                                                            |
| Backend          | Node.js 22 LTS     | Soporte moderno, estabilidad y compatibilidad con Prisma      | -                      | -                                                                                            |
| Framework        | Express 5          | Minimalista, flexible y veloz para APIs sencillas             | Nest.js/Fastify        | Más estructurado o especializado, pero con mayor complejidad                                 |
| ORM              | Prisma 6           | Tipado fuerte, migrations y seguridad contra SQL injection    | -                      | -                                                                                            |
| Base de datos    | PostgreSQL 16      | SQL, ACID, relaciones, gratis en Supabase                     | MongoDB                | No relacional, menos apropiado para datos de comunidad y reporting                           |
| Cache            | Redis 7            | Cache, sesiones y pub/sub para tiempo real                    | Solo PostgreSQL        | Menos eficiente para cache y estado temporal                                                 |
| Auth             | JWT                | Autenticación stateless, escalable y compatible con APIs      | -                      | -                                                                                            |
| Passhash         | bcryptjs           | Hash seguro con cost configurable 12                          | -                      | -                                                                                            |
| Validación       | Zod                | Validación runtime y tipos TypeScript                         | -                      | -                                                                                            |
| Tiempo real      | Socket.io          | Comunicación en tiempo real para chat/estado de presencia     | -                      | -                                                                                            |
| Jobs             | node-cron          | Tareas programadas ligeras en Node.js                         | -                      | -                                                                                            |
| Hosting frontend | Vercel             | Gratis para proyectos open source y despliegues rápidos       | Cloudflare Pages       | Alternativa viable gratuita                                                                  |
| Hosting backend  | Railway            | Tier gratuito, despliegue fácil de Node                       | Render                 | Backup gratuito y fiable                                                                     |
| DB gratis        | Supabase           | PostgreSQL managed gratis y friendly                          | -                      | -                                                                                            |
| Redis gratis     | Upstash Redis      | Redis con plan gratuito y buena integración                   | -                      | -                                                                                            |
| Email            | Resend             | Opciones gratuitas para envíos low-volume                     | -                      | -                                                                                            |
| CI/CD            | GitHub Actions     | Integración nativa con repo y workflows gratis                | -                      | -                                                                                            |

## 3. Diagrama de arquitectura

```text
Cliente web (React 19)
        |
        v
Vercel CDN / Cloudflare Pages
        |
        v
Railway API / Backend Express 5
        |
        +--> PostgreSQL 16 (Supabase)
        |
        +--> Redis 7 (Upstash)
        |
        +--> Jitsi Meet iframe
```

## 4. Modelo de despliegue

### Desarrollo local

- Uso de `Docker Compose` para levantar servicios locales:
  - Backend Node.js + Express
  - PostgreSQL 16
  - Redis 7
  - Opcional: un proxy HTTP local o mock de Jitsi
- La app frontend corre con Vite, el backend en modo desarrollo y Prisma apunta a la base local.

### Producción zero-cost

- `GitHub Actions` ejecuta CI/CD al hacer push o PR sobre `main`/`develop`.
- Frontend desplegado en **Vercel** desde el monorepo.
- Backend desplegado en **Railway** con conexión a Supabase/PostgreSQL y Upstash Redis.
- Base de datos en **Supabase** free tier.
- Redis en **Upstash** free tier.

### Fallback si Railway duerme

- Monitoreo con UptimeRobot para mantener el backend activo.
- Alternativa secundaria: `Render` en plan gratuito o usar funciones serverless de `Vercel` para endpoints críticos.

## 5. Decisiones arquitectónicas clave

### React + Vite vs Next.js

Elegimos **React + Vite** por su simplicidad, velocidad de desarrollo y menor requerimiento de infraestructura. Next.js aporta SSR y optimización avanzada, pero para una plataforma peer-to-peer ligera y gratuita su complejidad es innecesaria.

### Express vs Nest.js/Fastify

**Express 5** es una solución minimalista y conocida que reduce la curva de aprendizaje. Nest.js es muy robusto pero añade sobrecarga arquitectónica; Fastify es rápido, pero Express ofrece mayor compatibilidad con middlewares y ecosistema.

### PostgreSQL vs MongoDB

**PostgreSQL 16** es ideal para datos relacionales, consultas complejas y consistencia ACID. MongoDB es menos adecuado para esquemas estructurados de usuarios, círculos, mensajes y auditoría.

### Jitsi vs Twilio/Zoom/Daily

**Jitsi Meet** es open source y gratuito, compatible con el objetivo zero-cost. Twilio, Zoom y Daily son soluciones de pago o con límites gratuitos menos previsibles.

### Redis vs solo PostgreSQL

**Redis 7** se usa para cache y estado en tiempo real, lo que reduce la carga de PostgreSQL. Sin Redis, PostgreSQL manejaría más consultas transitórias y sesiones, afectando rendimiento.

## 6. Seguridad

- HTTPS obligatorio en producción.
- Autenticación con **JWT** y token de refresh para renovar sesiones.
- Configurar `JWT_SECRET` como secreto de entorno; el valor de desarrollo integrado no debe usarse en producción.
- Contraseñas almacenadas con **bcryptjs** cost 12.
- Datos sensibles cifrados con **AES-256** cuando correspondan a información privada almacenada.
- **Helmet.js** para cabeceras de seguridad HTTP.
- Rate limiting para endpoints críticos.
- Validación de entrada con **Zod** en frontend y backend.
- Uso de **Prisma** para proteger contra SQL injection.
- **CSP** robusta para reducir riesgos de XSS.

## 7. Escalabilidad futura

| Escenario                 | Cambio necesario                                            | Estimación costo cero                             | Nota                                                  |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| >500 usuarios simultáneos | Cache en Redis, escalado de backend                         | Mantiene free tier si no supera límites           | Usar Upstash y optimizar queries                      |
| >10 GB de datos           | Archivar datos, limpiar logs, usar almacenamiento adicional | Puede requerir plan pago si supera free tier      | Priorizar eliminación y compactación                  |
| Self-hosted Jitsi         | Instalar Jitsi en VPS gratuito o low-cost                   | Self-hosting con un servidor pequeño              | Requiere ancho de banda y mantenimiento               |
| Backup de DB              | Snapshots y duplicación                                     | Gratuito con límites                              | Usar Supabase backups y exports periódicos            |
| Más de 1k usuarios        | Distribución de frontend y backend                          | Mantener deployment en Vercel/Railway con monitor | Evaluar migración a instancias dedicadas si hay costo |

## 8. Convenciones

- Nombre del repo: `circulos-de-cuidado`
- Base de datos: `circulos_cuidado`
- Tablas principales: `usuarios`, `circulos`, `mensajes`, `sesiones`, `notificaciones`, `eventos`
- Endpoints API: `/api/v1/auth`, `/api/v1/users`, `/api/v1/circles`, `/api/v1/messages`, `/api/v1/meetings`
- Componentes React: `ButtonPrimary`, `CircleCard`, `ChatPanel`, `UserProfile`, `MeetingIframe`
- Funciones: `sendMessage`, `fetchCircles`, `validateSession`, `encryptSensitiveData`
- Versionado API: `/api/v1/` para rutas estables y permitir futuras versiones.
- Commits: usar Conventional Commits, por ejemplo `feat(auth): agregar login con JWT`, `fix(api): corregir validación Zod`.

---

Este documento define la arquitectura técnica completa para el proyecto `Círculos de Cuidado`, priorizando gratuidad, seguridad y escalabilidad dentro de un monorepo moderno.
