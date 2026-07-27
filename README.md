# Círculos de Cuidado

Círculos de Cuidado es una plataforma orientada a fortalecer redes de cuidado, acompañamiento y apoyo entre personas, familias y comunidades. El proyecto busca combinar tecnología, empatía y diseño para crear experiencias útiles, seguras y accesibles.

## Filosofía del proyecto

Creemos que el cuidado debe ser una práctica compartida, digna y sostenible. Por eso este monorepo está pensado para sostener una experiencia digital amable, modular y escalable, donde el bienestar humano sea el eje central.

## Stack tecnológico

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

## Instalación

### Opción 1: con Docker

```bash
docker compose up --build
```

### Opción 2: sin Docker

```bash
npm install
npm run dev
```

## Estructura del monorepo

```text
apps/
  web/      # Frontend React + Vite
  api/      # Backend Node.js + Express
packages/
  shared/   # Tipos y utilidades compartidas
docs/       # Documentación
scripts/    # Utilidades de desarrollo
```

## Roadmap

| Área            | Tarea                          | Estado         |
| --------------- | ------------------------------ | -------------- |
| Infraestructura | Entorno local con Docker       | ✅ Completado  |
| Frontend        | Diseño base y navegación       | 🟡 En progreso |
| Backend         | API base y salud del sistema   | 🟡 En progreso |
| Datos           | Modelado y persistencia        | ⏳ Pendiente   |
| Producto        | Módulos de cuidado y bienestar | ⏳ Pendiente   |

## Contribución

Las contribuciones son bienvenidas. Si deseas colaborar, puedes abrir un issue, proponer mejoras o enviar un pull request con cambios claros y bien documentados.

## Cita inspiradora

> “Cuidar no es una tarea menor; es una forma de dignificar la vida.”
> — Un cuidador que protege, acompaña y sostiene.
