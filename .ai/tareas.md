# Tareas del proyecto — Círculos de Cuidado

Este archivo es la fuente oficial del roadmap. El agente debe leerlo completo antes de ejecutar cualquier tarea.

## Reglas de uso para el agente

- El usuario solo indicará el número de tarea.
- Busca la tarea por `id` exacto.
- Revisa también las tareas anteriores y posteriores para entender el contexto del roadmap.
- Antes de cambiar código, revisa la arquitectura completa del repositorio y la documentación relacionada.
- Implementa solo lo necesario para la tarea solicitada.
- No rompas funcionalidades existentes.
- Al finalizar: valida, haz commit con Conventional Commits y luego push.

## Formato que debe seguir cada tarea

- `id`: número exacto de la tarea.x
- `estado`: siempre empieza en `pendiente`.
- `titulo`: nombre corto de la tarea.
- `objetivo`: descripción funcional de lo que hay que hacer.
- `entregable`: resultado esperado al terminar.

## Índice rápido

|  ID | Título                                          | Entregable                     | Estado     |
| --: | ----------------------------------------------- | ------------------------------ | ---------- |
|   1 | Crear repositorio en GitHub                     | Repo público funcional         | completado |
|   2 | Definir arquitectura zero-cost                  | `docs/ARQUITECTURA.md`         | completado |
|   3 | Configurar entorno de desarrollo local          | `docker-compose.yml` funcional | completado |
|   4 | Crear estructura de carpetas del monorepo       | Estructura limpia              | completado |
|   5 | Configurar CI/CD con GitHub Actions             | `.github/workflows/ci.yml`     | completado |
|   6 | Definir guía de estilo de código                | `docs/ESTILO.md`               | completado  |
|   7 | Crear plantilla de issues y PRs                 | `.github/` templates           | completado  |
|   8 | Documentar stack zero-cost detallado            | `docs/SERVICIOS_GRATUITOS.md`  | completado  |
|   9 | Diseñar schema de base de datos                 | `docs/DB_SCHEMA.md` + diagrama | completado |
|  10 | Implementar migraciones iniciales               | Migraciones ejecutables        | completado |
|  11 | Crear modelo `Usuario`                          | API endpoints + tests          | completado |
|  12 | Crear modelo `PerfilCuidador`                   | CRUD completo                  | completado  |
|  13 | Crear modelo `Circulo`                          | CRUD completo                  | completado  |
|  14 | Crear modelo `MiembroCirculo`                   | CRUD completo                  | completado  |
|  15 | Crear modelo `Sesion`                           | CRUD completo                  | completado  |
|  16 | Crear modelo `CheckInEmocional`                 | CRUD + historial               | completado  |
|  17 | Crear modelo `Facilitador`                      | CRUD completo                  | completado  |
|  18 | Implementar seeders de desarrollo               | `npm run seed` o similar       | completado  |
|  19 | Implementar registro de usuarios                | Endpoint funcional             | completado |
|  20 | Implementar login y JWT                         | Middleware de auth             | completado |
|  21 | Implementar OAuth (Google/GitHub)               | Botones + flujo completo       | completado |
|  22 | Implementar recuperación de contraseña          | Flujo completo                 | pendiente  |
|  23 | Implementar anonimato opcional                  | Perfil configurable            | pendiente  |
|  24 | Configurar CORS y rate limiting                 | Middleware activo              | pendiente  |
|  25 | Implementar sanitización de inputs              | Tests de seguridad             | pendiente  |
|  26 | Documentar política de privacidad               | `docs/PRIVACIDAD.md`           | pendiente  |
|  27 | Definir algoritmo de matching                   | `docs/MATCHING.md`             | pendiente  |
|  28 | Implementar scoring de compatibilidad           | Tests unitarios                | pendiente  |
|  29 | Implementar generación de círculos              | Endpoint + tests               | pendiente  |
|  30 | Implementar cola de espera                      | Sistema de cola                | pendiente  |
|  31 | Crear panel de administración de círculos       | Dashboard básico               | pendiente  |
|  32 | Implementar sugerencias de círculo              | Sistema de notificaciones      | pendiente  |
|  33 | Permitir cambio de círculo                      | Flujo + lógica                 | pendiente  |
|  34 | Implementar matching de facilitador             | Algoritmo + endpoint           | pendiente  |
|  35 | Crear simulador de matching (dev tool)          | `/dev/matching`                | pendiente  |
|  36 | Implementar creación de círculos                | Flujo end-to-end               | pendiente  |
|  37 | Implementar sala de video (Jitsi)               | Componente React/Vue           | pendiente  |
|  38 | Implementar agenda de sesiones                  | Vista calendario               | pendiente  |
|  39 | Implementar guión de sesión para facilitador    | Template dinámico              | pendiente  |
|  40 | Implementar timer de sesión                     | Componente en sala             | pendiente  |
|  41 | Implementar chat asíncrono del círculo          | Chat tipo Slack/Discord        | pendiente  |
|  42 | Implementar "modo oyente"                       | Toggle en sesión               | pendiente  |
|  43 | Implementar historial de sesiones               | Archivo por círculo            | pendiente  |
|  44 | Implementar asistencia y engagement             | Métricas por usuario           | pendiente  |
|  45 | Crear sistema de "ritual de respiro"            | Contenido + player             | pendiente  |
|  46 | Implementar feedback post-sesión                | Modal post-sesión              | pendiente  |
|  47 | Implementar alerta de abandono                  | Sistema de alertas             | pendiente  |
|  48 | Crear biblioteca de temas de sesión             | CMS básico                     | pendiente  |
|  49 | Implementar check-in diario                     | Widget diario                  | pendiente  |
|  50 | Implementar historial de check-ins              | Vista de progreso              | pendiente  |
|  51 | Implementar detección de patrones de riesgo     | Algoritmo + notificación       | pendiente  |
|  52 | Implementar "momento de gratitud"               | Micro-interacción              | pendiente  |
|  53 | Crear dashboard de bienestar del cuidador       | Vista personal                 | pendiente  |
|  54 | Implementar "señales de alarma" educativas      | Artículos interactivos         | pendiente  |
|  55 | Implementar derivación a recursos profesionales | Directorio + contacto          | pendiente  |
|  56 | Crear sistema de logros/badges                  | Gamificación ligera            | pendiente  |
|  57 | Implementar diario compartido del círculo       | Feed por círculo               | pendiente  |
|  58 | Implementar sistema de "apoyo rápido"           | Botón de emergencia emocional  | pendiente  |
|  59 | Crear foro público (lectura)                    | Blog/feed público              | pendiente  |
|  60 | Implementar "pregunta de la semana"             | Sección destacada              | pendiente  |
|  61 | Crear biblioteca de recursos curados            | CMS + categorías               | pendiente  |
|  62 | Implementar "consejo del día"                   | Widget en dashboard            | pendiente  |
|  63 | Implementar sistema de "mentoría 1:1" (v1)      | Calendario + video             | pendiente  |
|  64 | Crear newsletter semanal                        | Automatización + template      | pendiente  |
|  65 | Implementar notificaciones push (web)           | Notificaciones funcionales     | pendiente  |
|  66 | Implementar notificaciones por email            | Templates HTML                 | pendiente  |
|  67 | Implementar preferencias de notificación        | Panel de configuración         | pendiente  |
|  68 | Implementar "modo no molestar"                  | Toggle + scheduling            | pendiente  |
|  69 | Crear sistema de "nudges" empáticos             | Lógica de empatía              | pendiente  |
|  70 | Implementar resumen semanal automático          | Email + dashboard              | pendiente  |
|  71 | Crear panel de facilitador                      | Dashboard dedicado             | pendiente  |
|  72 | Implementar formación de facilitadores          | LMS básico                     | pendiente  |
|  73 | Implementar supervisión de facilitadores        | Sala de supervisión            | pendiente  |
|  74 | Crear sistema de calificación de facilitadores  | Rating + reviews               | pendiente  |
|  75 | Implementar reportes de impacto                 | Dashboard de impacto           | pendiente  |

## Base del proyecto

### Tarea 01

- id: 1
- estado: completado
- titulo: Crear repositorio en GitHub
- objetivo: Inicializar repo `circulos-de-cuidado` con README, LICENSE (MIT), CODE\_OF\_CONDUCT, CONTRIBUTING
- entregable: Repo público funcional
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 02

- id: 2
- estado: completado
- titulo: Definir arquitectura zero-cost
- objetivo: Documentar stack: frontend (React/Vue vanilla), backend (Node/Express o Python/FastAPI), DB (SQLite/PostgreSQL self-hosted), hosting (Vercel/Netlify/Railway free tier), video (Jitsi self-hosted o Daily.co free)
- entregable: `docs/ARQUITECTURA.md`
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 03

- id: 3
- estado: completado
- titulo: Configurar entorno de desarrollo local
- objetivo: Docker Compose con: app web, API, base de datos, redis (cache/sesiones)
- entregable: `docker-compose.yml` funcional
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 04

- id: 4
- estado: completado
- titulo: Crear estructura de carpetas del monorepo
- objetivo: `/apps/web`, `/apps/api`, `/packages/shared`, `/docs`, `/scripts`
- entregable: Estructura limpia
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 05

- id: 5
- estado: completado
- titulo: Configurar CI/CD con GitHub Actions
- objetivo: Lint, test, build automático en PR y push a main
- entregable: `.github/workflows/ci.yml`
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 06

- id: 6
- estado: completado
- titulo: Definir guía de estilo de código
- objetivo: ESLint, Prettier, convenciones de commits (Conventional Commits)
- entregable: `docs/ESTILO.md`
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 07

- id: 7
- estado: completado
- titulo: Crear plantilla de issues y PRs
- objetivo: Templates para bugs, features, tareas en español
- entregable: `.github/` templates
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 08

- id: 8
- estado: completado
- titulo: Documentar stack zero-cost detallado
- objetivo: Lista de servicios gratuitos: Vercel, Supabase free tier, GitHub Pages, Jitsi Meet, SendGrid free, etc.
- entregable: `docs/SERVICIOS_GRATUITOS.md`
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

## Datos y modelos

### Tarea 09

- id: 9
- estado: completado
- titulo: Diseñar schema de base de datos
- objetivo: Usuarios, perfiles de cuidador, circulos, sesiones, mensajes, check-ins emocionales, facilitadores
- entregable: `docs/DB_SCHEMA.md` + diagrama
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 10

- id: 10
- estado: completado
- titulo: Implementar migraciones iniciales
- objetivo: Crear tablas con ORM (Prisma/TypeORM/Sequelize o SQLAlchemy/Alembic)
- entregable: Migraciones ejecutables
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 11

- id: 11
- estado: completado
- titulo: Crear modelo `Usuario`
- objetivo: Registro, autenticación (email/contraseña + OAuth GitHub/Google), roles (cuidador, facilitador, admin)
- entregable: API endpoints + tests
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 12

- id: 12
- estado: completado
- titulo: Crear modelo `PerfilCuidador`
- objetivo: Datos del adulto mayor, enfermedad, fase del cuidado, disponibilidad, geografía
- entregable: CRUD completo
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 13

- id: 13
- estado: completado
- titulo: Crear modelo `Circulo`
- objetivo: Grupos de 6-8 personas, tema, facilitador asignado, estado (activo/pausado/cerrado)
- entregable: CRUD completo
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 14

- id: 14
- estado: completado
- titulo: Crear modelo `MiembroCirculo`
- objetivo: Relación usuario-círculo, fecha de ingreso, rol (participante/oyente), estado
- entregable: CRUD completo
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 15

- id: 15
- estado: completado
- titulo: Crear modelo `Sesion`
- objetivo: Sesiones programadas, fecha/hora, duración, tipo (video/chat), estado, notas
- entregable: CRUD completo
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 16

- id: 16
- estado: completado
- titulo: Crear modelo `CheckInEmocional`
- objetivo: Pregunta diaria, escala 1-10, nota opcional, timestamp
- entregable: CRUD + historial
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 17

- id: 17
- estado: completado
- titulo: Crear modelo `Facilitador`
- objetivo: Perfil de ex-cuidador, formación, especialidades, calificación, disponibilidad
- entregable: CRUD completo
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 18

- id: 18
- estado: completado
- titulo: Implementar seeders de desarrollo
- objetivo: Datos de prueba: 20 usuarios, 5 círculos, 3 facilitadores, 50 check-ins
- entregable: `npm run seed` o similar
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

## Autenticación y seguridad

### Tarea 19

- id: 19
- estado: completado
- titulo: Implementar registro de usuarios
- objetivo: Email + contraseña con validación, confirmación por email (SendGrid free o SMTP propio)
- entregable: Endpoint funcional
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 20

- id: 20
- estado: completado
- titulo: Implementar login y JWT
- objetivo: Tokens de acceso y refresh, expiración, renovación automática
- entregable: Middleware de auth
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 21

- id: 21
- estado: completado
- titulo: Implementar OAuth (Google/GitHub)
- objetivo: Login social para reducir fricción de registro
- entregable: Botones + flujo completo
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 22

- id: 22
- estado: pendiente
- titulo: Implementar recuperación de contraseña
- objetivo: Email con token temporal de 1 hora
- entregable: Flujo completo
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 23

- id: 23
- estado: pendiente
- titulo: Implementar anonimato opcional
- objetivo: Campo `nombre_visible` separado de `nombre_real`, avatar generado automático
- entregable: Perfil configurable
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 24

- id: 24
- estado: pendiente
- titulo: Configurar CORS y rate limiting
- objetivo: Protección básica contra abuso de API
- entregable: Middleware activo
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 25

- id: 25
- estado: pendiente
- titulo: Implementar sanitización de inputs
- objetivo: Prevención XSS, SQL injection, validación de todos los endpoints
- entregable: Tests de seguridad
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 26

- id: 26
- estado: pendiente
- titulo: Documentar política de privacidad
- objetivo: GDPR básico, anonimización de datos sensibles, derecho al olvido
- entregable: `docs/PRIVACIDAD.md`
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

## Matching y asignación

### Tarea 27

- id: 27
- estado: pendiente
- titulo: Definir algoritmo de matching
- objetivo: Puntuación basada en: enfermedad, fase, edad, geografía, disponibilidad horaria, idioma
- entregable: `docs/MATCHING.md`
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 28

- id: 28
- estado: pendiente
- titulo: Implementar scoring de compatibilidad
- objetivo: Función que recibe dos perfiles y devuelve score 0-100
- entregable: Tests unitarios
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 29

- id: 29
- estado: pendiente
- titulo: Implementar generación de círculos
- objetivo: Algoritmo que agrupa 6-8 cuidadores con mayor compatibilidad mutua
- entregable: Endpoint + tests
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 30

- id: 30
- estado: pendiente
- titulo: Implementar cola de espera
- objetivo: Cuidadores sin círculo disponible entran en lista con prioridad por urgencia
- entregable: Sistema de cola
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 31

- id: 31
- estado: pendiente
- titulo: Crear panel de administración de círculos
- objetivo: Vista para admins: círculos activos, miembros, facilitadores, intervenciones
- entregable: Dashboard básico
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 32

- id: 32
- estado: pendiente
- titulo: Implementar sugerencias de círculo
- objetivo: Notificación al cuidador cuando se encuentra un círculo compatible
- entregable: Sistema de notificaciones
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 33

- id: 33
- estado: pendiente
- titulo: Permitir cambio de círculo
- objetivo: Cuidador puede solicitar re-matching si no conecta con su grupo
- entregable: Flujo + lógica
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 34

- id: 34
- estado: pendiente
- titulo: Implementar matching de facilitador
- objetivo: Asignar facilitador ex-cuidador más compatible al círculo
- entregable: Algoritmo + endpoint
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 35

- id: 35
- estado: pendiente
- titulo: Crear simulador de matching (dev tool)
- objetivo: Interfaz para probar el algoritmo con datos de prueba
- entregable: `/dev/matching`
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

## Sesiones y comunicación

### Tarea 36

- id: 36
- estado: pendiente
- titulo: Implementar creación de círculos
- objetivo: Flujo completo: matching → creación → invitación → confirmación
- entregable: Flujo end-to-end
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 37

- id: 37
- estado: pendiente
- titulo: Implementar sala de video (Jitsi)
- objetivo: Integración iframe de Jitsi Meet (self-hosted o meet.jit.si) con nombre de sala único
- entregable: Componente React/Vue
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 38

- id: 38
- estado: pendiente
- titulo: Implementar agenda de sesiones
- objetivo: Calendario de sesiones semanales con recordatorios
- entregable: Vista calendario
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 39

- id: 39
- estado: pendiente
- titulo: Implementar guión de sesión para facilitador
- objetivo: Estructura: check-in (10min), tema del día (15min), compartir (25min), cierre (10min)
- entregable: Template dinámico
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 40

- id: 40
- estado: pendiente
- titulo: Implementar timer de sesión
- objetivo: Cuenta regresiva visible para todos, cambio de fase automático
- entregable: Componente en sala
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 41

- id: 41
- estado: pendiente
- titulo: Implementar chat asíncrono del círculo
- objetivo: Mensajería persistente entre sesiones, archivos, reacciones
- entregable: Chat tipo Slack/Discord
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 42

- id: 42
- estado: pendiente
- titulo: Implementar "modo oyente"
- objetivo: Participante puede unirse en silencio, sin presión de hablar
- entregable: Toggle en sesión
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 43

- id: 43
- estado: pendiente
- titulo: Implementar historial de sesiones
- objetivo: Grabaciones (opcional, consentimiento), notas, temas tratados
- entregable: Archivo por círculo
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 44

- id: 44
- estado: pendiente
- titulo: Implementar asistencia y engagement
- objetivo: Tracking de asistencia, participación, tiempo conectado
- entregable: Métricas por usuario
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 45

- id: 45
- estado: pendiente
- titulo: Crear sistema de "ritual de respiro"
- objetivo: Sesiones guiadas de 15 min: respiración, meditación, caminata virtual
- entregable: Contenido + player
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 46

- id: 46
- estado: pendiente
- titulo: Implementar feedback post-sesión
- objetivo: Encuesta rápida 1-5 estrellas + comentario opcional
- entregable: Modal post-sesión
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 47

- id: 47
- estado: pendiente
- titulo: Implementar alerta de abandono
- objetivo: Si un cuidador no asiste a 2 sesiones seguidas, facilitador recibe alerta
- entregable: Sistema de alertas
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 48

- id: 48
- estado: pendiente
- titulo: Crear biblioteca de temas de sesión
- objetivo: Temas predefinidos: "Manejo de la culpa", "Comunicación con médicos", "Cuando ya no puedes más"
- entregable: CMS básico
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

## Bienestar y seguimiento emocional

### Tarea 49

- id: 49
- estado: pendiente
- titulo: Implementar check-in diario
- objetivo: Pregunta: "¿Cómo te sientes hoy?" + escala 1-10 + emoji + nota opcional
- entregable: Widget diario
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 50

- id: 50
- estado: pendiente
- titulo: Implementar historial de check-ins
- objetivo: Gráfico de línea con evolución emocional, filtros por semana/mes
- entregable: Vista de progreso
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 51

- id: 51
- estado: pendiente
- titulo: Implementar detección de patrones de riesgo
- objetivo: Si 3 check-ins consecutivos < 4, alerta al facilitador + sugerencias
- entregable: Algoritmo + notificación
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 52

- id: 52
- estado: pendiente
- titulo: Implementar "momento de gratitud"
- objetivo: Prompt diario opcional: "¿Qué te hizo sonreír hoy?"
- entregable: Micro-interacción
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 53

- id: 53
- estado: pendiente
- titulo: Crear dashboard de bienestar del cuidador
- objetivo: Resumen visual: tendencia emocional, sesiones asistidas, conexiones formadas
- entregable: Vista personal
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 54

- id: 54
- estado: pendiente
- titulo: Implementar "señales de alarma" educativas
- objetivo: Contenido: "Estos son los signos de burnout. ¿Los reconoces?"
- entregable: Artículos interactivos
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 55

- id: 55
- estado: pendiente
- titulo: Implementar derivación a recursos profesionales
- objetivo: Lista de psicólogos/terapeutas gratuitos o de bajo costo por región
- entregable: Directorio + contacto
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 56

- id: 56
- estado: pendiente
- titulo: Crear sistema de logros/badges
- objetivo: "Primer mes conectado", "Apoyo a 5 cuidadores", "Respiro semanal"
- entregable: Gamificación ligera
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

## Comunidad y recursos

### Tarea 57

- id: 57
- estado: pendiente
- titulo: Implementar diario compartido del círculo
- objetivo: Espacio donde cada miembro escribe y los demás responden con apoyo
- entregable: Feed por círculo
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 58

- id: 58
- estado: pendiente
- titulo: Implementar sistema de "apoyo rápido"
- objetivo: Botón "Necesito hablar ahora" → notificación a todo el círculo
- entregable: Botón de emergencia emocional
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 59

- id: 59
- estado: pendiente
- titulo: Crear foro público (lectura)
- objetivo: Experiencias anonimizadas de cuidadores para inspirar a nuevos usuarios
- entregable: Blog/feed público
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 60

- id: 60
- estado: pendiente
- titulo: Implementar "pregunta de la semana"
- objetivo: Tema comunitario rotativo, respuestas visibles para todos
- entregable: Sección destacada
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 61

- id: 61
- estado: pendiente
- titulo: Crear biblioteca de recursos curados
- objetivo: Artículos, videos, podcasts sobre cuidado, organizados por tema
- entregable: CMS + categorías
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 62

- id: 62
- estado: pendiente
- titulo: Implementar "consejo del día"
- objetivo: Tip práctico diario generado por la comunidad o facilitadores
- entregable: Widget en dashboard
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 63

- id: 63
- estado: pendiente
- titulo: Implementar sistema de "mentoría 1:1" (v1)
- objetivo: Solicitud de cita con facilitador para conversación privada
- entregable: Calendario + video
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 64

- id: 64
- estado: pendiente
- titulo: Crear newsletter semanal
- objetivo: Resumen de la comunidad, recursos destacados, próximas sesiones
- entregable: Automatización + template
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

## Notificaciones y recordatorios

### Tarea 65

- id: 65
- estado: pendiente
- titulo: Implementar notificaciones push (web)
- objetivo: Service Worker + Push API para recordatorios de sesión, check-in, mensajes
- entregable: Notificaciones funcionales
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 66

- id: 66
- estado: pendiente
- titulo: Implementar notificaciones por email
- objetivo: Recordatorios de sesión, resumen semanal, alertas de bienestar
- entregable: Templates HTML
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 67

- id: 67
- estado: pendiente
- titulo: Implementar preferencias de notificación
- objetivo: Usuario configura qué quiere recibir y con qué frecuencia
- entregable: Panel de configuración
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 68

- id: 68
- estado: pendiente
- titulo: Implementar "modo no molestar"
- objetivo: Silenciar notificaciones durante horario de trabajo configurado
- entregable: Toggle + scheduling
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 69

- id: 69
- estado: pendiente
- titulo: Crear sistema de "nudges" empáticos
- objetivo: "Hace 3 días que no haces check-in. ¿Todo bien?"
- entregable: Lógica de empatía
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 70

- id: 70
- estado: pendiente
- titulo: Implementar resumen semanal automático
- objetivo: "Esta semana en tu círculo: 2 sesiones, 12 mensajes, tu bienestar: 6.2"
- entregable: Email + dashboard
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

## Facilitación e impacto

### Tarea 71

- id: 71
- estado: pendiente
- titulo: Crear panel de facilitador
- objetivo: Vista de sus círculos, miembros, próximas sesiones, guiones, alertas de riesgo
- entregable: Dashboard dedicado
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 72

- id: 72
- estado: pendiente
- titulo: Implementar formación de facilitadores
- objetivo: Módulos: escucha activa, manejo de crisis, límites éticos, uso de la plataforma
- entregable: LMS básico
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 73

- id: 73
- estado: pendiente
- titulo: Implementar supervisión de facilitadores
- objetivo: Sesiones de supervisión grupales mensuales entre facilitadores
- entregable: Sala de supervisión
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 74

- id: 74
- estado: pendiente
- titulo: Crear sistema de calificación de facilitadores
- objetivo: Feedback anónimo de participantes, métricas de engagement
- entregable: Rating + reviews
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

### Tarea 75

- id: 75
- estado: pendiente
- titulo: Implementar reportes de impacto
- objetivo: Métricas agregadas: reducción de burnout, retención, conexiones formadas, derivaciones
- entregable: Dashboard de impacto
- contexto: revisar tareas cercanas para mantener la lógica del roadmap.

## Stack y servicios de referencia

| Capa                | Tecnología                                            | Costo |
| ------------------- | ----------------------------------------------------- | ----- |
| Frontend            | React 19 + Vite + Tailwind CSS                        | $0    |
| Backend             | Node.js + Express o Python + FastAPI                  | $0    |
| Base de datos       | SQLite (dev) / PostgreSQL (Supabase free tier: 500MB) | $0    |
| Auth                | JWT + OAuth 2.0 (GitHub/Google)                       | $0    |
| Video               | Jitsi Meet iframe (meet.jit.si) o self-hosted         | $0    |
| Hosting frontend    | Vercel (hobby tier: ilimitado)                        | $0    |
| Hosting API         | Railway free tier o Render                            | $0    |
| Email               | Resend free tier (100 emails/día) o SMTP propio       | $0    |
| Notificaciones push | Web Push API (nativo del navegador)                   | $0    |
| Almacenamiento      | Supabase Storage free tier (1GB)                      | $0    |
| CI/CD               | GitHub Actions (2000 min/mes)                         | $0    |
