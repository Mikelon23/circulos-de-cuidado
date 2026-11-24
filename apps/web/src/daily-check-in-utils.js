export const DAILY_CHECK_IN_QUESTION = '¿Cómo te sientes hoy?';
export const GRATITUDE_PROMPT = '¿Qué te hizo sonreír hoy?';

export function normalizeGratitudeInput(respuesta) {
  const normalized = typeof respuesta === 'string' ? respuesta.trim() : '';
  if (!normalized) return null;
  if (normalized.length > 500) {
    throw new Error('La respuesta debe tener 500 caracteres o menos.');
  }
  return normalized;
}

export const DAILY_MOOD_OPTIONS = [
  { escala: 1, emoji: '😵', label: 'Muy agotado' },
  { escala: 2, emoji: '😣', label: 'Agotado' },
  { escala: 3, emoji: '😔', label: 'Cansado' },
  { escala: 4, emoji: '😕', label: 'Preocupado' },
  { escala: 5, emoji: '😐', label: 'Neutral' },
  { escala: 6, emoji: '🙂', label: 'Bien' },
  { escala: 7, emoji: '😊', label: 'Contento' },
  { escala: 8, emoji: '😄', label: 'Muy bien' },
  { escala: 9, emoji: '😁', label: 'Energizado' },
  { escala: 10, emoji: '🤩', label: 'Excelente' },
];

export function getMoodOption(escala) {
  const safeEscala = Number(escala);

  if (!Number.isInteger(safeEscala) || safeEscala < 1 || safeEscala > 10) {
    throw new Error('La escala debe ser un entero entre 1 y 10.');
  }

  return DAILY_MOOD_OPTIONS.find((option) => option.escala === safeEscala) || DAILY_MOOD_OPTIONS[0];
}

export function normalizeDailyCheckInInput(payload = {}) {
  const escala = Number(payload.escala ?? payload.score);
  const nota = typeof payload.nota === 'string' ? payload.nota.trim() : '';
  const emoji = payload.emoji ? String(payload.emoji).trim() : getMoodOption(escala).emoji;

  if (!Number.isInteger(escala) || escala < 1 || escala > 10) {
    throw new Error('La escala debe ser un entero entre 1 y 10.');
  }

  return {
    pregunta: DAILY_CHECK_IN_QUESTION,
    escala,
    nota: nota || null,
    emoji,
  };
}

export function getMoodSummary(escala) {
  const mood = getMoodOption(escala);
  return `${mood.emoji} ${mood.label}`;
}

export const CHECK_IN_HISTORY_FILTERS = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'all', label: 'Todo' },
];

function normalizeHistoryDate(checkIn) {
  const value = checkIn.respondidoEn || checkIn.createdAt;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeCheckInHistoryPeriod(period) {
  if (!period || period === 'all') return 'all';
  if (period === 'week' || period === '7days' || period === 'semana') return 'week';
  if (period === 'month' || period === '30days' || period === 'mes') return 'month';
  throw new Error('El período debe ser semana, mes o todo.');
}

export function filterCheckInsByPeriod(checkIns = [], period = 'month', referenceDate = new Date()) {
  const normalizedPeriod = normalizeCheckInHistoryPeriod(period);
  const reference = new Date(referenceDate);
  if (Number.isNaN(reference.getTime())) {
    throw new Error('La fecha de referencia no es válida.');
  }

  const ordered = [...checkIns]
    .filter((checkIn) => normalizeHistoryDate(checkIn))
    .sort((a, b) => normalizeHistoryDate(a) - normalizeHistoryDate(b));

  if (normalizedPeriod === 'all') return ordered;

  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (normalizedPeriod === 'week' ? 6 : 29));

  return ordered.filter((checkIn) => {
    const date = normalizeHistoryDate(checkIn);
    return date >= start && date <= new Date(reference.getTime());
  });
}

export function buildCheckInHistoryChart(checkIns = [], period = 'month', referenceDate = new Date()) {
  const filtered = filterCheckInsByPeriod(checkIns, period, referenceDate);
  return filtered.map((checkIn) => {
    const date = normalizeHistoryDate(checkIn);
    return {
      date: date.toISOString(),
      label: date.toLocaleDateString('es', { day: '2-digit', month: 'short' }),
      escala: Number(checkIn.escala),
      emoji: checkIn.emoji || getMoodOption(checkIn.escala).emoji,
      nota: typeof checkIn.nota === 'string' ? checkIn.nota : '',
    };
  });
}

export function calculateCheckInAverage(checkIns = []) {
  const validScores = checkIns
    .map((checkIn) => Number(checkIn.escala))
    .filter((escala) => Number.isInteger(escala) && escala >= 1 && escala <= 10);

  if (!validScores.length) return null;
  return validScores.reduce((sum, escala) => sum + escala, 0) / validScores.length;
}
