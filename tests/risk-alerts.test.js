const test = require('node:test');
const assert = require('node:assert/strict');

const { createCheckInEmotionalService } = require('../apps/api/src/check-ins.cjs');
const { createCircleService } = require('../apps/api/src/circles.cjs');
const { createCircleMemberService } = require('../apps/api/src/circle-members.cjs');
const { createFacilitatorService } = require('../apps/api/src/facilitators.cjs');
const { createRiskAlertService } = require('../apps/api/src/risk-alerts.cjs');

function setupServices() {
  const checkInService = createCheckInEmotionalService();
  const circleService = createCircleService();
  const memberService = createCircleMemberService();
  const facilitatorService = createFacilitatorService();

  const facilitator = facilitatorService.createFacilitator({
    usuarioId: 'facilitador-riesgo',
    experienciaYears: 5,
    especialidades: ['bienestar emocional'],
    activo: true,
  });
  const circle = circleService.createCircle({
    nombre: 'Círculo de cuidado',
    tema: 'Bienestar',
    facilitadorId: facilitator.id,
    capacidadMinima: 2,
    capacidadMaxima: 8,
    estado: 'activo',
  });
  memberService.createMember({
    circleId: circle.id,
    usuarioId: 'cuidador-riesgo',
    estado: 'activo',
  });

  const riskService = createRiskAlertService({
    checkInService,
    circleService,
    memberService,
    facilitatorService,
  });

  return { checkInService, circle, facilitator, riskService };
}

test('detecta tres check-ins bajos consecutivos y notifica al facilitador', () => {
  const { checkInService, circle, facilitator, riskService } = setupServices();

  const checkIns = [3, 2, 1].map((escala, index) =>
    checkInService.createCheckIn({
      usuarioId: 'cuidador-riesgo',
      pregunta: '¿Cómo te sientes hoy?',
      escala,
      respondidoEn: `2026-11-${20 + index}T12:00:00.000Z`,
    })
  );

  const alert = riskService.evaluateCheckIn(checkIns[0]);

  assert.ok(alert);
  assert.equal(alert.circleId, circle.id);
  assert.equal(alert.memberId, 'cuidador-riesgo');
  assert.equal(alert.facilitadorUsuarioId, facilitator.usuarioId);
  assert.equal(alert.consecutiveLowCheckIns, 3);
  assert.equal(alert.checkInIds.length, 3);
  assert.equal(alert.estado, 'pendiente');
  assert.equal(riskService.getRiskAlerts().length, 1);
  assert.equal(riskService.evaluateCheckIn(checkIns[0])?.id, alert.id);
});

test('un check-in alto reinicia el patrón y resuelve la alerta', () => {
  const { checkInService, riskService } = setupServices();

  [3, 2, 1].forEach((escala, index) =>
    checkInService.createCheckIn({
      usuarioId: 'cuidador-riesgo',
      pregunta: '¿Cómo te sientes hoy?',
      escala,
      respondidoEn: `2026-11-${20 + index}T12:00:00.000Z`,
    })
  );
  riskService.evaluateUser('cuidador-riesgo');

  const highCheckIn = checkInService.createCheckIn({
    usuarioId: 'cuidador-riesgo',
    pregunta: '¿Cómo te sientes hoy?',
    escala: 8,
    respondidoEn: '2026-11-23T12:00:00.000Z',
  });

  assert.equal(riskService.evaluateCheckIn(highCheckIn), null);
  assert.equal(riskService.getRiskAlerts().length, 0);
});
