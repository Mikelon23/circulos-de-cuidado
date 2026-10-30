const test = require('node:test');
const assert = require('node:assert/strict');

const { createCircleChangeService } = require('../apps/api/src/circle-change.cjs');

test('createCircleChangeService crea una solicitud de re-matching pendiente', () => {
  const service = createCircleChangeService();

  const request = service.createRequest({
    cuidadorId: 'cuidador-001',
    currentCircleId: 'circle-101',
    motivo: 'No conecta con el grupo actual',
    threshold: 0.7,
  });

  assert.equal(request.cuidadorId, 'cuidador-001');
  assert.equal(request.currentCircleId, 'circle-101');
  assert.equal(request.estado, 'pending');
  assert.equal(request.threshold, 0.7);
  assert.ok(request.id);
});

test('requestRematch usa threshold de 0.7 y permite aprobación posterior', () => {
  const service = createCircleChangeService();

  const request = service.requestRematch({
    cuidadorId: 'cuidador-002',
    currentCircleId: 'circle-202',
    motivo: 'No se conecta con su grupo',
  });

  assert.equal(request.estado, 'pending');
  assert.equal(request.threshold, 0.7);

  const approved = service.approveRequest(request.id, { reviewerId: 'admin-1' });
  assert.equal(approved.estado, 'approved');
  assert.ok(approved.metadata.approvedAt);
});

test('getRequestsForCaregiver y rejectRequest mantienen el flujo de revisión', () => {
  const service = createCircleChangeService();

  const request = service.createRequest({
    cuidadorId: 'cuidador-003',
    currentCircleId: 'circle-303',
    motivo: 'Cambio por disponibilidad',
  });

  const requests = service.getRequestsForCaregiver('cuidador-003');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].id, request.id);

  const rejected = service.rejectRequest(request.id, 'No cumple criterios de re-matching');
  assert.equal(rejected.estado, 'rejected');
  assert.match(rejected.motivo, /No cumple criterios/);
});
