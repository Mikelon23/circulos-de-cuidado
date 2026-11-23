function createRiskAlertService({
  checkInService,
  circleService,
  memberService,
  facilitatorService,
} = {}) {
  if (!checkInService || typeof checkInService.listCheckInsByUser !== 'function') {
    throw new Error('Se requiere un servicio de check-ins válido');
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

  const alertsBySequence = new Map();
  const suggestions = [
    'Contactar al cuidador y ofrecer una conversación breve de acompañamiento.',
    'Revisar si necesita apoyo práctico, profesional o una adaptación de su participación.',
    'Invitarlo a priorizar descanso y actividades de cuidado personal sin juzgar su respuesta.',
  ];

  function resolveMemberAlerts(usuarioId) {
    for (const alert of alertsBySequence.values()) {
      if (alert.memberId === String(usuarioId) && alert.estado === 'pendiente') {
        alert.estado = 'resuelto';
      }
    }
  }

  function evaluateUser(usuarioId) {
    const member = memberService.listMembers().find(
      (candidate) => candidate.usuarioId === String(usuarioId) && candidate.estado === 'activo'
    );
    const history = checkInService.listCheckInsByUser(usuarioId);

    if (!member || history.length < 3) {
      resolveMemberAlerts(usuarioId);
      return null;
    }

    const latestThree = history.slice(0, 3);
    if (!latestThree.every((checkIn) => Number(checkIn.escala) < 4)) {
      resolveMemberAlerts(usuarioId);
      return null;
    }

    const sequenceKey = latestThree.map((checkIn) => checkIn.id).join(':');
    if (alertsBySequence.has(sequenceKey)) {
      const existing = alertsBySequence.get(sequenceKey);
      existing.estado = 'pendiente';
      return existing;
    }

    const circle = circleService.listCircles().find((candidate) => candidate.id === member.circleId);
    if (!circle) {
      return null;
    }

    const facilitator = facilitatorService.listFacilitators().find(
      (candidate) =>
        candidate.id === circle.facilitadorId || candidate.usuarioId === circle.facilitadorId
    );

    const alert = {
      id: `riesgo-${member.usuarioId}-${sequenceKey}`,
      tipo: 'riesgo-emocional',
      categoria: 'riesgo',
      circleId: circle.id,
      circleName: circle.nombre,
      memberId: member.usuarioId,
      checkInIds: latestThree.map((checkIn) => checkIn.id),
      escalas: latestThree.map((checkIn) => Number(checkIn.escala)),
      consecutiveLowCheckIns: 3,
      facilitadorId: facilitator?.id || null,
      facilitadorUsuarioId: facilitator?.usuarioId || null,
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
      mensaje: `El cuidador ${member.usuarioId} registró tres check-ins consecutivos por debajo de 4 en ${circle.nombre}.`,
      sugerencias: [...suggestions],
    };

    alertsBySequence.set(sequenceKey, alert);
    return alert;
  }

  function evaluateCheckIn(checkIn) {
    return checkIn?.usuarioId ? evaluateUser(checkIn.usuarioId) : null;
  }

  function getRiskAlerts() {
    return [...alertsBySequence.values()]
      .filter((alert) => alert.estado === 'pendiente')
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }

  return {
    evaluateUser,
    evaluateCheckIn,
    getRiskAlerts,
  };
}

const createRiskPatternService = createRiskAlertService;

module.exports = {
  createRiskAlertService,
  createRiskPatternService,
};
