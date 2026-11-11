const crypto = require('node:crypto');

const VALID_TYPES = new Set(['texto', 'imagen', 'archivo', 'text', 'image', 'file']);

function normalizeType(type) {
  if (typeof type !== 'string') {
    return null;
  }

  const normalized = type.trim().toLowerCase();
  const mapped = {
    text: 'texto',
    image: 'imagen',
    file: 'archivo',
  }[normalized] || normalized;

  return VALID_TYPES.has(mapped) ? mapped : null;
}

function sanitizeMessage(message) {
  if (!message) {
    return message;
  }

  return {
    ...message,
    metadata: message.metadata ? { ...message.metadata } : {},
    reactions: Array.isArray(message.reactions) ? [...message.reactions] : [],
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    deletedAt: message.deletedAt ?? null,
  };
}

function createMessageService() {
  const messages = [];

  return {
    createMessage(payload = {}) {
      const circleId = String(payload.circleId || payload.circuloId || '').trim();
      const usuarioId = String(payload.usuarioId || payload.userId || '').trim();
      const contenidoRaw =
        payload.contenido ??
        payload.content ??
        payload.texto ??
        payload.message ??
        payload.mensaje ??
        '';
      const contenido = typeof contenidoRaw === 'string' ? contenidoRaw.trim() : String(contenidoRaw ?? '').trim();
      const tipo = normalizeType(payload.tipo ?? payload.type ?? 'texto');
      const replyToId = payload.replyToId ?? payload.reply_to_id ?? payload.replyTo ?? null;
      const metadata =
        payload.metadata !== undefined
          ? payload.metadata
          : payload.metadatos !== undefined
            ? payload.metadatos
            : {};
      const reactions = Array.isArray(payload.reacciones ?? payload.reactions)
        ? payload.reacciones ?? payload.reactions
        : [];

      if (!circleId) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      if (!usuarioId) {
        throw new Error('El identificador del usuario es obligatorio');
      }

      const fallbackContenido = String(
        payload.archivo ?? payload.file ?? payload.adjunto ?? payload.attachment ?? ''
      ).trim();

      if (!contenido && !fallbackContenido) {
        throw new Error('El contenido del mensaje es obligatorio');
      }

      if (tipo === null && (payload.tipo !== undefined || payload.type !== undefined)) {
        throw new Error('El tipo de mensaje no es válido');
      }

      if (replyToId) {
        const replyTargetId = String(replyToId).trim();
        const replyExists = messages.some(
          (candidate) => candidate.id === replyTargetId && candidate.circleId === circleId
        );

        if (!replyExists) {
          throw new Error('El mensaje de respuesta no existe en este círculo');
        }
      }

      const now = new Date().toISOString();
      const message = {
        id: crypto.randomUUID(),
        circleId,
        usuarioId,
        contenido: contenido || fallbackContenido || 'Archivo adjunto',
        tipo: tipo || 'texto',
        replyToId: replyToId ? String(replyToId).trim() : null,
        metadata: metadata && typeof metadata === 'object' ? { ...metadata } : {},
        reactions: Array.isArray(reactions) ? [...reactions] : [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      messages.push(message);
      return sanitizeMessage(message);
    },

    getMessage(messageId) {
      if (!messageId) {
        throw new Error('El identificador del mensaje es obligatorio');
      }

      const message = messages.find((candidate) => candidate.id === messageId);
      if (!message) {
        throw new Error('Mensaje no encontrado');
      }

      return sanitizeMessage(message);
    },

    listMessages(options = {}) {
      let result = messages.filter((message) => !message.deletedAt || options.includeDeleted);

      if (options.circleId) {
        result = result.filter((message) => message.circleId === String(options.circleId));
      }

      if (options.usuarioId) {
        result = result.filter((message) => message.usuarioId === String(options.usuarioId));
      }

      if (options.replyToId !== undefined) {
        const replyId = options.replyToId ? String(options.replyToId).trim() : null;
        result = result.filter((message) => message.replyToId === replyId);
      }

      if (options.limit !== undefined && Number.isInteger(Number(options.limit))) {
        result = result.slice(0, Number(options.limit));
      }

      return result.map((message) => sanitizeMessage(message));
    },

    updateMessage(messageId, updates = {}) {
      if (!messageId) {
        throw new Error('El identificador del mensaje es obligatorio');
      }

      const message = messages.find((candidate) => candidate.id === messageId);
      if (!message) {
        throw new Error('Mensaje no encontrado');
      }

      const next = {
        ...message,
        circleId:
          updates.circleId === undefined
            ? message.circleId
            : String(updates.circleId || '').trim(),
        usuarioId:
          updates.usuarioId === undefined
            ? message.usuarioId
            : String(updates.usuarioId || '').trim(),
        contenido:
          updates.contenido === undefined &&
          updates.content === undefined &&
          updates.texto === undefined &&
          updates.message === undefined &&
          updates.mensaje === undefined
            ? message.contenido
            : String(
                updates.contenido ??
                  updates.content ??
                  updates.texto ??
                  updates.message ??
                  updates.mensaje ??
                  message.contenido
              ).trim(),
        tipo:
          updates.tipo === undefined && updates.type === undefined
            ? message.tipo
            : normalizeType(updates.tipo ?? updates.type ?? message.tipo),
        replyToId:
          updates.replyToId === undefined && updates.reply_to_id === undefined
            ? message.replyToId
            : updates.replyToId === null || updates.reply_to_id === null
              ? null
              : String(updates.replyToId ?? updates.reply_to_id ?? '').trim(),
        metadata:
          updates.metadata !== undefined || updates.metadatos !== undefined
            ? {
                ...message.metadata,
                ...(updates.metadata !== undefined ? updates.metadata : updates.metadatos ?? {}),
              }
            : message.metadata,
        reactions:
          updates.reacciones !== undefined || updates.reactions !== undefined
            ? Array.isArray(updates.reacciones ?? updates.reactions)
              ? [...(updates.reacciones ?? updates.reactions)]
              : message.reactions
            : message.reactions,
      };

      if (!next.circleId) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      if (!next.usuarioId) {
        throw new Error('El identificador del usuario es obligatorio');
      }

      if (!next.contenido && !(next.metadata?.archivo || next.metadata?.file || next.metadata?.adjunto)) {
        throw new Error('El contenido del mensaje es obligatorio');
      }

      if (next.tipo === null && (updates.tipo !== undefined || updates.type !== undefined)) {
        throw new Error('El tipo de mensaje no es válido');
      }

      if (next.replyToId) {
        const replyExists = messages.some(
          (candidate) => candidate.id === next.replyToId && candidate.circleId === next.circleId
        );

        if (!replyExists) {
          throw new Error('El mensaje de respuesta no existe en este círculo');
        }
      }

      const updated = {
        ...next,
        updatedAt: new Date().toISOString(),
      };

      const index = messages.findIndex((candidate) => candidate.id === messageId);
      messages[index] = updated;

      return sanitizeMessage(updated);
    },

    deleteMessage(messageId) {
      if (!messageId) {
        throw new Error('El identificador del mensaje es obligatorio');
      }

      const index = messages.findIndex((candidate) => candidate.id === messageId);
      if (index === -1) {
        throw new Error('Mensaje no encontrado');
      }

      const [deleted] = messages.splice(index, 1);
      return sanitizeMessage(deleted);
    },
  };
}

module.exports = {
  createMessageService,
  createCircleMessageService: createMessageService,
};
