const test = require('node:test');
const assert = require('node:assert/strict');

const { createCheckInEmotionalService } = require('../apps/api/src/check-ins.cjs');
const { createSessionService } = require('../apps/api/src/sessions.cjs');
const { createAttendanceService } = require('../apps/api/src/attendance.cjs');
const { createCircleMemberService } = require('../apps/api/src/circle-members.cjs');
const { createWellbeingDashboardService } = require('../apps/api/src/wellbeing-dashboard.cjs');

test('resume tendencia emocional, sesiones asistidas y conexiones formadas', () => {
  const checkInService = createCheckInEmotionalService();
  const sessionService = createSessionService();
  const memberService = createCircleMemberService();
  const attendanceService = createAttendanceService({
    getSession: (id) => sessionService.getSession(id),
  });

  checkInService.createCheckIn({
    usuarioId: 'cuidador-1',
    pregunta: '¿Cómo te sientes hoy?',
    escala: 4,
    respondidoEn: '2026-08-01T09:00:00.000Z',
  });
  checkInService.createCheckIn({
    usuarioId: 'cuidador-1',
    pregunta: '¿Cómo te sientes hoy?',
    escala: 8,
    respondidoEn: '2026-08-02T09:00:00.000Z',
  });

  memberService.createMember({
    circleId: 'circle-1',
    usuarioId: 'cuidador-1',
    estado: 'activo',
  });
  memberService.createMember({
    circleId: 'circle-1',
    usuarioId: 'cuidador-2',
    estado: 'activo',
  });
  memberService.createMember({
    circleId: 'circle-1',
    usuarioId: 'cuidador-3',
    estado: 'salido',
  });

  const session = sessionService.createSession({
    circleId: 'circle-1',
    titulo: 'Sesión de acompañamiento',
    fechaProgramada: '2026-08-03T18:00:00.000Z',
    duracionMinutos: 60,
  });
  attendanceService.recordJoin(session.id, 'cuidador-1');

  const dashboardService = createWellbeingDashboardService({
    checkInService,
    sessionService,
    attendanceService,
    memberService,
  });

  const dashboard = dashboardService.getDashboard('cuidador-1', {
    period: 'all',
  });

  assert.equal(dashboard.emotionalTrend.average, 6);
  assert.equal(dashboard.emotionalTrend.direction, 'up');
  assert.equal(dashboard.attendedSessions.total, 1);
  assert.equal(dashboard.attendedSessions.latest.id, session.id);
  assert.equal(dashboard.connections.total, 1);
  assert.equal(dashboard.connections.circles, 1);
});

test('devuelve estado estable y valores vacíos para un usuario sin actividad', () => {
  const dashboardService = createWellbeingDashboardService({
    checkInService: createCheckInEmotionalService(),
    sessionService: createSessionService(),
    attendanceService: createAttendanceService({
      getSession: (id) => ({ id }),
    }),
    memberService: createCircleMemberService(),
  });

  const dashboard = dashboardService.getDashboard('cuidador-nuevo');

  assert.equal(dashboard.emotionalTrend.average, null);
  assert.equal(dashboard.emotionalTrend.direction, 'stable');
  assert.equal(dashboard.attendedSessions.total, 0);
  assert.equal(dashboard.connections.total, 0);
});

test('identifica tendencia descendente con promedios separados', () => {
  const checkInService = createCheckInEmotionalService();
  checkInService.createCheckIn({
    usuarioId: 'cuidador-1',
    pregunta: '¿Cómo te sientes hoy?',
    escala: 9,
  });
  checkInService.createCheckIn({
    usuarioId: 'cuidador-1',
    pregunta: '¿Cómo te sientes hoy?',
    escala: 8,
  });
  checkInService.createCheckIn({
    usuarioId: 'cuidador-1',
    pregunta: '¿Cómo te sientes hoy?',
    escala: 3,
  });
  checkInService.createCheckIn({
    usuarioId: 'cuidador-1',
    pregunta: '¿Cómo te sientes hoy?',
    escala: 2,
  });

  const dashboardService = createWellbeingDashboardService({
    checkInService,
    sessionService: createSessionService(),
    attendanceService: createAttendanceService({
      getSession: (id) => ({ id }),
    }),
    memberService: createCircleMemberService(),
  });

  assert.equal(
    dashboardService.getDashboard('cuidador-1', { period: 'all' }).emotionalTrend.direction,
    'down'
  );
});
