/**
 * Waiting Queue Service
 * Manages caregivers waiting for circle assignment
 */

const crypto = require('node:crypto');

const VALID_STATUSES = new Set(['waiting', 'offered', 'accepted', 'rejected', 'cancelled']);

/**
 * Normalize queue entry status
 * @param {string} status - Status value
 * @returns {string|null} - Normalized status or null if invalid
 */
function normalizeStatus(status) {
  if (typeof status !== 'string') {
    return null;
  }

  const normalized = status.trim().toLowerCase();
  return VALID_STATUSES.has(normalized) ? normalized : null;
}

/**
 * Sanitize queue entry for output
 * @param {object} entry - Queue entry
 * @returns {object} - Sanitized entry
 */
function sanitizeEntry(entry) {
  return {
    id: entry.id,
    cuidadorId: entry.cuidadorId,
    perfilCuidador: entry.perfilCuidador,
    urgencia: entry.urgencia,
    estado: entry.estado,
    fechaAgregado: entry.fechaAgregado,
    fechaOfrecido: entry.fechaOfrecido,
    fechaActualizado: entry.fechaActualizado,
    notas: entry.notas,
  };
}

/**
 * Create waiting queue service
 * @returns {object} - Service with queue operations
 */
function createWaitingQueueService() {
  const queue = [];

  return {
    /**
     * Add caregiver to waiting queue
     * @param {object} payload - Entry data
     * @returns {object} - Created queue entry
     */
    addToQueue(payload = {}) {
      const cuidadorId = String(payload.cuidadorId || '').trim();
      const perfilCuidador = payload.perfilCuidador || {};
      const urgencia = typeof payload.urgencia === 'number' ? payload.urgencia : 5;
      const estado = normalizeStatus(payload.estado);
      const notas = payload.notas ? String(payload.notas).trim() : null;

      if (!cuidadorId) {
        throw new Error('El identificador del cuidador es obligatorio');
      }

      if (typeof perfilCuidador !== 'object' || perfilCuidador === null) {
        throw new Error('El perfil del cuidador debe ser un objeto válido');
      }

      if (typeof urgencia !== 'number' || urgencia < 1 || urgencia > 10) {
        throw new Error('La urgencia debe ser un número entre 1 y 10');
      }

      // Check if caregiver is already in queue
      const existingEntry = queue.find((entry) => entry.cuidadorId === cuidadorId);
      if (existingEntry) {
        throw new Error('El cuidador ya está en la cola de espera');
      }

      const now = new Date().toISOString();
      const entry = {
        id: crypto.randomUUID(),
        cuidadorId,
        perfilCuidador: { ...perfilCuidador },
        urgencia,
        estado: estado || 'waiting',
        fechaAgregado: now,
        fechaOfrecido: null,
        fechaActualizado: now,
        notas,
      };

      queue.push(entry);
      return sanitizeEntry(entry);
    },

    /**
     * Get queue entry by ID
     * @param {string} entryId - Entry ID
     * @returns {object} - Queue entry
     */
    getQueueEntry(entryId) {
      if (!entryId) {
        throw new Error('El identificador de la entrada es obligatorio');
      }

      const entry = queue.find((candidate) => candidate.id === entryId);
      if (!entry) {
        throw new Error('Entrada en cola no encontrada');
      }

      return sanitizeEntry(entry);
    },

    /**
     * List all queue entries, optionally filtered
     * @param {object} options - Filter options
     * @param {string} options.status - Filter by status
     * @param {string} options.sortBy - Sort field ('urgencia', 'fechaAgregado')
     * @param {string} options.order - Sort order ('asc', 'desc')
     * @returns {object[]} - List of queue entries
     */
    listQueue(options = {}) {
      let result = [...queue];

      // Filter by status if provided
      if (options.status) {
        const normalizedStatus = normalizeStatus(options.status);
        if (normalizedStatus) {
          result = result.filter((entry) => entry.estado === normalizedStatus);
        }
      }

      // Sort
      const sortBy = options.sortBy || 'urgencia';
      const order = options.order === 'asc' ? 'asc' : 'desc';

      if (sortBy === 'urgencia') {
        result.sort((a, b) => {
          if (order === 'asc') {
            return a.urgencia - b.urgencia;
          }
          return b.urgencia - a.urgencia;
        });
      } else if (sortBy === 'fechaAgregado') {
        result.sort((a, b) => {
          const dateA = new Date(a.fechaAgregado).getTime();
          const dateB = new Date(b.fechaAgregado).getTime();
          if (order === 'asc') {
            return dateA - dateB;
          }
          return dateB - dateA;
        });
      }

      return result.map(sanitizeEntry);
    },

    /**
     * Update queue entry status
     * @param {string} entryId - Entry ID
     * @param {object} updates - Fields to update
     * @returns {object} - Updated entry
     */
    updateQueueEntry(entryId, updates = {}) {
      if (!entryId) {
        throw new Error('El identificador de la entrada es obligatorio');
      }

      const entry = queue.find((candidate) => candidate.id === entryId);
      if (!entry) {
        throw new Error('Entrada en cola no encontrada');
      }

      // Update status if provided
      if (updates.estado !== undefined) {
        const normalizedStatus = normalizeStatus(updates.estado);
        if (normalizedStatus === null && updates.estado !== undefined) {
          throw new Error('El estado no es válido');
        }
        if (normalizedStatus) {
          entry.estado = normalizedStatus;
          if (normalizedStatus === 'offered') {
            entry.fechaOfrecido = new Date().toISOString();
          }
        }
      }

      // Update notes if provided
      if (updates.notas !== undefined) {
        entry.notas = updates.notas ? String(updates.notas).trim() : null;
      }

      // Update urgencia if provided
      if (updates.urgencia !== undefined) {
        if (typeof updates.urgencia === 'number' && updates.urgencia >= 1 && updates.urgencia <= 10) {
          entry.urgencia = updates.urgencia;
        } else {
          throw new Error('La urgencia debe ser un número entre 1 y 10');
        }
      }

      entry.fechaActualizado = new Date().toISOString();
      return sanitizeEntry(entry);
    },

    /**
     * Remove caregiver from queue
     * @param {string} entryId - Entry ID
     * @returns {object} - Removed entry
     */
    removeFromQueue(entryId) {
      if (!entryId) {
        throw new Error('El identificador de la entrada es obligatorio');
      }

      const index = queue.findIndex((candidate) => candidate.id === entryId);
      if (index === -1) {
        throw new Error('Entrada en cola no encontrada');
      }

      const [removed] = queue.splice(index, 1);
      return sanitizeEntry(removed);
    },

    /**
     * Get queue statistics
     * @returns {object} - Statistics
     */
    getQueueStats() {
      const stats = {
        total: queue.length,
        waiting: queue.filter((e) => e.estado === 'waiting').length,
        offered: queue.filter((e) => e.estado === 'offered').length,
        accepted: queue.filter((e) => e.estado === 'accepted').length,
        rejected: queue.filter((e) => e.estado === 'rejected').length,
        cancelled: queue.filter((e) => e.estado === 'cancelled').length,
        averageUrgency: queue.length > 0
          ? Math.round((queue.reduce((sum, e) => sum + e.urgencia, 0) / queue.length) * 10) / 10
          : 0,
        urgentCount: queue.filter((e) => e.urgencia >= 7).length,
      };

      return stats;
    },

    /**
     * Get next candidates from queue for circle creation
     * Returns waiting entries sorted by urgency, limited to a maximum
     * @param {number} limit - Maximum number of candidates to return
     * @returns {object[]} - Candidates ready for circle matching
     */
    getNextCandidatesForMatching(limit = 12) {
      const waitingEntries = queue
        .filter((entry) => entry.estado === 'waiting')
        .sort((a, b) => b.urgencia - a.urgencia)
        .slice(0, Math.max(1, limit));

      return waitingEntries.map(sanitizeEntry);
    },

    /**
     * Mark candidates as offered (after generating circles)
     * @param {string[]} entryIds - Array of entry IDs
     * @returns {object[]} - Updated entries
     */
    markAsOffered(entryIds = []) {
      if (!Array.isArray(entryIds) || entryIds.length === 0) {
        throw new Error('Se requiere un array no vacío de IDs');
      }

      const updated = [];
      const now = new Date().toISOString();

      for (const entryId of entryIds) {
        const entry = queue.find((candidate) => candidate.id === entryId);
        if (entry) {
          entry.estado = 'offered';
          entry.fechaOfrecido = now;
          entry.fechaActualizado = now;
          updated.push(sanitizeEntry(entry));
        }
      }

      return updated;
    },

    /**
     * Clear the entire queue (useful for testing)
     * @returns {number} - Number of entries removed
     */
    clearQueue() {
      const count = queue.length;
      queue.length = 0;
      return count;
    },
  };
}

module.exports = { createWaitingQueueService };
