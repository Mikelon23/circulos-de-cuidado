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
    reminderMinutes: 60,
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
  assert.equal(created.reminderMinutes, 60);
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

test('createSessionService valida la fecha y el intervalo del recordatorio', () => {
  const service = createSessionService();
  const basePayload = {
    circleId: 'circle-001',
    titulo: 'Sesión de apoyo',
    fechaProgramada: '2026-08-05T18:00:00.000Z',
    duracionMinutos: 60,
  };

  assert.throws(
    () => service.createSession({ ...basePayload, fechaProgramada: 'fecha-inválida' }),
    /La fecha programada no es válida/
  );
  assert.throws(
    () => service.createSession({ ...basePayload, reminderMinutes: 30 }),
    /El recordatorio debe configurarse/
  );

  const created = service.createSession({ ...basePayload, reminderMinutes: 0 });
  assert.equal(created.reminderMinutes, 0);
});

test('createSessionService admite historial con notas, temas y grabación', () => {
  const service = createSessionService();

  const created = service.createSession({
    circleId: 'circle-archive',
    titulo: 'Sesión de cierre',
    fechaProgramada: '2026-08-10T19:00:00.000Z',
    duracionMinutos: 75,
    notas: 'Se revisaron las rutinas y los próximos pasos.',
    temasTratados: ['duelo', 'rutina', 'apoyo emocional'],
    grabacionConsent: true,
    grabacionUrl: 'https://example.com/session-recording.mp4',
  });

  assert.deepEqual(created.temasTratados, ['duelo', 'rutina', 'apoyo emocional']);
  assert.equal(created.grabacionConsent, true);
  assert.equal(created.grabacionUrl, 'https://example.com/session-recording.mp4');
  assert.equal(created.historial.grabacionConsent, true);
  assert.deepEqual(service.getCircleHistory('circle-archive').length, 1);

  const updated = service.updateSession(created.id, {
    notas: 'Se añadió el resumen final.',
    historial: {
      temasTratados: ['apoyo emocional', 'sostén'],
      grabacionConsent: true,
      grabacionUrl: 'https://example.com/session-recording-v2.mp4',
    },
  });

  assert.equal(updated.notas, 'Se añadió el resumen final.');
  assert.deepEqual(updated.temasTratados, ['apoyo emocional', 'sostén']);
  assert.equal(updated.grabacionUrl, 'https://example.com/session-recording-v2.mp4');
});
