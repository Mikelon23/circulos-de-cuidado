# Guía de estilo de código — Círculos de Cuidado

Este documento define las convenciones mínimas para mantener el proyecto consistente, legible y fácil de evolucionar.

## 1. Principios generales

- Priorizar claridad sobre cleverness.
- Mantener funciones y componentes pequeños y con una responsabilidad definida.
- Reutilizar lógica compartida en los paquetes y utilidades existentes.
- Evitar duplicación innecesaria de código y configuración.
- Mantener el código legible para personas nuevas en el proyecto.

## 2. Estilo de JavaScript y JSX

- Usar `const` y `let` de forma consistente; preferir `const` cuando el valor no cambie.
- Usar semicolons al final de las sentencias.
- Mantener sangrado de 2 espacios.
- Usar comillas simples para strings en JavaScript y JSX.
- Preferir nombres descriptivos para variables, funciones y componentes.
- Evitar funciones anónimas largas; extraer lógica cuando sea necesaria.
- Mantener las líneas por debajo de 100 caracteres cuando sea posible.

### Ejemplos

```js
function createHealthCheck(service) {
  return {
    status: 'ok',
    service,
  };
}
```

```jsx
function App() {
  return (
    <main>
      <h1>Círculos de Cuidado</h1>
    </main>
  );
}
```

## 3. Formato automático

El proyecto usa Prettier para estandarizar el formato del código.

### Comandos útiles

```bash
npm run format
```

### Configuración aplicada

- `semi: true`
- `singleQuote: true`
- `trailingComma: 'es5'`
- `printWidth: 100`
- `tabWidth: 2`

## 4. Linting

El linting base se ejecuta con ESLint y debe pasar antes de integrar cambios.

```bash
npm run lint
```

## 5. Convenciones de commits

Todos los commits deben usar Conventional Commits para facilitar el historial y el changelog.

### Formato

```text
<type>(<scope>): <descripción corta>
```

### Tipos recomendados

- `feat`: nueva funcionalidad
- `fix`: corrección de errores
- `docs`: cambios en documentación
- `refactor`: mejoras internas sin cambiar comportamiento
- `test`: cambios en pruebas
- `chore`: mantenimiento y tareas varias

### Ejemplos

```text
feat(api): agregar endpoint de salud del sistema
fix(web): corregir render de la pantalla principal
docs(style): documentar guía de estilo de código
```

## 6. Revisión previa a entregar

Antes de cerrar una tarea, verificar:

- `npm run lint`
- `npm test`
- `npm run format`
- que el cambio no introduzca regresiones en el flujo existente
