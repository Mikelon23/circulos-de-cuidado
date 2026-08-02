const test = require('node:test');
const assert = require('node:assert/strict');
const { createCircleService } = require('../apps/api/src/circles.cjs');

test('createCircleService implementa CRUD completo para circulos', () => {
  const service = createCircleService();

  const created = service.createCircle({
    nombre: 'Círculo de apoyo para cuidadores',
    tema: 'Estrés y rutina',
    descripcion: 'Grupo de acompañamiento para cuidadores de la tercera edad.',
    facilitadorId: 'facilitador-001',
    capacidadMinima: 4,
    capacidadMaxima: 8,
    estado: 'activo',
  });

  assert.equal(created.nombre, 'Círculo de apoyo para cuidadores');
  assert.equal(created.tema, 'Estrés y rutina');
  assert.equal(created.estado, 'activo');
  assert.ok(created.id);

  const found = service.getCircle(created.id);
  assert.equal(found.id, created.id);
  assert.equal(found.capacidadMaxima, 8);

  const updated = service.updateCircle(created.id, {
    tema: 'Bienestar emocional y red de apoyo',
    estado: 'pausado',
    capacidadMaxima: 10,
  });

  assert.equal(updated.tema, 'Bienestar emocional y red de apoyo');
  assert.equal(updated.estado, 'pausado');
  assert.equal(updated.capacidadMaxima, 10);

  const list = service.listCircles();
  assert.equal(list.length, 1);

  const deleted = service.deleteCircle(created.id);
  assert.equal(deleted.id, created.id);
  assert.equal(service.listCircles().length, 0);
});
