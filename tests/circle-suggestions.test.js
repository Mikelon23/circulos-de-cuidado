const test = require('node:test');
const assert = require('node:assert/strict');

const { createCircleSuggestionService } = require('../apps/api/src/circle-suggestions.cjs');

test('createCircleSuggestionService crea sugerencias de círculo con compatibilidad', () => {
  const service = createCircleSuggestionService();

  const created = service.createSuggestion({
    cuidadorId: 'cuidador-123',
    circleId: 'circle-9',
    circleName: 'Círculo de apoyo nocturno',
    score: 0.88,
    estado: 'sent',
  });

  assert.equal(created.cuidadorId, 'cuidador-123');
  assert.equal(created.circleName, 'Círculo de apoyo nocturno');
  assert.equal(created.estado, 'sent');
  assert.equal(created.score, 88);
  assert.ok(created.id);
});

test('getSuggestionsForCaregiver devuelve todas las sugerencias del cuidador', () => {
  const service = createCircleSuggestionService();

  service.createSuggestion({ cuidadorId: 'cuidador-456', circleName: 'Grupo mañanas', score: 0.76 });
  service.createSuggestion({ cuidadorId: 'cuidador-456', circleName: 'Grupo tardes', score: 0.82 });
  service.createSuggestion({ cuidadorId: 'cuidador-999', circleName: 'Otro grupo', score: 0.91 });

  const suggestions = service.getSuggestionsForCaregiver('cuidador-456');

  assert.equal(suggestions.length, 2);
  assert.ok(suggestions.every((suggestion) => suggestion.cuidadorId === 'cuidador-456'));
  assert.deepEqual(
    suggestions.map((suggestion) => suggestion.circleName).sort(),
    ['Grupo mañanas', 'Grupo tardes']
  );
});

test('markAsRead y dismissSuggestion actualizan el estado de la sugerencia', () => {
  const service = createCircleSuggestionService();

  const created = service.createSuggestion({
    cuidadorId: 'cuidador-789',
    circleName: 'Grupo de acompañamiento',
    score: 0.7,
    estado: 'sent',
  });

  const marked = service.markAsRead(created.id);
  assert.equal(marked.estado, 'read');

  const dismissed = service.dismissSuggestion(created.id);
  assert.equal(dismissed.estado, 'dismissed');
});
