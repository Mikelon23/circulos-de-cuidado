const crypto = require('node:crypto');

const VALID_STATES = new Set(['activo', 'pausado', 'cerrado']);

function normalizeState(state) {
  if (typeof state !== 'string') {
    return null;
  }

  const normalized = state.trim().toLowerCase();
  return VALID_STATES.has(normalized) ? normalized : null;
}

function sanitizeCircle(circle) {
  return {
    ...circle,
    createdAt: circle.createdAt,
    updatedAt: circle.updatedAt,
  };
}

function createCircleService() {
  const circles = [];

  return {
    createCircle(payload = {}) {
      const nombre = String(payload.nombre || '').trim();
      const tema = payload.tema ? String(payload.tema).trim() : null;
      const descripcion = payload.descripcion ? String(payload.descripcion).trim() : null;
      const facilitadorId = payload.facilitadorId ? String(payload.facilitadorId).trim() : null;
      const capacidadMinima = Number(payload.capacidadMinima);
      const capacidadMaxima = Number(payload.capacidadMaxima);
      const estado = normalizeState(payload.estado);

      if (!nombre) {
        throw new Error('El nombre del círculo es obligatorio');
      }

      if (!Number.isInteger(capacidadMinima) || capacidadMinima < 1) {
        throw new Error('La capacidad mínima debe ser un entero positivo');
      }

      if (!Number.isInteger(capacidadMaxima) || capacidadMaxima < 1) {
        throw new Error('La capacidad máxima debe ser un entero positivo');
      }

      if (capacidadMaxima < capacidadMinima) {
        throw new Error('La capacidad máxima no puede ser menor que la capacidad mínima');
      }

      if (estado === null && payload.estado !== undefined) {
        throw new Error('El estado del círculo no es válido');
      }

      const now = new Date().toISOString();
      const circle = {
        id: crypto.randomUUID(),
        nombre,
        tema,
        descripcion,
        facilitadorId,
        capacidadMinima,
        capacidadMaxima,
        estado: estado || 'activo',
        createdAt: now,
        updatedAt: now,
      };

      circles.push(circle);
      return sanitizeCircle(circle);
    },

    getCircle(circleId) {
      if (!circleId) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      const circle = circles.find((candidate) => candidate.id === circleId);
      if (!circle) {
        throw new Error('Círculo no encontrado');
      }

      return sanitizeCircle(circle);
    },

    listCircles() {
      return circles.map((circle) => sanitizeCircle(circle));
    },

    updateCircle(circleId, updates = {}) {
      if (!circleId) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      const circle = circles.find((candidate) => candidate.id === circleId);
      if (!circle) {
        throw new Error('Círculo no encontrado');
      }

      const next = {
        ...circle,
        nombre:
          updates.nombre === undefined
            ? circle.nombre
            : String(updates.nombre || '').trim(),
        tema:
          updates.tema === undefined
            ? circle.tema
            : updates.tema
              ? String(updates.tema).trim()
              : null,
        descripcion:
          updates.descripcion === undefined
            ? circle.descripcion
            : updates.descripcion
              ? String(updates.descripcion).trim()
              : null,
        facilitadorId:
          updates.facilitadorId === undefined
            ? circle.facilitadorId
            : updates.facilitadorId
              ? String(updates.facilitadorId).trim()
              : null,
        capacidadMinima:
          updates.capacidadMinima === undefined
            ? circle.capacidadMinima
            : Number(updates.capacidadMinima),
        capacidadMaxima:
          updates.capacidadMaxima === undefined
            ? circle.capacidadMaxima
            : Number(updates.capacidadMaxima),
        estado:
          updates.estado === undefined
            ? circle.estado
            : normalizeState(updates.estado),
      };

      if (!next.nombre) {
        throw new Error('El nombre del círculo es obligatorio');
      }

      if (!Number.isInteger(next.capacidadMinima) || next.capacidadMinima < 1) {
        throw new Error('La capacidad mínima debe ser un entero positivo');
      }

      if (!Number.isInteger(next.capacidadMaxima) || next.capacidadMaxima < 1) {
        throw new Error('La capacidad máxima debe ser un entero positivo');
      }

      if (next.capacidadMaxima < next.capacidadMinima) {
        throw new Error('La capacidad máxima no puede ser menor que la capacidad mínima');
      }

      if (next.estado === null && updates.estado !== undefined) {
        throw new Error('El estado del círculo no es válido');
      }

      const updated = {
        ...next,
        updatedAt: new Date().toISOString(),
      };

      const index = circles.findIndex((candidate) => candidate.id === circleId);
      circles[index] = updated;

      return sanitizeCircle(updated);
    },

    deleteCircle(circleId) {
      if (!circleId) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      const index = circles.findIndex((candidate) => candidate.id === circleId);
      if (index === -1) {
        throw new Error('Círculo no encontrado');
      }

      const [deleted] = circles.splice(index, 1);
      return sanitizeCircle(deleted);
    },
  };
}

module.exports = {
  createCircleService,
};
