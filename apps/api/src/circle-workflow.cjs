function normalizeConfig(config = {}) {
  const minSize = Number.isInteger(Number(config.minSize)) ? Number(config.minSize) : 6;
  const maxSize = Number.isInteger(Number(config.maxSize)) ? Number(config.maxSize) : 8;
  const threshold = Number.isFinite(Number(config.threshold)) ? Number(config.threshold) : 60;

  if (minSize < 1 || maxSize < minSize) {
    throw new Error(
      'El tamaño del círculo debe tener un mínimo positivo y un máximo igual o mayor'
    );
  }

  if (threshold < 0 || threshold > 100) {
    throw new Error('El umbral de compatibilidad debe estar entre 0 y 100');
  }

  return {
    minSize,
    maxSize,
    threshold,
    priority: config.priority === 'urgency' ? 'urgency' : 'compatibility',
  };
}

function getUserId(candidate) {
  return String(candidate.usuarioId || candidate.userId || candidate.id || '').trim();
}

function createCircleWorkflowService({
  generateCircles,
  circleService,
  memberService,
  suggestionService,
  waitingQueueService,
}) {
  if (
    typeof generateCircles !== 'function' ||
    !circleService ||
    !memberService ||
    !suggestionService
  ) {
    throw new Error('Se requieren los servicios de matching, círculos, miembros y sugerencias');
  }

  function rollbackCreatedRecords(createdSuggestions, createdMembers, createdCircles) {
    const errors = [];

    for (const suggestion of [...createdSuggestions].reverse()) {
      try {
        suggestionService.deleteSuggestion(suggestion.id);
      } catch (error) {
        errors.push(error.message);
      }
    }

    for (const member of [...createdMembers].reverse()) {
      try {
        memberService.deleteMember(member.id);
      } catch (error) {
        errors.push(error.message);
      }
    }

    for (const circle of [...createdCircles].reverse()) {
      try {
        circleService.deleteCircle(circle.id);
      } catch (error) {
        errors.push(error.message);
      }
    }

    return errors;
  }

  return {
    createCirclesFromMatching(candidates, options = {}) {
      if (!Array.isArray(candidates) || candidates.length === 0) {
        throw new Error('Se requiere una lista de cuidadores candidatos');
      }

      const config = normalizeConfig(options.config);
      const normalizedCandidates = candidates.map((candidate) => {
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
          throw new Error('Cada cuidador candidato debe ser un objeto');
        }

        const usuarioId = getUserId(candidate);
        if (!usuarioId) {
          throw new Error('Cada cuidador candidato debe tener un identificador de usuario');
        }

        return { ...candidate, id: usuarioId };
      });

      const userIds = normalizedCandidates.map((candidate) => candidate.id);
      if (new Set(userIds).size !== userIds.length) {
        throw new Error('No se puede incluir al mismo cuidador más de una vez');
      }

      const match = generateCircles(normalizedCandidates, config);
      const circleOptions =
        options.circle && typeof options.circle === 'object' ? options.circle : {};
      const createdCircles = [];
      const createdMembers = [];
      const createdSuggestions = [];
      const persistedCircles = [];

      try {
        for (const [index, matchedCircle] of match.circles.entries()) {
          const circle = circleService.createCircle({
            nombre: circleOptions.nombre
              ? `${String(circleOptions.nombre).trim()} ${index + 1}`
              : `Círculo de cuidado ${index + 1}`,
            tema: circleOptions.tema || 'Apoyo entre cuidadores',
            descripcion:
              circleOptions.descripcion ||
              `Círculo generado por matching con ${matchedCircle.averageCompatibility}% de compatibilidad media.`,
            facilitadorId: circleOptions.facilitadorId || null,
            capacidadMinima: config.minSize,
            capacidadMaxima: config.maxSize,
          });
          createdCircles.push(circle);

          const members = [];
          const invitations = [];
          for (const candidate of matchedCircle.members) {
            const member = memberService.createMember({
              circleId: circle.id,
              usuarioId: candidate.id,
              rol: 'participante',
              estado: 'invitado',
            });
            createdMembers.push(member);
            members.push(member);

            const queueEntryId = options.queueEntryIds?.[candidate.id];
            const invitation = suggestionService.generateForCaregiver(candidate.id, circle, {
              score: matchedCircle.averageCompatibility,
              tipo: 'circle_offer',
              estado: 'sent',
              mensaje: `Te invitamos a unirte a "${circle.nombre}". Revisa la invitación y confirma si te interesa.`,
              metadata: {
                memberId: member.id,
                generatedFrom: 'matching/create-circles',
                ...(queueEntryId ? { queueEntryId } : {}),
              },
            });
            createdSuggestions.push(invitation);
            invitations.push(invitation);
          }

          persistedCircles.push({
            ...circle,
            members,
            invitations,
            averageCompatibility: matchedCircle.averageCompatibility,
          });
        }
      } catch (error) {
        const rollbackErrors = rollbackCreatedRecords(
          createdSuggestions,
          createdMembers,
          createdCircles
        );
        if (rollbackErrors.length) {
          throw new Error(
            `${error.message}. No se pudo revertir completamente la creación: ${rollbackErrors.join('; ')}`,
            { cause: error }
          );
        }
        throw error;
      }

      return {
        circles: persistedCircles,
        waitlist: match.waitlist,
        metrics: match.metrics,
      };
    },

    listInvitationsForCaregiver(cuidadorId) {
      const invitations = suggestionService.listSuggestions({
        cuidadorId,
        tipo: 'circle_offer',
      });

      return invitations.map((invitation) => {
        const memberId = invitation.metadata.memberId;
        const member = memberId ? memberService.getMember(memberId) : null;
        const circle = member ? circleService.getCircle(member.circleId) : null;
        const invitationDetails = { ...invitation };
        delete invitationDetails.score;
        return { ...invitationDetails, member, circle };
      });
    },

    respondToInvitation(memberId, cuidadorId, response) {
      const normalizedResponse = String(response || '')
        .trim()
        .toLowerCase();
      if (normalizedResponse !== 'accepted' && normalizedResponse !== 'rejected') {
        throw new Error('La respuesta debe ser accepted o rejected');
      }

      const member = memberService.getMember(memberId);
      if (member.usuarioId !== cuidadorId) {
        throw new Error('La invitación no pertenece a este usuario');
      }
      if (member.estado !== 'invitado') {
        throw new Error('La invitación ya fue respondida');
      }

      const invitation = suggestionService
        .listSuggestions({ cuidadorId, tipo: 'circle_offer' })
        .find((candidate) => candidate.metadata.memberId === memberId);
      if (!invitation || !['sent', 'read'].includes(invitation.estado)) {
        throw new Error('No se encontró una invitación pendiente para este miembro');
      }

      const now = new Date().toISOString();
      const nextState = normalizedResponse === 'accepted' ? 'activo' : 'salido';
      const queueState = normalizedResponse === 'accepted' ? 'accepted' : 'rejected';
      const updatedMember = memberService.updateMember(memberId, {
        estado: nextState,
        fechaIngreso: normalizedResponse === 'accepted' ? now : null,
        fechaSalida: normalizedResponse === 'rejected' ? now : null,
      });
      let updatedInvitation;

      try {
        updatedInvitation = suggestionService.updateSuggestion(invitation.id, {
          estado: normalizedResponse === 'accepted' ? 'accepted' : 'dismissed',
        });

        const queueEntryId = invitation.metadata.queueEntryId;
        if (queueEntryId && waitingQueueService) {
          waitingQueueService.updateQueueEntry(queueEntryId, { estado: queueState });
        }
      } catch (error) {
        const rollbackErrors = [];
        try {
          memberService.updateMember(memberId, {
            estado: member.estado,
            fechaIngreso: member.fechaIngreso,
            fechaSalida: member.fechaSalida,
          });
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError.message);
        }
        try {
          suggestionService.updateSuggestion(invitation.id, { estado: invitation.estado });
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError.message);
        }
        if (rollbackErrors.length) {
          throw new Error(
            `${error.message}. No se pudo revertir completamente la respuesta: ${rollbackErrors.join('; ')}`,
            { cause: error }
          );
        }
        throw error;
      }

      const invitationDetails = { ...updatedInvitation };
      delete invitationDetails.score;
      return {
        member: updatedMember,
        invitation: invitationDetails,
        circle: circleService.getCircle(member.circleId),
      };
    },
  };
}

module.exports = {
  createCircleWorkflowService,
};
