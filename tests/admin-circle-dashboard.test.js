const test = require('node:test');
const assert = require('node:assert/strict');

const { createCircleService } = require('../apps/api/src/circles.cjs');
const { createCircleMemberService } = require('../apps/api/src/circle-members.cjs');
const { createFacilitatorService } = require('../apps/api/src/facilitators.cjs');
const { createAdminDashboardService } = require('../apps/api/src/admin-dashboard.cjs');

test('createAdminDashboardService genera un resumen operable para administradores de círculos', () => {
  const circleService = createCircleService();
  const memberService = createCircleMemberService();
  const facilitatorService = createFacilitatorService();
  const dashboardService = createAdminDashboardService({
    circleService,
    memberService,
    facilitatorService,
  });

  const circle = circleService.createCircle({
    nombre: 'Círculo de apoyo emocional',
    tema: 'Estrés y bienestar',
    descripcion: 'Grupo de acompañamiento para cuidadores.',
    facilitadorId: 'facilitador-001',
    capacidadMinima: 4,
    capacidadMaxima: 8,
    estado: 'activo',
  });

  const facilitator = facilitatorService.createFacilitator({
    usuarioId: 'facilitador-001',
    experienciaYears: 3,
    especialidades: ['bienestar emocional'],
    activo: true,
  });

  memberService.createMember({
    circleId: circle.id,
    usuarioId: 'cuidador-001',
    rol: 'participante',
    estado: 'activo',
  });

  memberService.createMember({
    circleId: circle.id,
    usuarioId: 'cuidador-002',
    rol: 'oyente',
    estado: 'invitado',
  });

  const dashboard = dashboardService.getDashboard();

  assert.equal(dashboard.stats.activeCircles, 1);
  assert.equal(dashboard.stats.membersCount, 2);
  assert.equal(dashboard.stats.facilitatorsCount, 1);
  assert.equal(dashboard.stats.interventionsCount, 2);
  assert.equal(dashboard.circles.length, 1);
  assert.equal(dashboard.circles[0].memberCount, 2);
  assert.equal(dashboard.circles[0].facilitator?.id, facilitator.id);
  assert.equal(dashboard.circles[0].interventionCount, 2);
});
