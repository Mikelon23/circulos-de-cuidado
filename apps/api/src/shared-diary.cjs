const crypto = require('node:crypto');

function normalizeText(value, label) {
  const normalized =
    typeof value === 'string' ? value.trim() : String(value || '').trim();
  if (!normalized) {
    throw new Error(`${label} es obligatorio`);
  }
  if (normalized.length > 2000) {
    throw new Error(`${label} debe tener 2000 caracteres o menos`);
  }
  return normalized;
}

function createSharedDiaryService({ circleService, memberService } = {}) {
  if (!circleService || typeof circleService.getCircle !== 'function') {
    throw new Error('Se requiere un servicio de círculos válido');
  }
  if (!memberService || typeof memberService.listMembers !== 'function') {
    throw new Error('Se requiere un servicio de miembros válido');
  }

  const entries = [];

  function assertActiveMember(circleId, userId) {
    const normalizedCircleId = String(circleId || '').trim();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedCircleId) {
      throw new Error('El identificador del círculo es obligatorio');
    }
    if (!normalizedUserId) {
      throw new Error('El identificador del usuario es obligatorio');
    }
    circleService.getCircle(normalizedCircleId);
    const active = memberService
      .listMembers()
      .some(
        (member) =>
          member.circleId === normalizedCircleId &&
          member.usuarioId === normalizedUserId &&
          member.estado === 'activo'
      );
    if (!active) {
      throw new Error('Debes ser miembro activo del círculo');
    }
    return { circleId: normalizedCircleId, userId: normalizedUserId };
  }

  function sanitizeEntry(entry) {
    return {
      ...entry,
      supports: entry.supports.map((support) => ({ ...support })),
    };
  }

  function createEntry(circleId, userId, contenido) {
    const identity = assertActiveMember(circleId, userId);
    const normalizedContent = normalizeText(contenido, 'La entrada');
    const now = new Date().toISOString();
    const entry = {
      id: crypto.randomUUID(),
      circleId: identity.circleId,
      usuarioId: identity.userId,
      contenido: normalizedContent,
      supports: [],
      createdAt: now,
      updatedAt: now,
    };
    entries.push(entry);
    return sanitizeEntry(entry);
  }

  function addSupport(circleId, entryId, userId, contenido) {
    assertActiveMember(circleId, userId);
    const normalizedEntryId = String(entryId || '').trim();
    if (!normalizedEntryId) {
      throw new Error('El identificador de la entrada es obligatorio');
    }
    const entry = entries.find(
      (candidate) =>
        candidate.id === normalizedEntryId && candidate.circleId === String(circleId).trim()
    );
    if (!entry) {
      throw new Error('Entrada del diario no encontrada');
    }
    const support = {
      id: crypto.randomUUID(),
      usuarioId: String(userId).trim(),
      contenido: normalizeText(contenido, 'El mensaje de apoyo'),
      createdAt: new Date().toISOString(),
    };
    entry.supports.push(support);
    entry.updatedAt = support.createdAt;
    return sanitizeEntry(entry);
  }

  function listEntries(circleId, userId) {
    assertActiveMember(circleId, userId);
    return entries
      .filter((entry) => entry.circleId === String(circleId).trim())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(sanitizeEntry);
  }

  return {
    createEntry,
    addSupport,
    listEntries,
  };
}

module.exports = {
  createSharedDiaryService,
};
