const crypto = require('node:crypto');

const VALID_TYPES = new Set(['video', 'chat', 'mixta']);
const VALID_STATES = new Set(['programada', 'en_curso', 'finalizada', 'cancelada']);

function normalizeType(type) {
  if (typeof type !== 'string') {
    return null;
  }

  const normalized = type.trim().toLowerCase();
  return VALID_TYPES.has(normalized) ? normalized : null;
}

function normalizeState(state) {
  if (typeof state !== 'string') {
    return null;
  }

  const normalized = state.trim().toLowerCase();
  return VALID_STATES.has(normalized) ? normalized : null;
}

function sanitizeSession(session) {
  return {
    ...session,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function createSessionService() {
  const sessions = [];

  return {
    createSession(payload = {}) {
      const circleId = String(payload.circleId || '').trim();
      const facilitadorId = payload.facilitadorId ? String(payload.facilitadorId).trim() : null;
      const titulo = String(payload.titulo || '').trim();
      const fechaProgramada = payload.fechaProgramada ? String(payload.fechaProgramada) : null;
      const duracionMinutos = Number(payload.duracionMinutos);
      const tipo = normalizeType(payload.tipo);
      const estado = normalizeState(payload.estado);
      const enlaceReunion = payload.enlaceReunion ? String(payload.enlaceReunion).trim() : null;
      const notas = payload.notas ? String(payload.notas).trim() : null;

      if (!circleId) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      if (!titulo) {
        throw new Error('El título de la sesión es obligatorio');
      }

      if (!fechaProgramada) {
        throw new Error('La fecha programada es obligatoria');
      }

      if (!Number.isInteger(duracionMinutos) || duracionMinutos < 1) {
        throw new Error('La duración en minutos debe ser un entero positivo');
      }

      if (tipo === null && payload.tipo !== undefined) {
        throw new Error('El tipo de sesión no es válido');
      }

      if (estado === null && payload.estado !== undefined) {
        throw new Error('El estado de la sesión no es válido');
      }

      const now = new Date().toISOString();
      const session = {
        id: crypto.randomUUID(),
        circleId,
        facilitadorId,
        titulo,
        fechaProgramada,
        duracionMinutos,
        tipo: tipo || 'video',
        estado: estado || 'programada',
        enlaceReunion,
        notas,
        createdAt: now,
        updatedAt: now,
      };

      sessions.push(session);
      return sanitizeSession(session);
    },

    getSession(sessionId) {
      if (!sessionId) {
        throw new Error('El identificador de la sesión es obligatorio');
      }

      const session = sessions.find((candidate) => candidate.id === sessionId);
      if (!session) {
        throw new Error('Sesión no encontrada');
      }

      return sanitizeSession(session);
    },

    listSessions() {
      return sessions.map((session) => sanitizeSession(session));
    },

    updateSession(sessionId, updates = {}) {
      if (!sessionId) {
        throw new Error('El identificador de la sesión es obligatorio');
      }

      const session = sessions.find((candidate) => candidate.id === sessionId);
      if (!session) {
        throw new Error('Sesión no encontrada');
      }

      const next = {
        ...session,
        circleId:
          updates.circleId === undefined
            ? session.circleId
            : String(updates.circleId || '').trim(),
        facilitadorId:
          updates.facilitadorId === undefined
            ? session.facilitadorId
            : updates.facilitadorId
              ? String(updates.facilitadorId).trim()
              : null,
        titulo:
          updates.titulo === undefined
            ? session.titulo
            : String(updates.titulo || '').trim(),
        fechaProgramada:
          updates.fechaProgramada === undefined
            ? session.fechaProgramada
            : updates.fechaProgramada
              ? String(updates.fechaProgramada)
              : null,
        duracionMinutos:
          updates.duracionMinutos === undefined
            ? session.duracionMinutos
            : Number(updates.duracionMinutos),
        tipo:
          updates.tipo === undefined
            ? session.tipo
            : normalizeType(updates.tipo),
        estado:
          updates.estado === undefined
            ? session.estado
            : normalizeState(updates.estado),
        enlaceReunion:
          updates.enlaceReunion === undefined
            ? session.enlaceReunion
            : updates.enlaceReunion
              ? String(updates.enlaceReunion).trim()
              : null,
        notas:
          updates.notas === undefined
            ? session.notas
            : updates.notas
              ? String(updates.notas).trim()
              : null,
      };

      if (!next.circleId) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      if (!next.titulo) {
        throw new Error('El título de la sesión es obligatorio');
      }

      if (!next.fechaProgramada) {
        throw new Error('La fecha programada es obligatoria');
      }

      if (!Number.isInteger(next.duracionMinutos) || next.duracionMinutos < 1) {
        throw new Error('La duración en minutos debe ser un entero positivo');
      }

      if (next.tipo === null && updates.tipo !== undefined) {
        throw new Error('El tipo de sesión no es válido');
      }

      if (next.estado === null && updates.estado !== undefined) {
        throw new Error('El estado de la sesión no es válido');
      }

      const updated = {
        ...next,
        updatedAt: new Date().toISOString(),
      };

      const index = sessions.findIndex((candidate) => candidate.id === sessionId);
      sessions[index] = updated;

      return sanitizeSession(updated);
    },

    deleteSession(sessionId) {
      if (!sessionId) {
        throw new Error('El identificador de la sesión es obligatorio');
      }

      const index = sessions.findIndex((candidate) => candidate.id === sessionId);
      if (index === -1) {
        throw new Error('Sesión no encontrada');
      }

      const [deleted] = sessions.splice(index, 1);
      return sanitizeSession(deleted);
    },
  };
}

module.exports = {
  createSessionService,
};
