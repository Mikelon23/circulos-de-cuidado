const crypto = require('node:crypto');

const VALID_STATES = new Set(['pending', 'in_review', 'approved', 'rejected', 'completed', 'cancelled']);

function normalizeState(value, fallback = 'pending') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return VALID_STATES.has(normalized) ? normalized : fallback;
}

function sanitizeRequest(request) {
  if (!request) {
    return request;
  }

  return {
    ...request,
    metadata: request.metadata ? { ...request.metadata } : {},
    threshold: Number(request.threshold ?? 0.7),
    compatibilityScore: Number(request.compatibilityScore ?? request.compatibilidad ?? 0),
  };
}

function buildDefaultReason({ currentCircleId, targetCircleId } = {}) {
  const source = currentCircleId ? `del círculo ${currentCircleId}` : 'del grupo actual';
  const destination = targetCircleId ? ` al círculo ${targetCircleId}` : '';

  return `Solicita re-matching ${source}${destination} por falta de conexión con el grupo actual.`;
}

function createCircleChangeService() {
  const requests = [];

  return {
    createRequest(payload = {}) {
      const cuidadorId = String(
        payload.cuidadorId ?? payload.userId ?? payload.usuarioId ?? payload.user ?? ''
      ).trim();
      const currentCircleId = payload.currentCircleId !== undefined
        ? (String(payload.currentCircleId || '').trim() || null)
        : (payload.circleId !== undefined ? (String(payload.circleId || '').trim() || null) : null);
      const targetCircleId = payload.targetCircleId !== undefined
        ? (String(payload.targetCircleId || '').trim() || null)
        : (payload.newCircleId !== undefined ? (String(payload.newCircleId || '').trim() || null) : null);
      const motivo = String(
        payload.motivo ?? payload.reason ?? payload.mensaje ?? payload.message ?? ''
      ).trim() || buildDefaultReason({ currentCircleId, targetCircleId });
      const estado = normalizeState(payload.estado ?? payload.status ?? 'pending', 'pending');
      const threshold = Number(payload.threshold ?? payload.requiredThreshold ?? 0.7);
      const compatibilityScore = Number(payload.compatibilityScore ?? payload.compatibilidad ?? payload.score ?? 0);
      const metadata = payload.metadata && typeof payload.metadata === 'object'
        ? { ...payload.metadata }
        : {};

      if (!cuidadorId) {
        throw new Error('El identificador del cuidador es obligatorio');
      }

      const now = new Date().toISOString();
      const request = {
        id: crypto.randomUUID(),
        cuidadorId,
        currentCircleId,
        targetCircleId,
        motivo,
        estado,
        threshold: Number.isFinite(threshold) ? threshold : 0.7,
        compatibilityScore: Number.isFinite(compatibilityScore) ? compatibilityScore : 0,
        reviewerId: payload.reviewerId ? String(payload.reviewerId).trim() : null,
        metadata,
        createdAt: now,
        updatedAt: now,
      };

      requests.push(request);
      return sanitizeRequest(request);
    },

    listRequests(options = {}) {
      let result = [...requests];

      const requestedCuidadorId = options.cuidadorId ?? options.userId ?? options.usuarioId ?? null;
      if (requestedCuidadorId) {
        result = result.filter((request) => request.cuidadorId === String(requestedCuidadorId));
      }

      if (options.estado) {
        result = result.filter((request) => request.estado === normalizeState(options.estado, request.estado));
      }

      const requestedCircleId = options.currentCircleId ?? options.circleId ?? null;
      if (requestedCircleId) {
        result = result.filter((request) => request.currentCircleId === String(requestedCircleId));
      }

      const sortBy = options.sortBy || 'createdAt';
      if (sortBy === 'createdAt') {
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      return result.map((request) => sanitizeRequest(request));
    },

    getRequest(requestId) {
      if (!requestId) {
        throw new Error('El identificador de la solicitud es obligatorio');
      }

      const request = requests.find((candidate) => candidate.id === requestId);
      if (!request) {
        throw new Error('Solicitud de cambio de círculo no encontrada');
      }

      return sanitizeRequest(request);
    },

    updateRequest(requestId, updates = {}) {
      if (!requestId) {
        throw new Error('El identificador de la solicitud es obligatorio');
      }

      const request = requests.find((candidate) => candidate.id === requestId);
      if (!request) {
        throw new Error('Solicitud de cambio de círculo no encontrada');
      }

      if (updates.cuidadorId !== undefined || updates.userId !== undefined || updates.usuarioId !== undefined) {
        request.cuidadorId = String(
          updates.cuidadorId ?? updates.userId ?? updates.usuarioId ?? request.cuidadorId ?? ''
        ).trim();
      }

      if (updates.currentCircleId !== undefined || updates.circleId !== undefined) {
        request.currentCircleId = String(updates.currentCircleId ?? updates.circleId ?? '').trim() || null;
      }

      if (updates.targetCircleId !== undefined || updates.newCircleId !== undefined) {
        request.targetCircleId = String(updates.targetCircleId ?? updates.newCircleId ?? '').trim() || null;
      }

      if (updates.motivo !== undefined || updates.reason !== undefined || updates.mensaje !== undefined || updates.message !== undefined) {
        request.motivo = String(
          updates.motivo ?? updates.reason ?? updates.mensaje ?? updates.message ?? request.motivo
        ).trim() || request.motivo;
      }

      if (updates.estado !== undefined || updates.status !== undefined) {
        request.estado = normalizeState(
          updates.estado ?? updates.status ?? request.estado,
          request.estado
        );
      }

      if (updates.threshold !== undefined || updates.requiredThreshold !== undefined) {
        const nextThreshold = Number(updates.threshold ?? updates.requiredThreshold ?? request.threshold);
        request.threshold = Number.isFinite(nextThreshold) ? nextThreshold : request.threshold;
      }

      if (
        updates.compatibilityScore !== undefined ||
        updates.compatibilidad !== undefined ||
        updates.score !== undefined
      ) {
        const nextScore = Number(
          updates.compatibilityScore ?? updates.compatibilidad ?? updates.score ?? request.compatibilityScore
        );
        request.compatibilityScore = Number.isFinite(nextScore) ? nextScore : request.compatibilityScore;
      }

      if (updates.reviewerId !== undefined) {
        request.reviewerId = updates.reviewerId ? String(updates.reviewerId).trim() : null;
      }

      if (updates.metadata !== undefined && updates.metadata && typeof updates.metadata === 'object') {
        request.metadata = { ...request.metadata, ...updates.metadata };
      }

      request.updatedAt = new Date().toISOString();
      return sanitizeRequest(request);
    },

    approveRequest(requestId, notes = {}) {
      const nextNotes = typeof notes === 'object' && notes !== null ? notes : { note: notes };
      return this.updateRequest(requestId, {
        estado: 'approved',
        metadata: {
          ...nextNotes,
          approvedAt: new Date().toISOString(),
        },
      });
    },

    rejectRequest(requestId, reason = 'Se rechazó la solicitud de cambio de círculo.') {
      return this.updateRequest(requestId, {
        estado: 'rejected',
        motivo: String(reason).trim() || 'Se rechazó la solicitud de cambio de círculo.',
      });
    },

    completeRequest(requestId, targetCircleId = null) {
      return this.updateRequest(requestId, {
        estado: 'completed',
        targetCircleId: targetCircleId ? String(targetCircleId).trim() : null,
        metadata: {
          completedAt: new Date().toISOString(),
        },
      });
    },

    requestCircleChange(payload = {}) {
      return this.createRequest(payload);
    },

    requestRematch(payload = {}) {
      return this.createRequest({
        ...payload,
        estado: 'pending',
        threshold: payload.threshold ?? payload.requiredThreshold ?? 0.7,
        motivo: payload.motivo ?? payload.reason ?? payload.mensaje ?? payload.message ?? 'Solicita re-matching por falta de conexión con el grupo actual.',
      });
    },

    getRequestsForCaregiver(cuidadorId) {
      return this.listRequests({ cuidadorId });
    },

    listByCaregiver(cuidadorId) {
      return this.getRequestsForCaregiver(cuidadorId);
    },

    getStats() {
      const stats = {
        total: requests.length,
        pending: requests.filter((request) => request.estado === 'pending').length,
        inReview: requests.filter((request) => request.estado === 'in_review').length,
        approved: requests.filter((request) => request.estado === 'approved').length,
        rejected: requests.filter((request) => request.estado === 'rejected').length,
        completed: requests.filter((request) => request.estado === 'completed').length,
        cancelled: requests.filter((request) => request.estado === 'cancelled').length,
      };

      return stats;
    },

    getRequestStats() {
      return this.getStats();
    },

    clearRequests() {
      requests.length = 0;
      return requests.length;
    },
  };
}

module.exports = {
  createCircleChangeService,
  createCircleChangeRequestService: createCircleChangeService,
  createCircleTransferService: createCircleChangeService,
  createRematchService: createCircleChangeService,
  createRematchRequestService: createCircleChangeService,
};
