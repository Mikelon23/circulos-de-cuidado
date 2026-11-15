const test = require('node:test');
const assert = require('node:assert/strict');
const { createAttendanceService } = require('../apps/api/src/attendance.cjs');

test('registra asistencia, conexiones repetidas, tiempo conectado y participación', () => {
  let now = Date.parse('2026-08-05T18:00:00.000Z');
  const service = createAttendanceService({
    getSession: (id) => {
      if (id !== 'session-001') throw new Error('Sesión no encontrada');
      return { id };
    },
    now: () => now,
  });

  const firstJoin = service.recordJoin('session-001', 'user-001');
  assert.equal(firstJoin.attended, true);
  assert.equal(firstJoin.connectionCount, 1);
  assert.equal(firstJoin.connectedSeconds, 0);
  assert.equal(service.recordJoin('session-001', 'user-001').connectionCount, 1);

  now += 60_000;
  assert.equal(service.recordParticipation('session-001', 'user-001').participationCount, 1);
  const firstLeave = service.recordLeave('session-001', 'user-001');
  assert.equal(firstLeave.connectedSeconds, 60);
  assert.equal(firstLeave.isConnected, false);

  now += 30_000;
  const secondJoin = service.recordJoin('session-001', 'user-001');
  assert.equal(secondJoin.connectionCount, 2);
  assert.equal(secondJoin.firstJoinedAt, firstJoin.firstJoinedAt);
  now += 90_000;
  const secondLeave = service.recordLeave('session-001', 'user-001');
  assert.equal(secondLeave.connectedSeconds, 150);
  assert.equal(secondLeave.participationCount, 1);
  const sessionAttendance = service.getSessionAttendance('session-001', [
    'user-001',
    'user-absent',
  ]);
  assert.equal(sessionAttendance.length, 2);
  assert.equal(
    sessionAttendance.find((record) => record.userId === 'user-absent').attended,
    false
  );
});

test('rechaza participación desconectada y entradas/salidas con fechas inválidas', () => {
  const service = createAttendanceService({
    getSession: (id) => ({ id }),
    now: () => Date.parse('2026-08-05T18:00:00.000Z'),
  });

  assert.throws(
    () => service.recordParticipation('session-001', 'user-001'),
    /Debes estar conectado/
  );
  assert.throws(
    () => service.recordJoin('session-001', 'user-001', 'fecha-inválida'),
    /La fecha de asistencia no es válida/
  );
  service.recordJoin('session-001', 'user-001');
  assert.throws(
    () => service.recordLeave('session-001', 'user-001', '2026-08-05T17:59:00.000Z'),
    /La salida no puede ser anterior a la entrada/
  );
});
