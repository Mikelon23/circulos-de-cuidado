const test = require('node:test');
const assert = require('node:assert/strict');

const { createCircleService } = require('../apps/api/src/circles.cjs');
const { createCircleMemberService } = require('../apps/api/src/circle-members.cjs');
const { createFacilitatorService } = require('../apps/api/src/facilitators.cjs');
const { createSessionService } = require('../apps/api/src/sessions.cjs');
const { createAttendanceService } = require('../apps/api/src/attendance.cjs');
const { createAbandonmentAlertService } = require('../apps/api/src/abandonment-alerts.cjs');

test('createAbandonmentAlertService detecta dos faltas seguidas y notifica al facilitador', () => {
  const circleService = createCircleService();
  const memberService = createCircleMemberService();
  const facilitatorService = createFacilitatorService();
  const sessionService = createSessionService();
  const attendanceService = createAttendanceService({
    getSession: (id) => sessionService.getSession(id),
    now: () => Date.parse('2026-08-05T18:00:00.000Z'),
  });

  const facilitator = facilitatorService.createFacilitator({
    usuarioId: 'facilitador-user-001',
    experienciaYears: 4,
    especialidades: ['bienestar emocional'],
    activo: true,
  });

  const circle = circleService.createCircle({
    nombre: 'Círculo de apoyo emocional',
    tema: 'Bienestar y descanso',
    descripcion: 'Grupo para cuidadores',
    facilitadorId: facilitator.id,
    capacidadMinima: 4,
    capacidadMaxima: 8,
    estado: 'activo',
  });

  memberService.createMember({
    circleId: circle.id,
    usuarioId: 'cuidador-001',
    rol: 'participante',
    estado: 'activo',
  });

  const firstSession = sessionService.createSession({
    circleId: circle.id,
    titulo: 'Primera sesión',
    fechaProgramada: '2026-08-06T18:00:00.000Z',
    duracionMinutos: 60,
    tipo: 'video',
    estado: 'programada',
  });

  const secondSession = sessionService.createSession({
    circleId: circle.id,
    titulo: 'Segunda sesión',
    fechaProgramada: '2026-08-13T18:00:00.000Z',
    duracionMinutos: 60,
    tipo: 'video',
    estado: 'programada',
  });

  const thirdSession = sessionService.createSession({
    circleId: circle.id,
    titulo: 'Tercera sesión',
    fechaProgramada: '2026-08-20T18:00:00.000Z',
    duracionMinutos: 60,
    tipo: 'video',
    estado: 'programada',
  });

  attendanceService.recordJoin(firstSession.id, 'cuidador-001');
  attendanceService.recordLeave(firstSession.id, 'cuidador-001', '2026-08-06T18:30:00.000Z');

  const alertService = createAbandonmentAlertService({
    sessionService,
    attendanceService,
    circleService,
    memberService,
    facilitatorService,
  });

  const alerts = alertService.getAbandonmentAlerts();

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].circleId, circle.id);
  assert.equal(alerts[0].memberId, 'cuidador-001');
  assert.equal(alerts[0].consecutiveMisses, 2);
  assert.deepEqual(alerts[0].sessionIds.sort(), [secondSession.id, thirdSession.id].sort());
  assert.equal(alerts[0].facilitadorUsuarioId, 'facilitador-user-001');
  assert.equal(alerts[0].tipo, 'abandono');
});
