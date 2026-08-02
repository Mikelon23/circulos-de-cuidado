const test = require('node:test');
const assert = require('node:assert/strict');
const { createSessionService } = require('../apps/api/src/sessions.cjs');

test('createSessionService implementa CRUD completo para sesiones', () => {
  const service = createSessionService();

  const created = service.createSession({
    circleId: 'circle-001',
    facilitadorId: 'facilitador-001',
    titulo: 'Sesión de apoyo para cuidadores',
    fechaProgramada: '2026-08-05T18:00:00.000Z',
    duracionMinutos: 60,
    tipo: 'video',
    estado: 'programada',
    enlaceReunion: 'https://meet.example.com/session-001',
    notas: 'Revisión de rutinas y apoyo emocional.',
  });

  assert.equal(created.circleId, 'circle-001');
  assert.equal(created.facilitadorId, 'facilitador-001');
  assert.equal(created.titulo, 'Sesión de apoyo para cuidadores');
  assert.equal(created.tipo, 'video');
  assert.equal(created.estado, 'programada');
  assert.ok(created.id);

  const found = service.getSession(created.id);
  assert.equal(found.id, created.id);
  assert.equal(found.circleId, 'circle-001');

  const updated = service.updateSession(created.id, {
    titulo: 'Sesión de seguimiento',
    estado: 'en_curso',
    duracionMinutos: 90,
    notas: 'Se ajustó la duración por dinámica del grupo.',
  });

  assert.equal(updated.titulo, 'Sesión de seguimiento');
  assert.equal(updated.estado, 'en_curso');
  assert.equal(updated.duracionMinutos, 90);
  assert.equal(updated.notas, 'Se ajustó la duración por dinámica del grupo.');

  const list = service.listSessions();
  assert.equal(list.length, 1);

  const deleted = service.deleteSession(created.id);
  assert.equal(deleted.id, created.id);
  assert.equal(service.listSessions().length, 0);
});
