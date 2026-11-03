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
