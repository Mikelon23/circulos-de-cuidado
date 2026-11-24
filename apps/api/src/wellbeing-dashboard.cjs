function average(values) {
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function createWellbeingDashboardService({
  checkInService,
  sessionService,
  attendanceService,
  memberService,
} = {}) {
  if (!checkInService || typeof checkInService.listCheckInsByUser !== 'function') {
    throw new Error('Se requiere un servicio de check-ins válido');
  }
  if (!sessionService || typeof sessionService.listSessions !== 'function') {
    throw new Error('Se requiere un servicio de sesiones válido');
  }
  if (!attendanceService || typeof attendanceService.getUserAttendance !== 'function') {
    throw new Error('Se requiere un servicio de asistencia válido');
  }
  if (!memberService || typeof memberService.listMembers !== 'function') {
    throw new Error('Se requiere un servicio de miembros válido');
  }

  function getDashboard(userId, options = {}) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) {
      throw new Error('El identificador del usuario es obligatorio');
    }

    const period = options.period || 'month';
    const checkIns = checkInService
      .listCheckInsByUser(normalizedUserId, {
        period,
        now: options.now,
      })
      .map((checkIn) => ({
        ...checkIn,
        escala: Number(checkIn.escala),
      }))
      .filter((checkIn) => Number.isFinite(checkIn.escala))
      .sort((a, b) => new Date(a.respondidoEn) - new Date(b.respondidoEn));

    const scores = checkIns.map((checkIn) => checkIn.escala);
    const overallAverage = average(scores);
    const midpoint = Math.floor(checkIns.length / 2);
    const previousAverage = average(scores.slice(0, midpoint));
    const recentAverage = average(scores.slice(midpoint));
    const change =
      previousAverage === null || recentAverage === null
        ? 0
        : Number((recentAverage - previousAverage).toFixed(1));
    const direction = change > 0.25 ? 'up' : change < -0.25 ? 'down' : 'stable';

    const activeMemberships = memberService
      .listMembers()
      .filter(
        (member) =>
          member.usuarioId === normalizedUserId && member.estado === 'activo'
      );
    const circleIds = new Set(activeMemberships.map((member) => member.circleId));

    const attendedSessions = sessionService
      .listSessions()
      .filter((session) => circleIds.has(session.circleId))
      .map((session) => ({
        session,
        attendance: attendanceService.getUserAttendance(session.id, normalizedUserId),
      }))
      .filter(({ attendance }) => attendance?.attended)
      .sort((a, b) => new Date(b.session.fechaProgramada) - new Date(a.session.fechaProgramada));

    const connections = new Set(
      memberService
        .listMembers()
        .filter(
          (member) =>
            circleIds.has(member.circleId) &&
            member.estado === 'activo' &&
            member.usuarioId !== normalizedUserId
        )
        .map((member) => member.usuarioId)
    );

    const emotionalTrend = {
      average: overallAverage === null ? null : Number(overallAverage.toFixed(1)),
      direction,
      change,
      count: checkIns.length,
      currentAverage:
        recentAverage === null ? null : Number(recentAverage.toFixed(1)),
      previousAverage:
        previousAverage === null ? null : Number(previousAverage.toFixed(1)),
    };
    const attended = {
      total: attendedSessions.length,
      latest: attendedSessions[0]?.session || null,
      sessions: attendedSessions.map(({ session, attendance }) => ({
        ...session,
        attendance,
      })),
    };
    const connectionSummary = {
      total: connections.size,
      circles: circleIds.size,
    };

    return {
      emotionalTrend,
      attendedSessions: attended,
      connections: connectionSummary,
      stats: {
        emotionalAverage: emotionalTrend.average,
        emotionalDirection: emotionalTrend.direction,
        attendedSessions: attended.total,
        connectionsFormed: connectionSummary.total,
        activeCircles: circleIds.size,
      },
    };
  }

  return {
    getDashboard,
  };
}

module.exports = {
  createWellbeingDashboardService,
};
