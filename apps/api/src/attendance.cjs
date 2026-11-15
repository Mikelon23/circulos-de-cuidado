function normalizeTimestamp(value, fallback) {
  const timestamp = value === undefined ? fallback : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    throw new Error('La fecha de asistencia no es válida');
  }
  return timestamp;
}

function createAttendanceService({ getSession, now = Date.now } = {}) {
  if (typeof getSession !== 'function') {
    throw new Error('Se requiere una función para consultar sesiones');
  }

  const attendance = new Map();

  function getRecord(sessionId, userId, create = false) {
    const key = `${sessionId}:${userId}`;
    let record = attendance.get(key);
    if (!record && create) {
      record = {
        sessionId,
        userId,
        firstJoinedAt: null,
        lastJoinedAt: null,
        leftAt: null,
        connectedSeconds: 0,
        connectionCount: 0,
        participationCount: 0,
        isConnected: false,
      };
      attendance.set(key, record);
    }
    return record;
  }

  function validateIdentity(sessionId, userId) {
    const normalizedSessionId = String(sessionId || '').trim();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedSessionId) {
      throw new Error('El identificador de la sesión es obligatorio');
    }
    if (!normalizedUserId) {
      throw new Error('El identificador del usuario es obligatorio');
    }
    getSession(normalizedSessionId);
    return { sessionId: normalizedSessionId, userId: normalizedUserId };
  }

  function sanitizeRecord(record, at = now()) {
    const currentSeconds = record.isConnected
      ? Math.max(0, Math.floor((at - Date.parse(record.lastJoinedAt)) / 1000))
      : 0;
    return {
      sessionId: record.sessionId,
      userId: record.userId,
      attended: Boolean(record.firstJoinedAt),
      firstJoinedAt: record.firstJoinedAt,
      lastJoinedAt: record.lastJoinedAt,
      leftAt: record.leftAt,
      isConnected: record.isConnected,
      connectedSeconds: record.connectedSeconds + currentSeconds,
      connectionCount: record.connectionCount,
      participationCount: record.participationCount,
    };
  }

  return {
    recordJoin(sessionId, userId, joinedAt) {
      const identity = validateIdentity(sessionId, userId);
      const timestamp = normalizeTimestamp(joinedAt, now());
      const record = getRecord(identity.sessionId, identity.userId, true);

      if (!record.isConnected) {
        const joinedAtIso = new Date(timestamp).toISOString();
        record.firstJoinedAt = record.firstJoinedAt || joinedAtIso;
        record.lastJoinedAt = joinedAtIso;
        record.leftAt = null;
        record.connectionCount += 1;
        record.isConnected = true;
      }

      return sanitizeRecord(record, timestamp);
    },

    recordLeave(sessionId, userId, leftAt) {
      const identity = validateIdentity(sessionId, userId);
      const record = getRecord(identity.sessionId, identity.userId);
      if (!record) {
        throw new Error('No existe una asistencia activa para esta sesión');
      }

      if (record.isConnected) {
        const timestamp = normalizeTimestamp(leftAt, now());
        const joinedAt = Date.parse(record.lastJoinedAt);
        if (timestamp < joinedAt) {
          throw new Error('La salida no puede ser anterior a la entrada');
        }
        record.connectedSeconds += Math.floor((timestamp - joinedAt) / 1000);
        record.leftAt = new Date(timestamp).toISOString();
        record.isConnected = false;
      }

      return sanitizeRecord(record);
    },

    recordParticipation(sessionId, userId, occurredAt) {
      const identity = validateIdentity(sessionId, userId);
      const record = getRecord(identity.sessionId, identity.userId);
      if (!record || !record.isConnected) {
        throw new Error('Debes estar conectado a la sesión para registrar participación');
      }

      normalizeTimestamp(occurredAt, now());
      record.participationCount += 1;
      return sanitizeRecord(record);
    },

    getUserAttendance(sessionId, userId) {
      const identity = validateIdentity(sessionId, userId);
      const record = getRecord(identity.sessionId, identity.userId);
      return record ? sanitizeRecord(record) : null;
    },

    getSessionAttendance(sessionId, userIds = []) {
      const normalizedSessionId = String(sessionId || '').trim();
      if (!normalizedSessionId) {
        throw new Error('El identificador de la sesión es obligatorio');
      }
      getSession(normalizedSessionId);
      userIds.forEach((userId) => {
        const normalizedUserId = String(userId || '').trim();
        if (normalizedUserId) getRecord(normalizedSessionId, normalizedUserId, true);
      });
      return [...attendance.values()]
        .filter((record) => record.sessionId === normalizedSessionId)
        .map((record) => sanitizeRecord(record))
        .sort((a, b) => b.connectedSeconds - a.connectedSeconds);
    },
  };
}

module.exports = {
  createAttendanceService,
};
