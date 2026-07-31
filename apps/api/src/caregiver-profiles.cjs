const crypto = require('node:crypto');

const VALID_PHASES = new Set(['inicial', 'intermedio', 'avanzado']);

function normalizePhase(phase) {
  if (typeof phase !== 'string') {
    return null;
  }

  const normalized = phase.trim().toLowerCase();
  return VALID_PHASES.has(normalized) ? normalized : null;
}

function normalizeAvailability(availability) {
  if (availability === undefined || availability === null) {
    return null;
  }

  if (typeof availability !== 'object' || Array.isArray(availability)) {
    throw new Error('La disponibilidad horaria debe ser un objeto JSON');
  }

  return availability;
}

function sanitizeProfile(profile) {
  return {
    ...profile,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function createCaregiverProfileService() {
  const profiles = [];

  return {
    createProfile(payload = {}) {
      const usuarioId = String(payload.usuarioId || '').trim();
      const edad = payload.edad === undefined || payload.edad === null ? null : Number(payload.edad);
      const enfermedadPrincipal = payload.enfermedadPrincipal
        ? String(payload.enfermedadPrincipal).trim()
        : null;
      const faseCuidado = normalizePhase(payload.faseCuidado);
      const disponibilidadHoraria = normalizeAvailability(payload.disponibilidadHoraria);
      const idioma = payload.idioma ? String(payload.idioma).trim() : null;
      const ubicacion = payload.ubicacion ? String(payload.ubicacion).trim() : null;
      const urgencia = payload.urgencia === undefined || payload.urgencia === null ? null : Number(payload.urgencia);
      const notas = payload.notas ? String(payload.notas).trim() : null;

      if (!usuarioId) {
        throw new Error('El usuario es obligatorio');
      }

      if (edad !== null && (!Number.isInteger(edad) || edad < 0)) {
        throw new Error('La edad debe ser un entero positivo');
      }

      if (faseCuidado === null && payload.faseCuidado !== undefined) {
        throw new Error('La fase de cuidado no es válida');
      }

      if (urgencia !== null && (!Number.isInteger(urgencia) || urgencia < 1 || urgencia > 10)) {
        throw new Error('La urgencia debe estar entre 1 y 10');
      }

      const now = new Date().toISOString();
      const profile = {
        id: crypto.randomUUID(),
        usuarioId,
        edad,
        enfermedadPrincipal,
        faseCuidado,
        disponibilidadHoraria,
        idioma,
        ubicacion,
        urgencia,
        notas,
        createdAt: now,
        updatedAt: now,
      };

      profiles.push(profile);
      return sanitizeProfile(profile);
    },

    getProfile(profileId) {
      if (!profileId) {
        throw new Error('El identificador del perfil es obligatorio');
      }

      const profile = profiles.find((candidate) => candidate.id === profileId);
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }

      return sanitizeProfile(profile);
    },

    listProfiles() {
      return profiles.map((profile) => sanitizeProfile(profile));
    },

    updateProfile(profileId, updates = {}) {
      if (!profileId) {
        throw new Error('El identificador del perfil es obligatorio');
      }

      const profile = profiles.find((candidate) => candidate.id === profileId);
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }

      const next = {
        ...profile,
        edad:
          updates.edad === undefined || updates.edad === null
            ? profile.edad
            : Number(updates.edad),
        enfermedadPrincipal:
          updates.enfermedadPrincipal === undefined
            ? profile.enfermedadPrincipal
            : updates.enfermedadPrincipal
              ? String(updates.enfermedadPrincipal).trim()
              : null,
        faseCuidado:
          updates.faseCuidado === undefined
            ? profile.faseCuidado
            : normalizePhase(updates.faseCuidado),
        disponibilidadHoraria:
          updates.disponibilidadHoraria === undefined
            ? profile.disponibilidadHoraria
            : normalizeAvailability(updates.disponibilidadHoraria),
        idioma:
          updates.idioma === undefined
            ? profile.idioma
            : updates.idioma
              ? String(updates.idioma).trim()
              : null,
        ubicacion:
          updates.ubicacion === undefined
            ? profile.ubicacion
            : updates.ubicacion
              ? String(updates.ubicacion).trim()
              : null,
        urgencia:
          updates.urgencia === undefined || updates.urgencia === null
            ? profile.urgencia
            : Number(updates.urgencia),
        notas:
          updates.notas === undefined
            ? profile.notas
            : updates.notas
              ? String(updates.notas).trim()
              : null,
      };

      if (next.edad !== null && (!Number.isInteger(next.edad) || next.edad < 0)) {
        throw new Error('La edad debe ser un entero positivo');
      }

      if (next.faseCuidado === null && updates.faseCuidado !== undefined) {
        throw new Error('La fase de cuidado no es válida');
      }

      if (next.urgencia !== null && (!Number.isInteger(next.urgencia) || next.urgencia < 1 || next.urgencia > 10)) {
        throw new Error('La urgencia debe estar entre 1 y 10');
      }

      const updated = {
        ...next,
        updatedAt: new Date().toISOString(),
      };

      const index = profiles.findIndex((candidate) => candidate.id === profileId);
      profiles[index] = updated;

      return sanitizeProfile(updated);
    },

    deleteProfile(profileId) {
      if (!profileId) {
        throw new Error('El identificador del perfil es obligatorio');
      }

      const index = profiles.findIndex((candidate) => candidate.id === profileId);
      if (index === -1) {
        throw new Error('Perfil no encontrado');
      }

      const [deleted] = profiles.splice(index, 1);
      return sanitizeProfile(deleted);
    },
  };
}

module.exports = {
  createCaregiverProfileService,
};
