const crypto = require('node:crypto');

function normalizeJsonField(value, fieldName) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value;
  }

  throw new Error(`El campo ${fieldName} debe ser un arreglo o un objeto JSON`);
}

function normalizeRating(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    throw new Error('La calificación promedio debe estar entre 0 y 5');
  }

  return Number(rating.toFixed(2));
}

function normalizeActive(active) {
  if (active === undefined) {
    return true;
  }

  if (typeof active === 'boolean') {
    return active;
  }

  if (typeof active === 'string') {
    const normalized = active.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  throw new Error('El estado activo debe ser booleano');
}

function sanitizeFacilitator(facilitator) {
  return {
    ...facilitator,
    createdAt: facilitator.createdAt,
    updatedAt: facilitator.updatedAt,
  };
}

function createFacilitatorService() {
  const facilitators = [];

  return {
    createFacilitator(payload = {}) {
      const usuarioId = String(payload.usuarioId || '').trim();
      const experienciaYears =
        payload.experienciaYears === undefined || payload.experienciaYears === null
          ? null
          : Number(payload.experienciaYears);
      const especialidades = normalizeJsonField(payload.especialidades, 'especialidades');
      const certificaciones = normalizeJsonField(payload.certificaciones, 'certificaciones');
      const disponibilidad = normalizeJsonField(payload.disponibilidad, 'disponibilidad');
      const calificacionPromedio = normalizeRating(payload.calificacionPromedio);
      const activo = normalizeActive(payload.activo);

      if (!usuarioId) {
        throw new Error('El usuario es obligatorio');
      }

      if (facilitators.some((candidate) => candidate.usuarioId === usuarioId)) {
        throw new Error('El usuario ya tiene un perfil de facilitador');
      }

      if (experienciaYears !== null && (!Number.isInteger(experienciaYears) || experienciaYears < 0)) {
        throw new Error('La experiencia en años debe ser un entero positivo');
      }

      const now = new Date().toISOString();
      const facilitator = {
        id: crypto.randomUUID(),
        usuarioId,
        experienciaYears,
        especialidades,
        certificaciones,
        disponibilidad,
        calificacionPromedio,
        activo,
        createdAt: now,
        updatedAt: now,
      };

      facilitators.push(facilitator);
      return sanitizeFacilitator(facilitator);
    },

    getFacilitator(facilitatorId) {
      if (!facilitatorId) {
        throw new Error('El identificador del facilitador es obligatorio');
      }

      const facilitator = facilitators.find((candidate) => candidate.id === facilitatorId);
      if (!facilitator) {
        throw new Error('Facilitador no encontrado');
      }

      return sanitizeFacilitator(facilitator);
    },

    listFacilitators() {
      return facilitators.map((facilitator) => sanitizeFacilitator(facilitator));
    },

    updateFacilitator(facilitatorId, updates = {}) {
      if (!facilitatorId) {
        throw new Error('El identificador del facilitador es obligatorio');
      }

      const facilitator = facilitators.find((candidate) => candidate.id === facilitatorId);
      if (!facilitator) {
        throw new Error('Facilitador no encontrado');
      }

      const next = {
        ...facilitator,
        usuarioId:
          updates.usuarioId === undefined
            ? facilitator.usuarioId
            : String(updates.usuarioId || '').trim(),
        experienciaYears:
          updates.experienciaYears === undefined || updates.experienciaYears === null
            ? facilitator.experienciaYears
            : Number(updates.experienciaYears),
        especialidades:
          updates.especialidades === undefined
            ? facilitator.especialidades
            : normalizeJsonField(updates.especialidades, 'especialidades'),
        certificaciones:
          updates.certificaciones === undefined
            ? facilitator.certificaciones
            : normalizeJsonField(updates.certificaciones, 'certificaciones'),
        disponibilidad:
          updates.disponibilidad === undefined
            ? facilitator.disponibilidad
            : normalizeJsonField(updates.disponibilidad, 'disponibilidad'),
        calificacionPromedio:
          updates.calificacionPromedio === undefined || updates.calificacionPromedio === null
            ? facilitator.calificacionPromedio
            : normalizeRating(updates.calificacionPromedio),
        activo:
          updates.activo === undefined
            ? facilitator.activo
            : normalizeActive(updates.activo),
      };

      if (!next.usuarioId) {
        throw new Error('El usuario es obligatorio');
      }

      if (
        next.experienciaYears !== null &&
        (!Number.isInteger(next.experienciaYears) || next.experienciaYears < 0)
      ) {
        throw new Error('La experiencia en años debe ser un entero positivo');
      }

      const updated = {
        ...next,
        updatedAt: new Date().toISOString(),
      };

      const index = facilitators.findIndex((candidate) => candidate.id === facilitatorId);
      facilitators[index] = updated;

      return sanitizeFacilitator(updated);
    },

    deleteFacilitator(facilitatorId) {
      if (!facilitatorId) {
        throw new Error('El identificador del facilitador es obligatorio');
      }

      const index = facilitators.findIndex((candidate) => candidate.id === facilitatorId);
      if (index === -1) {
        throw new Error('Facilitador no encontrado');
      }

      const [deleted] = facilitators.splice(index, 1);
      return sanitizeFacilitator(deleted);
    },
  };
}

module.exports = {
  createFacilitatorService,
};
