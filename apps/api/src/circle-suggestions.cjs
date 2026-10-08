const crypto = require('node:crypto');

const VALID_STATES = new Set(['pending', 'sent', 'read', 'accepted', 'dismissed']);
const VALID_TYPES = new Set(['circle_suggestion', 'circle_offer', 'match_notification']);

function normalizeState(value, fallback = 'pending') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return VALID_STATES.has(normalized) ? normalized : fallback;
}

function normalizeType(value, fallback = 'circle_suggestion') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return VALID_TYPES.has(normalized) ? normalized : fallback;
}

function normalizeScore(value, fallback = 85) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) {
    return Number(fallback);
  }

  const absolute = Math.abs(parsed);
  const normalized = absolute <= 1 ? parsed * 100 : parsed;

  return Math.min(100, Math.max(0, normalized));
}

function sanitizeSuggestion(suggestion) {
  if (!suggestion) {
    return suggestion;
  }

  return {
    ...suggestion,
    score: Number(suggestion.score ?? 0),
    metadata: suggestion.metadata ? { ...suggestion.metadata } : {},
  };
}

function buildSuggestionMessage({ circleName, score } = {}) {
  const label = circleName ? `"${circleName}"` : 'un círculo compatible';
  const scoreLabel = Number(score ?? 0).toFixed(2);

  return `Hemos encontrado ${label} para ti (compatibilidad ${scoreLabel}%). Revisa tu panel de sugerencias y confirma si te interesa.`;
}

function createCircleSuggestionService() {
  const suggestions = [];

  function createSuggestion(payload = {}) {
    const cuidadorId = String(payload.cuidadorId || payload.userId || '').trim();
    const circleId = payload.circleId ? String(payload.circleId).trim() : (payload.circle && payload.circle.id ? String(payload.circle.id).trim() : null);
    const circleName = payload.circleName || payload.nombre || payload.circle?.nombre || payload.circle?.name || null;
    const score = normalizeScore(
      payload.score ?? payload.compatibilidad ?? payload.compatibility ?? payload.percent ?? 85
    );
    const tipo = normalizeType(payload.tipo || payload.type || 'circle_suggestion', 'circle_suggestion');
    const estado = normalizeState(payload.estado || payload.status || 'sent', 'sent');
    const message =
      payload.mensaje ||
      payload.message ||
      buildSuggestionMessage({ circleName, score });

    if (!cuidadorId) {
      throw new Error('El identificador del cuidador es obligatorio');
    }

    const suggestion = {
      id: crypto.randomUUID(),
      cuidadorId,
      circleId,
      circleName,
      score,
      tipo,
      estado,
      mensaje: String(message).trim() || buildSuggestionMessage({ circleName, score }),
      metadata: payload.metadata && typeof payload.metadata === 'object' ? { ...payload.metadata } : {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    suggestions.push(suggestion);
    return sanitizeSuggestion({ ...suggestion });
  }

  return {
    createSuggestion,

    listSuggestions(options = {}) {
      let result = [...suggestions];

      if (options.cuidadorId) {
        result = result.filter((suggestion) => suggestion.cuidadorId === String(options.cuidadorId));
      }

      if (options.estado) {
        result = result.filter((suggestion) => suggestion.estado === normalizeState(options.estado, 'pending'));
      }

      if (options.tipo) {
        result = result.filter((suggestion) => suggestion.tipo === normalizeType(options.tipo, 'circle_suggestion'));
      }

      if (options.sort === 'score' || options.sortBy === 'score') {
        result.sort((a, b) => b.score - a.score);
      } else if (options.sort === 'createdAt' || options.sortBy === 'createdAt') {
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      return result.map(sanitizeSuggestion);
    },

    getSuggestion(suggestionId) {
      if (!suggestionId) {
        throw new Error('El identificador de la sugerencia es obligatorio');
      }

      const suggestion = suggestions.find((candidate) => candidate.id === suggestionId);
      if (!suggestion) {
        throw new Error('Sugerencia no encontrada');
      }

      return sanitizeSuggestion(suggestion);
    },

    getSuggestionsForCaregiver(cuidadorId) {
      if (!cuidadorId) {
        throw new Error('El identificador del cuidador es obligatorio');
      }

      return this.listSuggestions({ cuidadorId }).map((suggestion) => ({ ...suggestion }));
    },

    updateSuggestion(suggestionId, updates = {}) {
      if (!suggestionId) {
        throw new Error('El identificador de la sugerencia es obligatorio');
      }

      const suggestion = suggestions.find((candidate) => candidate.id === suggestionId);
      if (!suggestion) {
        throw new Error('Sugerencia no encontrada');
      }

      if (updates.cuidadorId !== undefined) {
        suggestion.cuidadorId = String(updates.cuidadorId || '').trim();
      }

      if (updates.circleId !== undefined) {
        suggestion.circleId = updates.circleId ? String(updates.circleId).trim() : null;
      }

      if (updates.circleName !== undefined || updates.nombre !== undefined) {
        suggestion.circleName = updates.circleName || updates.nombre || suggestion.circleName || null;
      }

      if (
        updates.score !== undefined ||
        updates.compatibilidad !== undefined ||
        updates.compatibility !== undefined ||
        updates.percent !== undefined
      ) {
        suggestion.score = normalizeScore(
          updates.score ?? updates.compatibilidad ?? updates.compatibility ?? updates.percent ?? suggestion.score
        );
      }

      if (updates.estado !== undefined || updates.status !== undefined) {
        suggestion.estado = normalizeState(
          updates.estado ?? updates.status ?? suggestion.estado,
          suggestion.estado
        );
      }

      if (updates.tipo !== undefined || updates.type !== undefined) {
        suggestion.tipo = normalizeType(
          updates.tipo ?? updates.type ?? suggestion.tipo,
          suggestion.tipo
        );
      }

      if (updates.mensaje !== undefined || updates.message !== undefined) {
        suggestion.mensaje = String(updates.mensaje ?? updates.message ?? suggestion.mensaje).trim();
      }

      if (updates.metadata !== undefined) {
        suggestion.metadata = updates.metadata && typeof updates.metadata === 'object'
          ? { ...suggestion.metadata, ...updates.metadata }
          : { ...suggestion.metadata };
      }

      suggestion.updatedAt = new Date().toISOString();
      return sanitizeSuggestion(suggestion);
    },

    markAsRead(suggestionId) {
      return this.updateSuggestion(suggestionId, { estado: 'read' });
    },

    dismissSuggestion(suggestionId) {
      return this.updateSuggestion(suggestionId, { estado: 'dismissed' });
    },

    generateForCaregiver(cuidadorId, circle, options = {}) {
      const circleData = circle && typeof circle === 'object' ? circle : {};
      const circleIdentifier = circleData.id || options.circleId || null;
      const circleLabel = circleData.nombre || options.circleName || circleData.name || null;
      const rawScore = options.score ?? circleData.score ?? circleData.compatibilidad ?? circleData.compatibility ?? 0.85;

      return this.createSuggestion({
        cuidadorId,
        circleId: circleIdentifier,
        circleName: circleLabel,
        score: normalizeScore(rawScore),
        tipo: options.tipo || options.type || 'circle_suggestion',
        estado: options.estado || options.status || 'sent',
        mensaje: options.mensaje || options.message,
        metadata: {
          ...(circleData.metadata || {}),
          ...(options.metadata || {}),
        },
      });
    },

    getAll() {
      return this.listSuggestions();
    },

    clearSuggestions() {
      suggestions.length = 0;
      return suggestions.length;
    },
  };
}

module.exports = {
  createCircleSuggestionService,
  createNotificationService: createCircleSuggestionService,
};
