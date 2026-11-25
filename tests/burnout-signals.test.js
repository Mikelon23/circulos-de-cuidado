const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const { createBurnoutSignalsService } = require('../apps/api/src/burnout-signals.cjs');

test('burnout signals ofrece artículos educativos y una evaluación interactiva', () => {
  const service = createBurnoutSignalsService();
  const signals = service.listSignals();

  assert.equal(signals.length, 6);
  assert.equal(service.getSignal(signals[0].id).id, signals[0].id);

  const result = service.evaluateRecognition([signals[0].id, signals[1].id, signals[1].id]);
  assert.equal(result.recognizedCount, 2);
  assert.equal(result.level, 'leve');
});

test('burnout signals clasifica niveles y rechaza entradas no válidas', () => {
  const service = createBurnoutSignalsService();

  assert.equal(service.evaluateRecognition([]).level, 'ninguna');
  assert.equal(
    service.evaluateRecognition([
      'agotamiento-fisico',
      'desconexion-emocional',
      'irritabilidad',
      'culpa-perfeccionismo',
    ]).level,
    'moderada'
  );
  assert.equal(
    service.evaluateRecognition([
      'agotamiento-fisico',
      'desconexion-emocional',
      'irritabilidad',
      'culpa-perfeccionismo',
      'alteraciones-del-descanso',
      'dificultad-para-disfrutar',
    ]).level,
    'alta'
  );
  assert.throws(() => service.evaluateRecognition('agotamiento-fisico'), /lista/);
  assert.throws(() => service.getSignal('desconocida'), /Señal no encontrada/);
});

test('las utilidades web calculan reconocimiento sin duplicados', async () => {
  const helperUrl = pathToFileURL(
    path.resolve(__dirname, '../apps/web/src/burnout-signals-utils.js')
  ).href;
  const { BURNOUT_SIGNAL_QUESTION, BURNOUT_SIGNALS, evaluateBurnoutRecognition } = await import(
    helperUrl
  );

  assert.equal(BURNOUT_SIGNAL_QUESTION, 'Estos son los signos de burnout. ¿Los reconoces?');
  assert.equal(BURNOUT_SIGNALS.length, 6);
  assert.deepEqual(evaluateBurnoutRecognition(['irritabilidad', 'irritabilidad', 'desconocida']), {
    recognizedCount: 1,
    level: 'leve',
    recognizedIds: ['irritabilidad'],
  });
});
