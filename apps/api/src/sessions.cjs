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

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'si', 'sí', '1', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', 'no', '0', 'off'].includes(normalized)) {
      return false;
    }
  }

  return null;
}

function normalizeTopics(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value === undefined || value === null || value === '') {
    return [];
  }

  return [String(value).trim()].filter(Boolean);
}

function sanitizeSession(session) {
  const historial = {
    notas: session.notas || null,
    temasTratados: Array.isArray(session.temasTratados) ? [...session.temasTratados] : [],
    grabacionConsent: Boolean(session.grabacionConsent),
    grabacionUrl: session.grabacionUrl || null,
    recordingConsent: Boolean(session.grabacionConsent),
    recordingUrl: session.grabacionUrl || null,
  };

  return {
    ...session,
    temasTratados: historial.temasTratados,
    grabacionConsent: historial.grabacionConsent,
    grabacionUrl: historial.grabacionUrl,
    recordingConsent: historial.recordingConsent,
    recordingUrl: historial.recordingUrl,
    historial,
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
      const reminderMinutes =
        payload.reminderMinutes === undefined ? 1440 : Number(payload.reminderMinutes);
      const tipo = normalizeType(payload.tipo);
      const estado = normalizeState(payload.estado);
      const enlaceReunion = payload.enlaceReunion ? String(payload.enlaceReunion).trim() : null;
      const sourceHistory = payload.historial && typeof payload.historial === 'object' ? payload.historial : {};
      const notas =
        payload.notas !== undefined
          ? String(payload.notas || '').trim() || null
          : sourceHistory.notas !== undefined
            ? String(sourceHistory.notas || '').trim() || null
            : null;
      const temasTratados = normalizeTopics(
        payload.temasTratados !== undefined ? payload.temasTratados : sourceHistory.temasTratados
      );
      const grabacionConsent =
        normalizeBoolean(
          payload.grabacionConsent !== undefined
            ? payload.grabacionConsent
            : payload.recordingConsent !== undefined
              ? payload.recordingConsent
              : sourceHistory.grabacionConsent !== undefined
                ? sourceHistory.grabacionConsent
                : sourceHistory.recordingConsent
        ) ?? false;
      const grabacionUrl =
        payload.grabacionUrl !== undefined
          ? String(payload.grabacionUrl || '').trim() || null
          : payload.recordingUrl !== undefined
            ? String(payload.recordingUrl || '').trim() || null
            : sourceHistory.grabacionUrl !== undefined
              ? String(sourceHistory.grabacionUrl || '').trim() || null
              : sourceHistory.recordingUrl !== undefined
                ? String(sourceHistory.recordingUrl || '').trim() || null
                : null;

      if (!circleId) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      if (!titulo) {
        throw new Error('El título de la sesión es obligatorio');
      }

      if (!fechaProgramada) {
        throw new Error('La fecha programada es obligatoria');
      }

      if (Number.isNaN(Date.parse(fechaProgramada))) {
        throw new Error('La fecha programada no es válida');
      }

      if (!Number.isInteger(duracionMinutos) || duracionMinutos < 1) {
        throw new Error('La duración en minutos debe ser un entero positivo');
      }

      if (![0, 60, 1440].includes(reminderMinutes)) {
        throw new Error('El recordatorio debe configurarse para 1 hora, 24 horas o desactivarse');
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
        reminderMinutes,
        tipo: tipo || 'video',
        estado: estado || 'programada',
        enlaceReunion,
        notas,
        temasTratados,
        grabacionConsent,
        grabacionUrl,
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

    getCircleHistory(circleId) {
      const normalized = String(circleId || '').trim();
      if (!normalized) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      return sessions
        .filter((session) => session.circleId === normalized)
        .sort((a, b) => new Date(b.fechaProgramada) - new Date(a.fechaProgramada))
        .map((session) => sanitizeSession(session));
    },

    updateSession(sessionId, updates = {}) {
      if (!sessionId) {
        throw new Error('El identificador de la sesión es obligatorio');
      }

      const session = sessions.find((candidate) => candidate.id === sessionId);
      if (!session) {
        throw new Error('Sesión no encontrada');
      }

      const sourceHistory =
        updates.historial && typeof updates.historial === 'object' ? updates.historial : {};
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
          updates.notas !== undefined
            ? updates.notas
              ? String(updates.notas).trim()
              : null
            : sourceHistory.notas !== undefined
              ? String(sourceHistory.notas || '').trim() || null
              : session.notas,
        temasTratados:
          updates.temasTratados !== undefined
            ? normalizeTopics(updates.temasTratados)
            : sourceHistory.temasTratados !== undefined
              ? normalizeTopics(sourceHistory.temasTratados)
              : session.temasTratados || [],
        grabacionConsent:
          updates.grabacionConsent !== undefined
            ? normalizeBoolean(updates.grabacionConsent) ?? false
            : updates.recordingConsent !== undefined
              ? normalizeBoolean(updates.recordingConsent) ?? false
              : sourceHistory.grabacionConsent !== undefined
                ? normalizeBoolean(sourceHistory.grabacionConsent) ?? false
                : sourceHistory.recordingConsent !== undefined
                  ? normalizeBoolean(sourceHistory.recordingConsent) ?? false
                  : Boolean(session.grabacionConsent),
        grabacionUrl:
          updates.grabacionUrl !== undefined
            ? String(updates.grabacionUrl || '').trim() || null
            : updates.recordingUrl !== undefined
              ? String(updates.recordingUrl || '').trim() || null
              : sourceHistory.grabacionUrl !== undefined
                ? String(sourceHistory.grabacionUrl || '').trim() || null
                : sourceHistory.recordingUrl !== undefined
                  ? String(sourceHistory.recordingUrl || '').trim() || null
                  : session.grabacionUrl || null,
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

      if (next.grabacionConsent && !next.grabacionUrl) {
        next.grabacionUrl = session.grabacionUrl || null;
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
