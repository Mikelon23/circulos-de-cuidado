const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const helperUrl = pathToFileURL(
  path.resolve(__dirname, '../apps/web/src/breathing-ritual-utils.js')
).href;

test('cada práctica guiada dura exactamente 15 minutos', async () => {
  const { BREATHING_RITUALS, getRitualDurationSeconds } = await import(helperUrl);

  assert.deepEqual(
    BREATHING_RITUALS.map((ritual) => getRitualDurationSeconds(ritual)),
    [900, 900, 900]
  );
});

test('el reproductor cambia de fase, calcula progreso y detiene la guía al completarla', async () => {
  const { BREATHING_RITUALS, getRitualPlaybackState, formatRitualTime } = await import(helperUrl);
  const ritual = BREATHING_RITUALS[0];

  const nextPhase = getRitualPlaybackState(ritual, 180);
  assert.equal(nextPhase.currentIndex, 1);
  assert.equal(nextPhase.remainingSeconds, 720);
  assert.equal(nextPhase.phaseRemainingSeconds, 180);
  assert.equal(nextPhase.progressRatio, 0.2);

  const completed = getRitualPlaybackState(ritual, 1000);
  assert.equal(completed.isFinished, true);
  assert.equal(completed.currentPhase, null);
  assert.equal(completed.remainingSeconds, 0);
  assert.equal(formatRitualTime(900), '15:00');
});
