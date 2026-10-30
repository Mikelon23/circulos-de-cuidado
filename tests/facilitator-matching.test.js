const test = require('node:test');
const assert = require('node:assert/strict');

const { createFacilitatorService, calculateFacilitatorCircleScore } = require('../apps/api/src/facilitators.cjs');

test('calculateFacilitatorCircleScore pondera especialidades, disponibilidad y experiencia', () => {
  const score = calculateFacilitatorCircleScore(
    {
      especialidades: ['apoyo emocional', 'cuidado familiar'],
      disponibilidad: { lunes: ['09:00-12:00'], martes: ['18:00-21:00'] },
      calificacionPromedio: 4.8,
      experienciaYears: 6,
    },
    {
      especialidades: ['apoyo emocional', 'cuidado familiar', 'salud mental'],
      disponibilidad: { lunes: ['09:00-12:00'], viernes: ['18:00-20:00'] },
      miembros: [
        { disponibilidad: { lunes: ['09:00-12:00'] } },
      ],
    },
    [{ disponibilidad: { lunes: ['09:00-12:00'] } }]
  );

  assert.ok(score.score >= 0.7);
  assert.ok(score.breakdown.especialidades >= 0.5);
  assert.ok(score.breakdown.experiencia >= 0.9);
});

test('matchFacilitatorForCircle selecciona el facilitador más compatible por umbral', () => {
  const service = createFacilitatorService();
  service.createFacilitator({
    usuarioId: 'facilitador-1',
    experienciaYears: 2,
    especialidades: ['apoyo emocional'],
    disponibilidad: { lunes: ['09:00-12:00'] },
    calificacionPromedio: 3.9,
    activo: true,
  });
  service.createFacilitator({
    usuarioId: 'facilitador-2',
    experienciaYears: 8,
    especialidades: ['apoyo emocional', 'salud mental', 'cuidado familiar'],
    disponibilidad: { lunes: ['09:00-12:00'], martes: ['18:00-21:00'] },
    calificacionPromedio: 4.9,
    activo: true,
  });

  const match = service.matchFacilitatorForCircle(
    {
      especialidades: ['apoyo emocional', 'cuidado familiar'],
      disponibilidad: { lunes: ['09:00-12:00'] },
      miembros: [{ disponibilidad: { lunes: ['09:00-12:00'] } }],
    },
    service.listFacilitators()
  );

  assert.equal(match.facilitator.usuarioId, 'facilitador-2');
  assert.ok(match.score >= 0.6);
  assert.equal(match.match, true);
});
