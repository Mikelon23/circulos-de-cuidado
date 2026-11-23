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

test('el historial filtra semana y mes y construye la evolución emocional', async () => {
  const {
    filterCheckInsByPeriod,
    buildCheckInHistoryChart,
    calculateCheckInAverage,
  } = await import(helperUrl);
  const now = new Date('2026-11-22T12:00:00.000Z');
  const history = [
    { escala: 4, emoji: '😕', respondidoEn: '2026-11-20T12:00:00.000Z' },
    { escala: 7, emoji: '😊', respondidoEn: '2026-11-10T12:00:00.000Z' },
    { escala: 9, emoji: '😁', respondidoEn: '2026-10-01T12:00:00.000Z' },
  ];

  assert.equal(filterCheckInsByPeriod(history, 'week', now).length, 1);
  assert.equal(filterCheckInsByPeriod(history, 'month', now).length, 2);
  assert.equal(buildCheckInHistoryChart(history, 'month', now)[0].escala, 7);
  assert.equal(calculateCheckInAverage(history), 20 / 3);
});
