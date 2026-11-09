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
