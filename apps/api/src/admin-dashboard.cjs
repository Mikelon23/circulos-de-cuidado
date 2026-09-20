function createAdminDashboardService({
  circleService,
  memberService,
  facilitatorService,
} = {}) {
  if (!circleService || typeof circleService.listCircles !== 'function') {
    throw new Error('Se requiere un servicio de círculos válido');
  }

  if (!memberService || typeof memberService.listMembers !== 'function') {
    throw new Error('Se requiere un servicio de miembros válido');
  }

  if (!facilitatorService || typeof facilitatorService.listFacilitators !== 'function') {
    throw new Error('Se requiere un servicio de facilitadores válido');
  }

  function getDashboard() {
    const circles = circleService.listCircles();
    const members = memberService.listMembers();
    const facilitators = facilitatorService.listFacilitators();

    const activeCircles = circles.filter((circle) => circle.estado === 'activo');
    const activeFacilitators = facilitators.filter((facilitator) => facilitator.activo !== false);

    const circlesSummary = circles.map((circle) => {
      const circleMembers = members.filter((member) => member.circleId === circle.id);
      const facilitator = facilitators.find(
        (candidate) =>
          candidate.id === circle.facilitadorId || candidate.usuarioId === circle.facilitadorId
      );

      return {
        id: circle.id,
        nombre: circle.nombre,
        tema: circle.tema || 'Sin tema definido',
        estado: circle.estado,
        capacidadMinima: circle.capacidadMinima,
        capacidadMaxima: circle.capacidadMaxima,
        memberCount: circleMembers.length,
        facilitator: facilitator
          ? {
              id: facilitator.id,
              usuarioId: facilitator.usuarioId,
              activo: facilitator.activo,
              experienciaYears: facilitator.experienciaYears,
            }
          : null,
        interventionCount: circleMembers.length,
        members: circleMembers.map((member) => ({ ...member })),
      };
    });

    return {
      stats: {
        activeCircles: activeCircles.length,
        membersCount: members.length,
        facilitatorsCount: activeFacilitators.length,
        interventionsCount: members.length,
      },
      circles: circlesSummary,
    };
  }

  return {
    getDashboard,
  };
}

module.exports = {
  createAdminDashboardService,
};
