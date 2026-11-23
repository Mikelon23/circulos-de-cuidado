const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const {
  createGratitudeService,
  normalizeGratitudeInput,
} = require('../apps/api/src/gratitudes.cjs');

test('createGratitudeService guarda momentos opcionales por usuario', () => {
  const service = createGratitudeService();
  const created = service.createGratitude({
    usuarioId: 'cuidador-52',
    respuesta: 'Una amiga me llamó para preguntar cómo estaba.',
    fecha: '2026-11-22T12:00:00.000Z',
  });

  assert.ok(created.id);
  assert.equal(created.usuarioId, 'cuidador-52');
  assert.equal(created.respuesta, 'Una amiga me llamó para preguntar cómo estaba.');

  const history = service.listGratitudesByUser('cuidador-52');
  assert.equal(history.length, 1);
  assert.equal(history[0].id, created.id);
});

test('el momento de gratitud valida contenido y longitud', () => {
  assert.throws(
    () => normalizeGratitudeInput({ usuarioId: 'cuidador-52', respuesta: '   ' }),
    /sonreír/
  );
  assert.throws(
    () => normalizeGratitudeInput({ usuarioId: 'cuidador-52', respuesta: 'x'.repeat(501) }),
    /500/
  );
});

test('el prompt diario expone el texto oficial y normaliza la respuesta opcional', async () => {
  const helperUrl = pathToFileURL(
    path.resolve(__dirname, '../apps/web/src/daily-check-in-utils.js')
  ).href;
  const {
    GRATITUDE_PROMPT,
    normalizeGratitudeInput: normalizeFrontendGratitude,
  } = await import(helperUrl);

  assert.equal(GRATITUDE_PROMPT, '¿Qué te hizo sonreír hoy?');
  assert.equal(normalizeFrontendGratitude('  Una llamada amable  '), 'Una llamada amable');
  assert.equal(normalizeFrontendGratitude('   '), null);
  assert.throws(
    () => normalizeFrontendGratitude('x'.repeat(501)),
    /500/
  );
});
