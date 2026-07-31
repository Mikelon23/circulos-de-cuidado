const test = require('node:test');
const assert = require('node:assert/strict');
const { createCaregiverProfileService } = require('../apps/api/src/caregiver-profiles.cjs');

test('createCaregiverProfileService implementa CRUD completo para perfil de cuidador', () => {
  const service = createCaregiverProfileService();

  const created = service.createProfile({
    usuarioId: 'user-001',
    edad: 72,
    enfermedadPrincipal: 'Diabetes',
    faseCuidado: 'inicial',
    disponibilidadHoraria: {
      lunes: ['09:00', '13:00'],
    },
    idioma: 'es',
    ubicacion: 'Bogotá',
    urgencia: 5,
    notas: 'Necesita apoyo de acompañamiento en tardes.',
  });

  assert.equal(created.usuarioId, 'user-001');
  assert.equal(created.edad, 72);
  assert.equal(created.faseCuidado, 'inicial');
  assert.ok(created.id);

  const found = service.getProfile(created.id);
  assert.equal(found.id, created.id);
  assert.equal(found.ubicacion, 'Bogotá');

  const updated = service.updateProfile(created.id, {
    urgencia: 8,
    notas: 'Necesita apoyo de acompañamiento en tardes y fines de semana.',
  });

  assert.equal(updated.urgencia, 8);
  assert.equal(updated.notas, 'Necesita apoyo de acompañamiento en tardes y fines de semana.');

  const list = service.listProfiles();
  assert.equal(list.length, 1);

  const deleted = service.deleteProfile(created.id);
  assert.equal(deleted.id, created.id);
  assert.equal(service.listProfiles().length, 0);
});
