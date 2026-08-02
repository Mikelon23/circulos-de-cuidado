const crypto = require('node:crypto');

function sanitizeCheckIn(checkIn) {
  return {
    ...checkIn,
    createdAt: checkIn.createdAt,
    updatedAt: checkIn.updatedAt,
  };
}

function createCheckInEmotionalService() {
  const checkIns = [];

  return {
    createCheckIn(payload = {}) {
      const usuarioId = String(payload.usuarioId || '').trim();
      const pregunta = String(payload.pregunta || '').trim();
      const escala = Number(payload.escala);
      const nota = payload.nota ? String(payload.nota).trim() : null;
      const respondidoEn = payload.respondidoEn ? String(payload.respondidoEn) : new Date().toISOString();

      if (!usuarioId) {
        throw new Error('El identificador del usuario es obligatorio');
      }

      if (!pregunta) {
        throw new Error('La pregunta del check-in es obligatoria');
      }

      if (!Number.isInteger(escala) || escala < 1 || escala > 10) {
        throw new Error('La escala debe ser un entero entre 1 y 10');
      }

      const now = new Date().toISOString();
      const checkIn = {
        id: crypto.randomUUID(),
        usuarioId,
        pregunta,
        escala,
        nota,
        respondidoEn,
        createdAt: now,
        updatedAt: now,
      };

      checkIns.push(checkIn);
      return sanitizeCheckIn(checkIn);
    },

    getCheckIn(checkInId) {
      if (!checkInId) {
        throw new Error('El identificador del check-in es obligatorio');
      }

      const checkIn = checkIns.find((candidate) => candidate.id === checkInId);
      if (!checkIn) {
        throw new Error('Check-in no encontrado');
      }

      return sanitizeCheckIn(checkIn);
    },

    listCheckIns() {
      return checkIns.map((checkIn) => sanitizeCheckIn(checkIn));
    },

    listCheckInsByUser(usuarioId) {
      if (!usuarioId) {
        throw new Error('El identificador del usuario es obligatorio');
      }

      const userCheckIns = checkIns
        .filter((checkIn) => checkIn.usuarioId === String(usuarioId).trim())
        .sort((a, b) => new Date(b.respondidoEn) - new Date(a.respondidoEn));

      return userCheckIns.map((checkIn) => sanitizeCheckIn(checkIn));
    },

    updateCheckIn(checkInId, updates = {}) {
      if (!checkInId) {
        throw new Error('El identificador del check-in es obligatorio');
      }

      const checkIn = checkIns.find((candidate) => candidate.id === checkInId);
      if (!checkIn) {
        throw new Error('Check-in no encontrado');
      }

      const next = {
        ...checkIn,
        usuarioId:
          updates.usuarioId === undefined
            ? checkIn.usuarioId
            : String(updates.usuarioId || '').trim(),
        pregunta:
          updates.pregunta === undefined
            ? checkIn.pregunta
            : String(updates.pregunta || '').trim(),
        escala:
          updates.escala === undefined
            ? checkIn.escala
            : Number(updates.escala),
        nota:
          updates.nota === undefined
            ? checkIn.nota
            : updates.nota
              ? String(updates.nota).trim()
              : null,
        respondidoEn:
          updates.respondidoEn === undefined
            ? checkIn.respondidoEn
            : updates.respondidoEn
              ? String(updates.respondidoEn)
              : new Date().toISOString(),
      };

      if (!next.usuarioId) {
        throw new Error('El identificador del usuario es obligatorio');
      }

      if (!next.pregunta) {
        throw new Error('La pregunta del check-in es obligatoria');
      }

      if (!Number.isInteger(next.escala) || next.escala < 1 || next.escala > 10) {
        throw new Error('La escala debe ser un entero entre 1 y 10');
      }

      const updated = {
        ...next,
        updatedAt: new Date().toISOString(),
      };

      const index = checkIns.findIndex((candidate) => candidate.id === checkInId);
      checkIns[index] = updated;

      return sanitizeCheckIn(updated);
    },

    deleteCheckIn(checkInId) {
      if (!checkInId) {
        throw new Error('El identificador del check-in es obligatorio');
      }

      const index = checkIns.findIndex((candidate) => candidate.id === checkInId);
      if (index === -1) {
        throw new Error('Check-in no encontrado');
      }

      const [deleted] = checkIns.splice(index, 1);
      return sanitizeCheckIn(deleted);
    },
  };
}

module.exports = {
  createCheckInEmotionalService,
};
