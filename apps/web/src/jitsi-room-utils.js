const DEFAULT_ROOM_PREFIX = 'circulos-de-cuidado';
const ROOM_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,127}$/i;
const DEFAULT_SESSION_TEMPLATE = [
  {
    id: 'check-in',
    name: 'Check-in',
    minutes: 10,
    prompt: 'Abre con 1 minuto de respiración y pregunta: “¿Cómo te encuentras hoy?”.',
  },
  {
    id: 'tema',
    name: 'Tema del día',
    minutes: 15,
    prompt: 'Presenta el tema “{theme}” y conecta la reflexión con la experiencia del grupo.',
  },
  {
    id: 'compartir',
    name: 'Compartir',
    minutes: 25,
    prompt: 'Invita a cada persona a compartir una idea, una duda o una práctica útil.',
  },
  {
    id: 'cierre',
    name: 'Cierre',
    minutes: 10,
    prompt: 'Resúmelo en 3 ideas clave y deja una pequeña intención para la semana.',
  },
];

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

export function buildFacilitatorSessionGuide(options = {}) {
  const groupName = String(options.groupName || 'tu círculo').trim() || 'tu círculo';
  const theme = String(options.theme || 'cuidado y límites').trim() || 'cuidado y límites';
  const totalMinutes = Number(options.totalMinutes ?? 60);

  if (!Number.isInteger(totalMinutes) || totalMinutes <= 0) {
    throw new Error('La duración total de la sesión debe ser un entero mayor que 0.');
  }

  const sections = DEFAULT_SESSION_TEMPLATE.map((section, index, allSections) => {
    const baseMinutes = section.minutes;
    const remainingSections = allSections.length - index;
    const shouldUseRemaining = index === allSections.length - 1;
    const minutes = shouldUseRemaining
      ? Math.max(1, totalMinutes - allSections.slice(0, -1).reduce((sum, current) => sum + current.minutes, 0))
      : Math.max(1, Math.round((baseMinutes / 60) * totalMinutes));

    return {
      id: section.id,
      name: section.name,
      minutes,
      prompt: section.prompt.replace('{theme}', theme).replace('{groupName}', groupName),
    };
  });

  const finalTotal = sections.reduce((sum, section) => sum + section.minutes, 0);
  if (finalTotal !== totalMinutes) {
    const difference = totalMinutes - finalTotal;
    const lastSection = sections[sections.length - 1];
    lastSection.minutes = Math.max(1, lastSection.minutes + difference);
  }

  return {
    title: `Guion para ${groupName}`,
    totalMinutes,
    sections,
    summary: `Guion dinámico de ${totalMinutes} minutos para ${groupName}.`,
  };
}
