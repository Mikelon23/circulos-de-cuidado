const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const helperUrl = pathToFileURL(
  path.resolve(__dirname, '../apps/web/src/jitsi-room-utils.js')
).href;

test('Jitsi room names are normalized and unique', async () => {
  const { buildJitsiRoomName } = await import(helperUrl);
  const names = Array.from({ length: 20 }, () => buildJitsiRoomName('Círculo de prueba'));

  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.match(name, /^circulo-de-prueba-[a-f0-9-]+$/);
  }
});

test('a valid room query can be reused by everyone joining the link', async () => {
  const { getJitsiRoomName } = await import(helperUrl);

  assert.equal(getJitsiRoomName('?room=circulos-de-cuidado-abc123'), 'circulos-de-cuidado-abc123');
  assert.equal(getJitsiRoomName('?room=not%2Fa%2Froom'), null);
});

test('Jitsi iframe URLs encode room and participant names', async () => {
  const { createJitsiUrl } = await import(helperUrl);
  const url = new URL(createJitsiUrl('circulo-123', 'María & Ana'));

  assert.equal(url.origin, 'https://meet.jit.si');
  assert.equal(url.pathname, '/circulo-123');
  assert.equal(url.searchParams.get('config.startWithAudioMuted'), 'true');
  assert.equal(url.searchParams.get('config.startWithVideoMuted'), 'false');
  assert.equal(url.searchParams.get('userInfo.displayName'), 'María & Ana');
});

test('buildFacilitatorSessionGuide creates the default 60-minute flow with a dynamic theme', async () => {
  const { buildFacilitatorSessionGuide } = await import(helperUrl);
  const guide = buildFacilitatorSessionGuide({
    groupName: 'Círculo de apoyo',
    theme: 'cuidado y límites',
    totalMinutes: 60,
  });

  assert.equal(guide.title, 'Guion para Círculo de apoyo');
  assert.equal(guide.totalMinutes, 60);
  assert.deepEqual(
    guide.sections.map((section) => section.name),
    ['Check-in', 'Tema del día', 'Compartir', 'Cierre']
  );
  assert.equal(guide.sections.reduce((sum, section) => sum + section.minutes, 0), 60);
  assert.match(guide.sections[1].prompt, /cuidado y límites/);
});

test('buildFacilitatorSessionGuide adapts the distribution when the session length changes', async () => {
  const { buildFacilitatorSessionGuide } = await import(helperUrl);
  const guide = buildFacilitatorSessionGuide({
    groupName: 'Grupo nocturno',
    theme: 'sueño y recuperación',
    totalMinutes: 75,
  });

  assert.equal(guide.totalMinutes, 75);
  assert.equal(guide.sections.reduce((sum, section) => sum + section.minutes, 0), 75);
  assert.ok(guide.sections.some((section) => section.name === 'Tema del día' && section.minutes >= 15));
  assert.match(guide.sections[1].prompt, /sueño y recuperación/);
});

test('buildSessionTimerState tracks the current phase and countdown accurately', async () => {
  const { buildSessionTimerState, formatSessionCountdown } = await import(helperUrl);
  const guide = [
    { id: 'one', name: 'Phase 1', minutes: 1 },
    { id: 'two', name: 'Phase 2', minutes: 2 },
  ];

  const timer = buildSessionTimerState(guide, 45000, 0);
  assert.equal(timer.currentIndex, 0);
  assert.equal(timer.currentSection.name, 'Phase 1');
  assert.equal(timer.phaseRemainingSeconds, 15);
  assert.equal(formatSessionCountdown(timer.remainingSeconds), '00:02:15');

  const secondPhase = buildSessionTimerState(guide, 90000, 0);
  assert.equal(secondPhase.currentIndex, 1);
  assert.equal(secondPhase.currentSection.name, 'Phase 2');
  assert.equal(secondPhase.phaseRemainingSeconds, 90);
});
