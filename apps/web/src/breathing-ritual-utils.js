const PHASE_DURATION_SECONDS = 3 * 60;

export const BREATHING_RITUALS = [
  {
    id: 'respiracion',
    title: 'Respiración amable',
    description: 'Una pausa para notar el aire sin cambiar su ritmo.',
    phases: [
      { title: 'Acomodarte', prompt: 'Busca una postura cómoda. Afloja lo que no necesites sostener.' },
      { title: 'Notar el aire', prompt: 'Observa dónde sientes la respiración, sin intentar hacerla más profunda.' },
      { title: 'Acompañar', prompt: 'Deja que cada inhalación y exhalación siga su ritmo natural. No hace falta contener el aire.' },
      { title: 'Dar espacio', prompt: 'Si tu mente se distrae, puedes volver con suavidad a una sensación cómoda.' },
      { title: 'Regresar', prompt: 'Nota el apoyo de tu cuerpo y vuelve a tu día a tu propio ritmo.' },
    ],
  },
  {
    id: 'meditacion',
    title: 'Pausa de atención',
    description: 'Un recorrido breve por las sensaciones del momento presente.',
    phases: [
      { title: 'Llegar', prompt: 'Elige una postura que puedas mantener con comodidad durante unos minutos.' },
      { title: 'Sentir el apoyo', prompt: 'Nota los puntos de contacto de tu cuerpo con la silla, el suelo o la cama.' },
      { title: 'Explorar los sentidos', prompt: 'Observa sonidos, colores o sensaciones cercanas, sin necesidad de nombrarlos todos.' },
      { title: 'Hacer espacio', prompt: 'Si aparece un pensamiento, reconoce que está ahí y vuelve a una sensación neutral.' },
      { title: 'Cerrar la pausa', prompt: 'Elige algo pequeño que te gustaría llevar contigo al continuar el día.' },
    ],
  },
  {
    id: 'caminata',
    title: 'Caminata virtual',
    description: 'Imagina un paseo tranquilo o muévete solo si el espacio es seguro.',
    phases: [
      { title: 'Elegir un lugar', prompt: 'Imagina un sitio tranquilo y familiar; también puedes permanecer sentado.' },
      { title: 'Empezar el paseo', prompt: 'Si es seguro para ti, camina despacio en el lugar. Si no, imagina el primer paso.' },
      { title: 'Mirar alrededor', prompt: 'Imagina detalles del entorno: la luz, los colores y las formas que te rodean.' },
      { title: 'Hacer una pausa', prompt: 'Detente o quédate quieto. Nota una cosa que te resulte agradable o neutral.' },
      { title: 'Volver', prompt: 'Termina el paseo imaginario y regresa con calma a donde estás.' },
    ],
  },
].map((ritual) => ({
  ...ritual,
  phases: ritual.phases.map((phase) => ({
    ...phase,
    durationSeconds: PHASE_DURATION_SECONDS,
  })),
}));

export function getRitualDurationSeconds(ritual) {
  if (!ritual || !Array.isArray(ritual.phases) || ritual.phases.length === 0) {
    throw new Error('El ritual debe tener al menos una fase.');
  }
  return ritual.phases.reduce((total, phase) => {
    if (!Number.isInteger(phase.durationSeconds) || phase.durationSeconds <= 0) {
      throw new Error('La duración de cada fase debe ser un entero positivo.');
    }
    return total + phase.durationSeconds;
  }, 0);
}

export function getRitualPlaybackState(ritual, elapsedSeconds) {
  const totalSeconds = getRitualDurationSeconds(ritual);
  const elapsed = Math.min(totalSeconds, Math.max(0, Number(elapsedSeconds) || 0));
  let phaseElapsed = 0;
  let currentPhase = null;
  let currentIndex = -1;

  for (let index = 0; index < ritual.phases.length; index += 1) {
    const phase = ritual.phases[index];
    if (elapsed < phaseElapsed + phase.durationSeconds) {
      currentPhase = phase;
      currentIndex = index;
      break;
    }
    phaseElapsed += phase.durationSeconds;
  }

  return {
    totalSeconds,
    elapsedSeconds: elapsed,
    remainingSeconds: Math.ceil(totalSeconds - elapsed),
    progressRatio: elapsed / totalSeconds,
    currentPhase,
    currentIndex,
    phaseRemainingSeconds: currentPhase
      ? Math.ceil(phaseElapsed + currentPhase.durationSeconds - elapsed)
      : 0,
    isFinished: elapsed >= totalSeconds,
  };
}

export function formatRitualTime(seconds) {
  const safeSeconds = Math.max(0, Math.ceil(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
