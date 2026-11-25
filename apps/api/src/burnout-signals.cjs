const DEFAULT_SIGNALS = [
  {
    id: 'agotamiento-fisico',
    titulo: 'Agotamiento físico persistente',
    descripcion: 'Tu cuerpo no recupera energía aunque descanses o duermas.',
    reconocible: '¿Sientes cansancio profundo al empezar o terminar el día?',
    accion: 'Reduce una obligación hoy y informa a alguien de confianza cómo te sientes.',
  },
  {
    id: 'desconexion-emocional',
    titulo: 'Desconexión emocional',
    descripcion: 'Te resulta difícil sentir cercanía o empatía con la persona que cuidas.',
    reconocible: '¿Notas distanciamiento, indiferencia o una dificultad nueva para conectar?',
    accion: 'Haz una pausa sin culpa y busca apoyo en tu círculo o facilitador.',
  },
  {
    id: 'irritabilidad',
    titulo: 'Irritabilidad y menor tolerancia',
    descripcion: 'Situaciones pequeñas generan frustración intensa o respuestas más duras.',
    reconocible: '¿Te molestas con mayor facilidad o tienes menos paciencia de la habitual?',
    accion: 'Nombra la emoción, crea distancia segura y delega lo posible.',
  },
  {
    id: 'culpa-perfeccionismo',
    titulo: 'Culpa o perfeccionismo constante',
    descripcion: 'Sentir que nunca haces suficiente puede mantenerte en alerta continua.',
    reconocible: '¿Te juzgas con dureza aunque hayas hecho todo lo posible?',
    accion: 'Enumera lo que sí lograste y sustituye la exigencia por una meta mínima.',
  },
  {
    id: 'alteraciones-del-descanso',
    titulo: 'Cambios en el descanso',
    descripcion: 'Dificultad para conciliar el sueño, despertar cansado o dormir demasiado.',
    reconocible: '¿Tu sueño o tus momentos de descanso han cambiado últimamente?',
    accion: 'Protege una rutina breve de descanso y conversa con un profesional si persiste.',
  },
  {
    id: 'dificultad-para-disfrutar',
    titulo: 'Dificultad para disfrutar',
    descripcion: 'Las actividades que antes daban placer ya no producen interés ni motivación.',
    reconocible: '¿Has perdido interés en actividades, relaciones o momentos que te hacían bien?',
    accion: 'Prueba una actividad pequeña sin exigencia y comparte cómo te afecta.',
  },
];

function createBurnoutSignalsService() {
  const signals = DEFAULT_SIGNALS.map((signal) => ({ ...signal }));

  function listSignals() {
    return signals.map((signal) => ({ ...signal }));
  }

  function getSignal(signalId) {
    const normalizedId = String(signalId || '').trim();
    if (!normalizedId) {
      throw new Error('El identificador de la señal es obligatorio');
    }
    const signal = signals.find((candidate) => candidate.id === normalizedId);
    if (!signal) {
      throw new Error('Señal no encontrada');
    }
    return { ...signal };
  }

  function evaluateRecognition(selectedIds = []) {
    if (!Array.isArray(selectedIds)) {
      throw new Error('Las señales seleccionadas deben enviarse en una lista');
    }
    const knownIds = new Set(signals.map((signal) => signal.id));
    const recognized = [
      ...new Set(selectedIds.map((id) => String(id || '').trim()).filter((id) => knownIds.has(id))),
    ];
    const level =
      recognized.length === 0
        ? 'ninguna'
        : recognized.length <= 2
          ? 'leve'
          : recognized.length <= 4
            ? 'moderada'
            : 'alta';

    return {
      recognizedCount: recognized.length,
      level,
      message:
        recognized.length === 0
          ? 'No has reconocido señales en esta revisión. Puedes repetirla cuando lo necesites.'
          : 'Reconocer estas señales es un primer paso. Prioriza descanso, apoyo y límites realistas.',
    };
  }

  return {
    listSignals,
    getSignal,
    evaluateRecognition,
  };
}

module.exports = {
  createBurnoutSignalsService,
  DEFAULT_SIGNALS,
};
