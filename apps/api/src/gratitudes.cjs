const crypto = require('node:crypto');

function normalizeGratitudeInput(payload = {}) {
  const usuarioId = String(payload.usuarioId || '').trim();
  const respuesta = payload.respuesta ? String(payload.respuesta).trim() : '';
  const fecha = payload.fecha ? String(payload.fecha).trim() : new Date().toISOString();

  if (!usuarioId) {
    throw new Error('El identificador del usuario es obligatorio');
  }

  if (!respuesta) {
    throw new Error('Comparte algo que te haya hecho sonreír');
  }

  if (respuesta.length > 500) {
    throw new Error('La respuesta debe tener 500 caracteres o menos');
  }

  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    throw new Error('La fecha no es válida');
  }

  return {
    usuarioId,
    respuesta,
    fecha: date.toISOString(),
  };
}

function createGratitudeService() {
  const gratitudes = [];

  return {
    createGratitude(payload = {}) {
      const normalized = normalizeGratitudeInput(payload);
      const now = new Date().toISOString();
      const gratitude = {
        id: crypto.randomUUID(),
        ...normalized,
        createdAt: now,
        updatedAt: now,
      };

      gratitudes.push(gratitude);
      return { ...gratitude };
    },

    listGratitudesByUser(usuarioId) {
      if (!usuarioId) {
        throw new Error('El identificador del usuario es obligatorio');
      }

      return gratitudes
        .filter((gratitude) => gratitude.usuarioId === String(usuarioId).trim())
        .sort((left, right) => new Date(right.fecha) - new Date(left.fecha))
        .map((gratitude) => ({ ...gratitude }));
    },
  };
}

module.exports = {
  createGratitudeService,
  normalizeGratitudeInput,
};
