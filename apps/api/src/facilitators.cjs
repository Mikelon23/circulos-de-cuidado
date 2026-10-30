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

function toArray(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }

  return [value];
}

function normalizeAvailability(value) {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, slots]) => [key.toLowerCase(), Array.isArray(slots) ? slots : []])
  );
}

function timeToMinutes(time) {
  if (typeof time !== 'string') {
    return 0;
  }

  const [hours, minutes = '0'] = time.split(':').map((entry) => Number(entry));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function calculateSlotOverlap(slotA, slotB) {
  if (typeof slotA !== 'string' || typeof slotB !== 'string' || !slotA.includes('-') || !slotB.includes('-')) {
    return 0;
  }

  try {
    const [aStart, aEnd] = slotA.split('-');
    const [bStart, bEnd] = slotB.split('-');

    const aStartMinutes = timeToMinutes(aStart);
    const aEndMinutes = timeToMinutes(aEnd);
    const bStartMinutes = timeToMinutes(bStart);
    const bEndMinutes = timeToMinutes(bEnd);

    if (aStartMinutes >= bEndMinutes || bStartMinutes >= aEndMinutes) {
      return 0;
    }

    return Math.max(0, Math.min(aEndMinutes, bEndMinutes) - Math.max(aStartMinutes, bStartMinutes));
  } catch {
    return 0;
  }
}

function calculateAvailabilityOverlap(a, b) {
  const availabilityA = normalizeAvailability(a);
  const availabilityB = normalizeAvailability(b);
  const days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
  ];

  let total = 0;

  for (const day of days) {
    const slotsA = Array.isArray(availabilityA[day]) ? availabilityA[day] : [];
    const slotsB = Array.isArray(availabilityB[day]) ? availabilityB[day] : [];

    for (const slotA of slotsA) {
      for (const slotB of slotsB) {
        total += calculateSlotOverlap(slotA, slotB);
      }
    }
  }

  return total;
}

function normalizeSpecialities(value) {
  return toArray(value).map((entry) => String(entry).trim().toLowerCase()).filter(Boolean);
}

function getCircleSpecialities(circle = {}, members = []) {
  const direct = normalizeSpecialities(
    circle.especialidades ??
    circle.specialities ??
    circle.tema ??
    circle.theme ??
    circle.categorias ??
    circle.categories ??
    []
  );

  const memberSpecialities = members.flatMap((member) => {
    const memberFields = [
      member.especialidades,
      member.specialities,
      member.tema,
      member.theme,
      member.enfermedadPrincipal,
      member.enfermedad_principal,
      member.categoria,
    ];

    return normalizeSpecialities(memberFields);
  });

  return [...new Set([...direct, ...memberSpecialities])];
}

function getCircleAvailability(circle = {}, members = []) {
  const direct = normalizeAvailability(circle.disponibilidad ?? circle.availability ?? {});
  const memberAvailability = members.reduce((accumulator, member) => {
    const candidate = member.disponibilidad ?? member.availability ?? member.disponibilidadHoraria ?? member.availableHours ?? {};
    return {
      ...accumulator,
      ...normalizeAvailability(candidate),
    };
  }, {});

  return Object.fromEntries(
    Object.entries({ ...direct, ...memberAvailability }).map(([day, slots]) => [day, Array.isArray(slots) ? slots : []])
  );
}

function scoreFacilitatorSpecialities(facilitatorSpecialities, circleSpecialities) {
  const facilitatorSet = new Set(normalizeSpecialities(facilitatorSpecialities));
  const circleSet = new Set(normalizeSpecialities(circleSpecialities));

  if (circleSet.size === 0) {
    return 0.5;
  }

  const overlap = [...circleSet].filter((entry) => facilitatorSet.has(entry));
  if (overlap.length === 0) {
    return 0;
  }

  const ratio = overlap.length / circleSet.size;
  if (ratio >= 1) {
    return 1;
  }

  if (ratio >= 0.5) {
    return 0.8;
  }

  return 0.5;
}

function scoreFacilitatorAvailability(facilitatorAvailability, circleAvailability) {
  const overlapMinutes = calculateAvailabilityOverlap(facilitatorAvailability, circleAvailability);
  if (overlapMinutes >= 120) {
    return 1;
  }

  if (overlapMinutes >= 90) {
    return 0.8;
  }

  if (overlapMinutes >= 60) {
    return 0.6;
  }

  return 0;
}

function scoreFacilitatorExperience(facilitator) {
  const rating = Number(facilitator.calificacionPromedio ?? facilitator.rating ?? 0);
  const experienceYears = Number(facilitator.experienciaYears ?? facilitator.experiencia_anios ?? 0);

  let ratingScore = 0.3;
  if (rating >= 4.5) {
    ratingScore = 1;
  } else if (rating >= 4) {
    ratingScore = 0.85;
  } else if (rating >= 3.5) {
    ratingScore = 0.65;
  }

  if (experienceYears >= 5) {
    ratingScore = Math.min(1, ratingScore + 0.1);
  }

  return Math.max(0, Math.min(1, ratingScore));
}

function calculateFacilitatorCircleScore(facilitator, circle = {}, members = []) {
  const facilitatorSpecialities = normalizeSpecialities(facilitator.especialidades);
  const circleSpecialities = getCircleSpecialities(circle, members);
  const facilitatorAvailability = normalizeAvailability(facilitator.disponibilidad ?? {});
  const circleAvailability = getCircleAvailability(circle, members);
  const specialityScore = scoreFacilitatorSpecialities(facilitatorSpecialities, circleSpecialities);
  const availabilityScore = scoreFacilitatorAvailability(facilitatorAvailability, circleAvailability);
  const experienceScore = scoreFacilitatorExperience(facilitator);

  const total = (0.4 * specialityScore) + (0.35 * availabilityScore) + (0.25 * experienceScore);
  return {
    score: Number(Math.min(1, Math.max(0, total)).toFixed(4)),
    breakdown: {
      especialidades: Number(specialityScore.toFixed(4)),
      disponibilidad: Number(availabilityScore.toFixed(4)),
      experiencia: Number(experienceScore.toFixed(4)),
    },
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

    scoreFacilitatorForCircle(facilitator, circle = {}, members = []) {
      if (!facilitator) {
        throw new Error('Se requiere un facilitador para evaluar');
      }

      return calculateFacilitatorCircleScore(facilitator, circle, members);
    },

    matchFacilitatorForCircle(circle = {}, facilitatorsList = [], membersOverride = []) {
      const candidates = Array.isArray(facilitatorsList) && facilitatorsList.length > 0
        ? facilitatorsList
        : this.listFacilitators();
      const members = Array.isArray(membersOverride) && membersOverride.length > 0
        ? membersOverride
        : (Array.isArray(circle.miembros) ? circle.miembros : (Array.isArray(circle.members) ? circle.members : []));

      let bestFacilitator = null;
      let bestResult = { score: 0, breakdown: { especialidades: 0, disponibilidad: 0, experiencia: 0 } };

      for (const facilitator of candidates) {
        if (facilitator && facilitator.activo === false) {
          continue;
        }

        const evaluation = calculateFacilitatorCircleScore(facilitator, circle, members);
        if (!bestFacilitator || evaluation.score > bestResult.score) {
          bestFacilitator = facilitator;
          bestResult = evaluation;
        }
      }

      if (!bestFacilitator) {
        return {
          facilitator: null,
          score: 0,
          threshold: 0.6,
          match: false,
          breakdown: { especialidades: 0, disponibilidad: 0, experiencia: 0 },
          message: 'No se encontró un facilitador disponible para este círculo.',
        };
      }

      return {
        facilitator: sanitizeFacilitator(bestFacilitator),
        score: bestResult.score,
        threshold: 0.6,
        match: bestResult.score >= 0.6,
        breakdown: bestResult.breakdown,
        message: bestResult.score >= 0.6
          ? 'Se encontró un facilitador compatible para este círculo.'
          : 'El facilitador más compatible no alcanza el umbral mínimo requerido.',
      };
    },

    recommendFacilitatorForCircle(circle = {}, facilitatorsList = [], membersOverride = []) {
      return this.matchFacilitatorForCircle(circle, facilitatorsList, membersOverride);
    },

    getBestFacilitatorForCircle(circle = {}, facilitatorsList = [], membersOverride = []) {
      return this.matchFacilitatorForCircle(circle, facilitatorsList, membersOverride);
    },

    findBestFacilitator(circle = {}, facilitatorsList = [], membersOverride = []) {
      return this.matchFacilitatorForCircle(circle, facilitatorsList, membersOverride);
    },
  };
}

module.exports = {
  createFacilitatorService,
  calculateFacilitatorCircleScore,
  matchFacilitatorForCircle: (circle = {}, facilitatorsList = [], membersOverride = []) => {
    const service = createFacilitatorService();
    return service.matchFacilitatorForCircle(circle, facilitatorsList, membersOverride);
  },
  recommendFacilitatorForCircle: (circle = {}, facilitatorsList = [], membersOverride = []) => {
    const service = createFacilitatorService();
    return service.recommendFacilitatorForCircle(circle, facilitatorsList, membersOverride);
  },
};
