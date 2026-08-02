const test = require('node:test');
const assert = require('node:assert/strict');
const { createCircleMemberService } = require('../apps/api/src/circle-members.cjs');

test('createCircleMemberService implementa CRUD completo para miembros de circulo', () => {
  const service = createCircleMemberService();

  const created = service.createMember({
    circleId: 'circle-001',
    usuarioId: 'user-001',
    rol: 'participante',
    estado: 'activo',
    fechaIngreso: '2026-08-01T10:00:00.000Z',
  });

  assert.equal(created.circleId, 'circle-001');
  assert.equal(created.usuarioId, 'user-001');
  assert.equal(created.rol, 'participante');
  assert.equal(created.estado, 'activo');
  assert.ok(created.id);

  const found = service.getMember(created.id);
  assert.equal(found.id, created.id);
  assert.equal(found.circleId, 'circle-001');

  const updated = service.updateMember(created.id, {
    rol: 'oyente',
    estado: 'invitado',
    fechaSalida: '2026-08-02T12:00:00.000Z',
  });

  assert.equal(updated.rol, 'oyente');
  assert.equal(updated.estado, 'invitado');
  assert.equal(updated.fechaSalida, '2026-08-02T12:00:00.000Z');

  const list = service.listMembers();
  assert.equal(list.length, 1);

  const deleted = service.deleteMember(created.id);
  assert.equal(deleted.id, created.id);
  assert.equal(service.listMembers().length, 0);
});
