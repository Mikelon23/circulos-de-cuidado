export const DAILY_CHECK_IN_QUESTION = '¿Cómo te sientes hoy?';

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
