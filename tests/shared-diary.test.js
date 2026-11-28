const test = require('node:test');
const assert = require('node:assert/strict');

const { createCircleService } = require('../apps/api/src/circles.cjs');
const { createCircleMemberService } = require('../apps/api/src/circle-members.cjs');
const { createSharedDiaryService } = require('../apps/api/src/shared-diary.cjs');

test('los miembros activos escriben entradas y reciben respuestas de apoyo', () => {
  const circleService = createCircleService();
  const memberService = createCircleMemberService();
  const circle = circleService.createCircle({
    nombre: 'Círculo diario',
    capacidadMinima: 2,
    capacidadMaxima: 8,
  });
  memberService.createMember({
    circleId: circle.id,
    usuarioId: 'user-1',
    estado: 'activo',
  });
  memberService.createMember({
    circleId: circle.id,
    usuarioId: 'user-2',
    estado: 'activo',
  });
  const diary = createSharedDiaryService({ circleService, memberService });

  const entry = diary.createEntry(
    circle.id,
    'user-1',
    'Hoy necesito compartir que ha sido una jornada difícil.'
  );
  const withSupport = diary.addSupport(
    circle.id,
    entry.id,
    'user-2',
    'Estoy contigo. Gracias por compartirlo.'
  );

  assert.equal(withSupport.supports.length, 1);
  assert.equal(withSupport.supports[0].usuarioId, 'user-2');
  assert.equal(diary.listEntries(circle.id, 'user-1').length, 1);
});

test('bloquea entradas y apoyos fuera del círculo activo', () => {
  const circleService = createCircleService();
  const memberService = createCircleMemberService();
  const circle = circleService.createCircle({
    nombre: 'Círculo privado',
    capacidadMinima: 2,
    capacidadMaxima: 8,
  });
  const diary = createSharedDiaryService({ circleService, memberService });

  assert.throws(
    () => diary.createEntry(circle.id, 'user-1', 'Mensaje'),
    /miembro activo/
  );
  assert.throws(
    () => diary.listEntries(circle.id, 'user-1'),
    /miembro activo/
  );
  memberService.createMember({
    circleId: circle.id,
    usuarioId: 'user-1',
    estado: 'activo',
  });
  assert.throws(
    () => diary.createEntry(circle.id, 'user-1', ''),
    /entrada/i
  );
});
