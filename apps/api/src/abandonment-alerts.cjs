function createAbandonmentAlertService({
  sessionService,
  attendanceService,
  circleService,
  memberService,
  facilitatorService,
} = {}) {
  if (!sessionService || typeof sessionService.listSessions !== 'function') {
    throw new Error('Se requiere un servicio de sesiones válido');
  }

  if (!attendanceService || typeof attendanceService.getSessionAttendance !== 'function') {
    throw new Error('Se requiere un servicio de asistencia válido');
  }

  if (!circleService || typeof circleService.listCircles !== 'function') {
    throw new Error('Se requiere un servicio de círculos válido');
  }

  if (!memberService || typeof memberService.listMembers !== 'function') {
    throw new Error('Se requiere un servicio de miembros válido');
  }

  if (!facilitatorService || typeof facilitatorService.listFacilitators !== 'function') {
    throw new Error('Se requiere un servicio de facilitadores válido');
  }

  function getAbandonmentAlerts() {
    const circles = circleService.listCircles();
    const members = memberService.listMembers().filter((member) => member.estado === 'activo');
    const facilitators = facilitatorService.listFacilitators();
    const sessionsByCircle = new Map();

    for (const session of sessionService.listSessions()) {
      if (session.estado === 'cancelada') {
        continue;
      }

      if (!sessionsByCircle.has(session.circleId)) {
        sessionsByCircle.set(session.circleId, []);
      }

      sessionsByCircle.get(session.circleId).push(session);
    }

    const alerts = [];

    for (const circle of circles) {
      const circleSessions = (sessionsByCircle.get(circle.id) || []).sort(
        (left, right) => new Date(left.fechaProgramada) - new Date(right.fechaProgramada)
      );
      const facilitator = facilitators.find(
        (candidate) =>
          candidate.id === circle.facilitadorId || candidate.usuarioId === circle.facilitadorId
      );

      for (const member of members.filter((candidate) => candidate.circleId === circle.id)) {
        let consecutiveMisses = 0;
        let missedSessionIds = [];

        for (const session of circleSessions) {
          const attendance = attendanceService.getSessionAttendance(session.id, [member.usuarioId]);
          const record = attendance.find((entry) => entry.userId === member.usuarioId) || {
            attended: false,
            userId: member.usuarioId,
          };

          if (record.attended) {
            consecutiveMisses = 0;
            missedSessionIds = [];
            continue;
          }

          consecutiveMisses += 1;
          missedSessionIds.push(session.id);

          if (consecutiveMisses >= 2) {
            alerts.push({
              id: `abandono-${circle.id}-${member.usuarioId}-${session.id}`,
              tipo: 'abandono',
              categoria: 'abandono',
              circleId: circle.id,
              circleName: circle.nombre,
              memberId: member.usuarioId,
              sessionIds: [...missedSessionIds],
              consecutiveMisses,
              últimaSesión: session.fechaProgramada,
              facilitadorId: facilitator?.id || null,
              facilitadorUsuarioId: facilitator?.usuarioId || null,
              estado: 'pendiente',
              createdAt: new Date().toISOString(),
              mensaje: `El cuidador ${member.usuarioId} ha faltado a dos sesiones consecutivas en ${circle.nombre}.`,
            });
            break;
          }
        }
      }
    }

    return alerts.sort(
      (left, right) => new Date(right.últimaSesión) - new Date(left.últimaSesión)
    );
  }

  return {
    getAbandonmentAlerts,
  };
}

module.exports = {
  createAbandonmentAlertService,
};
