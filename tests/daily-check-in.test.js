const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const helperUrl = pathToFileURL(
  path.resolve(__dirname, '../apps/web/src/daily-check-in-utils.js')
).href;

test('el check-in diario expone una escala válida con emoji y resumen emocional', async () => {
  const { DAILY_CHECK_IN_QUESTION, DAILY_MOOD_OPTIONS, getMoodOption, normalizeDailyCheckInInput } =
    await import(helperUrl);

  assert.equal(DAILY_MOOD_OPTIONS.length, 10);
  assert.deepEqual(getMoodOption(8), { escala: 8, emoji: '😄', label: 'Muy bien' });

  const normalized = normalizeDailyCheckInInput({
    escala: 5,
    nota: '  Me siento estable hoy  ',
    emoji: '😐',
  });

  assert.equal(normalized.pregunta, DAILY_CHECK_IN_QUESTION);
  assert.equal(normalized.escala, 5);
  assert.equal(normalized.nota, 'Me siento estable hoy');
  assert.equal(normalized.emoji, '😐');
});

test('el check-in diario rechaza escalas fuera del rango permitido', async () => {
  const { normalizeDailyCheckInInput } = await import(helperUrl);

  assert.throws(() => normalizeDailyCheckInInput({ escala: 0 }), /entre 1 y 10/);
  assert.throws(() => normalizeDailyCheckInInput({ escala: 11 }), /entre 1 y 10/);
});
