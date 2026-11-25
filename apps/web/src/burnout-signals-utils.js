export const BURNOUT_SIGNAL_QUESTION = 'Estos son los signos de burnout. ¿Los reconoces?';

export const BURNOUT_SIGNALS = [
  {
    id: 'agotamiento-fisico',
    title: 'Agotamiento físico persistente',
    description: 'Tu cuerpo no recupera energía aunque descanses o duermas.',
    question: '¿Sientes cansancio profundo al empezar o terminar el día?',
    action: 'Reduce una obligación hoy y informa a alguien de confianza cómo te sientes.',
  },
  {
    id: 'desconexion-emocional',
    title: 'Desconexión emocional',
    description: 'Te resulta difícil sentir cercanía o empatía con la persona que cuidas.',
    question: '¿Notas distanciamiento, indiferencia o una dificultad nueva para conectar?',
    action: 'Haz una pausa sin culpa y busca apoyo en tu círculo o facilitador.',
  },
  {
    id: 'irritabilidad',
    title: 'Irritabilidad y menor tolerancia',
    description: 'Situaciones pequeñas generan frustración intensa o respuestas más duras.',
    question: '¿Te molestas con mayor facilidad o tienes menos paciencia de la habitual?',
    action: 'Nombra la emoción, crea distancia segura y delega lo posible.',
  },
  {
    id: 'culpa-perfeccionismo',
    title: 'Culpa o perfeccionismo constante',
    description: 'Sentir que nunca haces suficiente puede mantenerte en alerta continua.',
    question: '¿Te juzgas con dureza aunque hayas hecho todo lo posible?',
    action: 'Enumera lo que sí lograste y sustituye la exigencia por una meta mínima.',
  },
  {
    id: 'alteraciones-del-descanso',
    title: 'Cambios en el descanso',
    description: 'Dificultad para conciliar el sueño, despertar cansado o dormir demasiado.',
    question: '¿Tu sueño o tus momentos de descanso han cambiado últimamente?',
    action: 'Protege una rutina breve de descanso y conversa con un profesional si persiste.',
  },
  {
    id: 'dificultad-para-disfrutar',
    title: 'Dificultad para disfrutar',
    description: 'Las actividades que antes daban placer ya no producen interés ni motivación.',
    question: '¿Has perdido interés en actividades, relaciones o momentos que te hacían bien?',
    action: 'Prueba una actividad pequeña sin exigencia y comparte cómo te afecta.',
  },
];

export function evaluateBurnoutRecognition(selectedIds = []) {
  if (!Array.isArray(selectedIds)) {
    throw new Error('Las señales seleccionadas deben enviarse en una lista.');
  }
  const validIds = new Set(BURNOUT_SIGNALS.map((signal) => signal.id));
  const recognizedIds = [
    ...new Set(selectedIds.map((id) => String(id || '').trim()).filter((id) => validIds.has(id))),
  ];
  const recognizedCount = recognizedIds.length;
  const level =
    recognizedCount === 0
      ? 'ninguna'
      : recognizedCount <= 2
        ? 'leve'
        : recognizedCount <= 4
          ? 'moderada'
          : 'alta';

  return { recognizedCount, level, recognizedIds };
}
