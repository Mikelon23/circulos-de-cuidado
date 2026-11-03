const DEFAULT_ROOM_PREFIX = 'circulos-de-cuidado';
const ROOM_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,127}$/i;

export function buildJitsiRoomName(baseName = DEFAULT_ROOM_PREFIX) {
  const sanitized = String(baseName)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const suffix =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `${sanitized || DEFAULT_ROOM_PREFIX}-${suffix}`;
}

export function getJitsiRoomName(search) {
  const roomName = new URLSearchParams(search).get('room');
  return roomName && ROOM_NAME_PATTERN.test(roomName) ? roomName : null;
}

export function createJitsiUrl(roomName, displayName) {
  const url = new URL(`https://meet.jit.si/${encodeURIComponent(roomName)}`);
  url.searchParams.set('config.startWithAudioMuted', 'true');
  url.searchParams.set('config.startWithVideoMuted', 'false');
  url.searchParams.set('userInfo.displayName', displayName);
  return url.toString();
}
