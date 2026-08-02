const crypto = require('node:crypto');

const VALID_ROLES = new Set(['participante', 'oyente', 'admin']);
const VALID_STATES = new Set(['activo', 'invitado', 'salido']);

function normalizeRole(role) {
  if (typeof role !== 'string') {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  return VALID_ROLES.has(normalized) ? normalized : null;
}

function normalizeState(state) {
  if (typeof state !== 'string') {
    return null;
  }

  const normalized = state.trim().toLowerCase();
  return VALID_STATES.has(normalized) ? normalized : null;
}

function sanitizeMember(member) {
  return {
    ...member,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

function createCircleMemberService() {
  const members = [];

  return {
    createMember(payload = {}) {
      const circleId = String(payload.circleId || '').trim();
      const usuarioId = String(payload.usuarioId || '').trim();
      const rol = normalizeRole(payload.rol);
      const estado = normalizeState(payload.estado);
      const fechaIngreso = payload.fechaIngreso ? String(payload.fechaIngreso) : null;
      const fechaSalida = payload.fechaSalida ? String(payload.fechaSalida) : null;

      if (!circleId) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      if (!usuarioId) {
        throw new Error('El identificador del usuario es obligatorio');
      }

      if (rol === null && payload.rol !== undefined) {
        throw new Error('El rol del miembro no es válido');
      }

      if (estado === null && payload.estado !== undefined) {
        throw new Error('El estado del miembro no es válido');
      }

      const now = new Date().toISOString();
      const member = {
        id: crypto.randomUUID(),
        circleId,
        usuarioId,
        rol: rol || 'participante',
        estado: estado || 'activo',
        fechaIngreso,
        fechaSalida,
        createdAt: now,
        updatedAt: now,
      };

      members.push(member);
      return sanitizeMember(member);
    },

    getMember(memberId) {
      if (!memberId) {
        throw new Error('El identificador del miembro es obligatorio');
      }

      const member = members.find((candidate) => candidate.id === memberId);
      if (!member) {
        throw new Error('Miembro no encontrado');
      }

      return sanitizeMember(member);
    },

    listMembers() {
      return members.map((member) => sanitizeMember(member));
    },

    updateMember(memberId, updates = {}) {
      if (!memberId) {
        throw new Error('El identificador del miembro es obligatorio');
      }

      const member = members.find((candidate) => candidate.id === memberId);
      if (!member) {
        throw new Error('Miembro no encontrado');
      }

      const next = {
        ...member,
        circleId:
          updates.circleId === undefined
            ? member.circleId
            : String(updates.circleId || '').trim(),
        usuarioId:
          updates.usuarioId === undefined
            ? member.usuarioId
            : String(updates.usuarioId || '').trim(),
        rol:
          updates.rol === undefined
            ? member.rol
            : normalizeRole(updates.rol),
        estado:
          updates.estado === undefined
            ? member.estado
            : normalizeState(updates.estado),
        fechaIngreso:
          updates.fechaIngreso === undefined
            ? member.fechaIngreso
            : updates.fechaIngreso
              ? String(updates.fechaIngreso)
              : null,
        fechaSalida:
          updates.fechaSalida === undefined
            ? member.fechaSalida
            : updates.fechaSalida
              ? String(updates.fechaSalida)
              : null,
      };

      if (!next.circleId) {
        throw new Error('El identificador del círculo es obligatorio');
      }

      if (!next.usuarioId) {
        throw new Error('El identificador del usuario es obligatorio');
      }

      if (next.rol === null && updates.rol !== undefined) {
        throw new Error('El rol del miembro no es válido');
      }

      if (next.estado === null && updates.estado !== undefined) {
        throw new Error('El estado del miembro no es válido');
      }

      const updated = {
        ...next,
        updatedAt: new Date().toISOString(),
      };

      const index = members.findIndex((candidate) => candidate.id === memberId);
      members[index] = updated;

      return sanitizeMember(updated);
    },

    deleteMember(memberId) {
      if (!memberId) {
        throw new Error('El identificador del miembro es obligatorio');
      }

      const index = members.findIndex((candidate) => candidate.id === memberId);
      if (index === -1) {
        throw new Error('Miembro no encontrado');
      }

      const [deleted] = members.splice(index, 1);
      return sanitizeMember(deleted);
    },
  };
}

module.exports = {
  createCircleMemberService,
};
