import React, { useEffect, useMemo, useState } from 'react';
import {
  BREATHING_RITUALS,
  formatRitualTime,
  getRitualPlaybackState,
} from './breathing-ritual-utils.js';

const INITIAL_RITUAL = BREATHING_RITUALS[0];
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function BreathingRitual() {
  const [ritualId, setRitualId] = useState(INITIAL_RITUAL.id);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [hasRecordedCompletion, setHasRecordedCompletion] = useState(false);
  const ritual = BREATHING_RITUALS.find((entry) => entry.id === ritualId) || INITIAL_RITUAL;
  const isPlaying = startedAt !== null;

  useEffect(() => {
    if (!isPlaying) return undefined;
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [isPlaying]);

  const playback = useMemo(
    () =>
      getRitualPlaybackState(
        ritual,
        elapsedSeconds + (startedAt === null ? 0 : Math.max(0, (now - startedAt) / 1000))
      ),
    [elapsedSeconds, now, ritual, startedAt]
  );

  useEffect(() => {
    if (startedAt !== null && playback.isFinished) {
      setElapsedSeconds(playback.totalSeconds);
      setStartedAt(null);
    }
  }, [playback.isFinished, playback.totalSeconds, startedAt]);

  useEffect(() => {
    if (!playback.isFinished || hasRecordedCompletion) return;
    setHasRecordedCompletion(true);

    try {
      const saved = JSON.parse(localStorage.getItem('breathingCompletions') || '[]');
      const completions = Array.isArray(saved) ? saved : [];
      completions.push({
        ritualId,
        completedAt: new Date().toISOString(),
      });
      localStorage.setItem('breathingCompletions', JSON.stringify(completions.slice(-100)));
    } catch {
      localStorage.setItem(
        'breathingCompletions',
        JSON.stringify([{ ritualId, completedAt: new Date().toISOString() }])
      );
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    fetch(`${apiUrl}/api/v1/achievements/ritual-completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ritualId,
        completedAt: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, [playback.isFinished, hasRecordedCompletion, ritualId]);

  function togglePlayback() {
    if (isPlaying) {
      setElapsedSeconds(playback.elapsedSeconds);
      setStartedAt(null);
      return;
    }
    if (playback.isFinished) return;
    const timestamp = Date.now();
    setNow(timestamp);
    setStartedAt(timestamp);
  }

  function resetPlayback() {
    setElapsedSeconds(0);
    setStartedAt(null);
    setNow(Date.now());
    setHasRecordedCompletion(false);
  }

  function chooseRitual(id) {
    setRitualId(id);
    resetPlayback();
  }

  return (
    <main
      style={{
        fontFamily: 'sans-serif',
        padding: '2rem',
        color: '#1f2d3d',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <a href="/">← Volver a Círculos de Cuidado</a>
      <header style={{ margin: '1.5rem 0' }}>
        <p style={{ marginBottom: '0.35rem', color: '#4d6d91', fontWeight: 700 }}>
          BIENESTAR · 15 MINUTOS
        </p>
        <h1 style={{ margin: 0 }}>Ritual de respiro</h1>
        <p style={{ color: '#53657a', lineHeight: 1.6 }}>
          Elige una pausa guiada. Puedes detenerte, cambiar de postura o volver a respirar con
          normalidad cuando quieras; no hay una forma correcta de hacerla.
        </p>
      </header>

      <section aria-labelledby="ritual-options-title">
        <h2 id="ritual-options-title">Elige tu práctica</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {BREATHING_RITUALS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={ritualId === option.id}
              onClick={() => chooseRitual(option.id)}
              style={{
                textAlign: 'left',
                padding: '1rem',
                borderRadius: '12px',
                border: `2px solid ${ritualId === option.id ? '#4d9a8b' : '#dfeaf4'}`,
                background: ritualId === option.id ? '#edf9f4' : '#fff',
                cursor: 'pointer',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '0.4rem' }}>{option.title}</strong>
              <span style={{ color: '#53657a', lineHeight: 1.5 }}>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="ritual-player-title"
        style={{
          marginTop: '1.5rem',
          padding: 'clamp(1rem, 4vw, 2rem)',
          borderRadius: '18px',
          border: '1px solid #dfeaf4',
          background: '#f7fafd',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 id="ritual-player-title" style={{ margin: 0 }}>{ritual.title}</h2>
            <p style={{ color: '#53657a', marginBottom: 0 }}>{ritual.description}</p>
          </div>
          <strong
            aria-label={`Tiempo restante: ${formatRitualTime(playback.remainingSeconds)}`}
            style={{ fontSize: '2rem', fontVariantNumeric: 'tabular-nums' }}
          >
            {formatRitualTime(playback.remainingSeconds)}
          </strong>
        </div>

        <progress
          aria-label="Progreso del ritual"
          value={playback.progressRatio}
          max="1"
          style={{ display: 'block', width: '100%', height: '12px', margin: '1.25rem 0' }}
        />

        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            minHeight: '145px',
            padding: '1rem',
            borderRadius: '12px',
            background: '#fff',
            border: '1px solid #e3ebf3',
          }}
        >
          {playback.isFinished ? (
            <>
              <h3 style={{ marginTop: 0 }}>Pausa completada</h3>
              <p style={{ marginBottom: 0, lineHeight: 1.6 }}>
                Gracias por regalarte este momento. Puedes volver a tu día a tu propio ritmo.
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: 0, color: '#4d6d91' }}>
                Paso {playback.currentIndex + 1} de {ritual.phases.length}
                {' · '}
                {formatRitualTime(playback.phaseRemainingSeconds)} restantes
              </p>
              <h3 style={{ margin: '0.4rem 0' }}>{playback.currentPhase.title}</h3>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{playback.currentPhase.prompt}</p>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button type="button" onClick={togglePlayback} disabled={playback.isFinished}>
            {isPlaying ? 'Pausar' : playback.elapsedSeconds > 0 ? 'Continuar' : 'Comenzar'}
          </button>
          <button type="button" onClick={resetPlayback}>
            Reiniciar
          </button>
        </div>
      </section>

      <p role="note" style={{ marginTop: '1rem', color: '#53657a', lineHeight: 1.6 }}>
        Esta actividad es una invitación de bienestar, no una indicación médica. Si alguna
        sensación te incomoda, pausa el ejercicio y elige lo que te resulte más seguro.
      </p>
    </main>
  );
}
