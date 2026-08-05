const test = require('node:test');
const assert = require('node:assert/strict');
const { createFacilitatorService } = require('../apps/api/src/facilitators.cjs');

test('createFacilitatorService implementa CRUD completo para facilitador', () => {
  const service = createFacilitatorService();

  const created = service.createFacilitator({
    usuarioId: 'user-001',
    experienciaYears: 5,
    especialidades: ['apoyo emocional', 'cuidado familiar'],
    certificaciones: ['Acompañamiento grupal'],
    disponibilidad: {
      lunes: ['09:00', '13:00'],
    },
    calificacionPromedio: 4.8,
    activo: true,
  });

  assert.equal(created.usuarioId, 'user-001');
  assert.equal(created.experienciaYears, 5);
  assert.equal(created.calificacionPromedio, 4.8);
  assert.equal(created.activo, true);
  assert.ok(created.id);

  const found = service.getFacilitator(created.id);
  assert.equal(found.id, created.id);
  assert.equal(found.usuarioId, 'user-001');

  const updated = service.updateFacilitator(created.id, {
    experienciaYears: 7,
    activo: false,
    certificaciones: ['Acompañamiento grupal', 'Supervisión de cuidadores'],
  });

  assert.equal(updated.experienciaYears, 7);
  assert.equal(updated.activo, false);
  assert.equal(updated.certificaciones.length, 2);

  const list = service.listFacilitators();
  assert.equal(list.length, 1);

  const deleted = service.deleteFacilitator(created.id);
  assert.equal(deleted.id, created.id);
  assert.equal(service.listFacilitators().length, 0);
});
