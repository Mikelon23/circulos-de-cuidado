const test = require('node:test');
const assert = require('node:assert/strict');
const { createCheckInEmotionalService } = require('../apps/api/src/check-ins.cjs');

test('createCheckInEmotionalService implementa CRUD completo y historial para check-ins emocionales', () => {
  const service = createCheckInEmotionalService();

  const created = service.createCheckIn({
    usuarioId: 'user-001',
    pregunta: '¿Cómo te sientes hoy en términos de energía?',
    escala: 8,
    nota: 'He tenido una jornada estable y acompañada.',
    respondidoEn: '2026-08-02T09:15:00.000Z',
  });

  assert.equal(created.usuarioId, 'user-001');
  assert.equal(created.pregunta, '¿Cómo te sientes hoy en términos de energía?');
  assert.equal(created.escala, 8);
  assert.equal(created.nota, 'He tenido una jornada estable y acompañada.');
  assert.ok(created.id);

  const found = service.getCheckIn(created.id);
  assert.equal(found.id, created.id);
  assert.equal(found.usuarioId, 'user-001');

  const second = service.createCheckIn({
    usuarioId: 'user-001',
    pregunta: '¿Qué necesitas para esta tarde?',
    escala: 6,
    respondidoEn: '2026-08-01T18:30:00.000Z',
  });

  const history = service.listCheckInsByUser('user-001');
  assert.equal(history.length, 2);
  assert.equal(history[0].usuarioId, 'user-001');

  const list = service.listCheckIns();
  assert.equal(list.length, 2);

  const updated = service.updateCheckIn(created.id, {
    escala: 9,
    nota: 'Hoy me siento aún más tranquilo y con apoyo.',
  });

  assert.equal(updated.escala, 9);
  assert.equal(updated.nota, 'Hoy me siento aún más tranquilo y con apoyo.');

  const deleted = service.deleteCheckIn(second.id);
  assert.equal(deleted.id, second.id);
  assert.equal(service.listCheckIns().length, 1);
});
