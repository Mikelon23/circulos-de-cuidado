import React, { useEffect, useMemo, useState } from 'react';
import {
  buildFacilitatorSessionGuide,
  buildJitsiRoomName,
  buildSessionTimerState,
  createJitsiUrl,
  formatSessionCountdown,
  getJitsiRoomName,
} from './jitsi-room-utils.js';

function getInitialDisplayName() {
  const savedUser = localStorage.getItem('currentUser');
  if (!savedUser) return 'Cuidador';

  try {
    const parsedUser = JSON.parse(savedUser);
    return parsedUser.nombre || parsedUser.email || 'Cuidador';
  } catch {
    return 'Cuidador';
  }
}

export default function JitsiRoom() {
  const [roomName, setRoomName] = useState(
    () => getJitsiRoomName(window.location.search) || buildJitsiRoomName()
  );
  const [displayName, setDisplayName] = useState(getInitialDisplayName);
  const [shareMessage, setShareMessage] = useState('');
  const [sessionTheme, setSessionTheme] = useState('cuidado y límites');
  const [timerStartedAt, setTimerStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('room') !== roomName) {
      url.searchParams.set('room', roomName);
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }
  }, [roomName]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const sessionGuide = useMemo(
    () =>
      buildFacilitatorSessionGuide({
        groupName: displayName || 'tu círculo',
        theme: sessionTheme || 'cuidado y límites',
        totalMinutes: 60,
      }),
    [displayName, sessionTheme]
  );

  const sessionTimer = useMemo(
    () => buildSessionTimerState(sessionGuide.sections, now, timerStartedAt),
    [sessionGuide.sections, now, timerStartedAt]
  );

  const activeSection = sessionTimer.currentSection ?? sessionGuide.sections[0];
  const phaseProgress = Math.min(100, Math.max(0, sessionTimer.progressRatio * 100));

  const jitsiUrl = createJitsiUrl(roomName, displayName);
  const shareUrl = new URL(window.location.pathname, window.location.origin);
  shareUrl.searchParams.set('room', roomName);

  async function copyRoomLink() {
    setShareMessage('');
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('El portapapeles no está disponible.');
      }
      await navigator.clipboard.writeText(shareUrl.toString());
      setShareMessage('Enlace copiado. Compártelo con las personas de tu círculo.');
    } catch {
      setShareMessage('No se pudo copiar el enlace. Puedes copiarlo desde el campo de texto.');
    }
  }

  function generateAnotherRoom() {
    setRoomName(buildJitsiRoomName());
    setShareMessage('');
  }

  function resetSessionTimer() {
    setTimerStartedAt(Date.now());
    setNow(Date.now());
  }

  return (
    <main
      style={{
        fontFamily: 'sans-serif',
        padding: '2rem',
        color: '#1f2d3d',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}
      >
        <div>
          <a href="/">← Volver a Círculos de Cuidado</a>
          <h1 style={{ marginBottom: '0.5rem' }}>Sala de video</h1>
        </div>
        <button type="button" onClick={generateAnotherRoom}>
          Generar otra sala
        </button>
      </div>

      <p style={{ margin: '0.5rem 0 1.5rem' }}>
        Comparte este enlace para que las personas de tu círculo entren a la misma sala.
      </p>
      <label style={{ display: 'block', marginBottom: '1rem' }}>
        Enlace para compartir
        <input
          aria-label="Enlace para compartir"
          type="url"
          readOnly
          value={shareUrl.toString()}
          style={{ display: 'block', width: '100%', maxWidth: '620px', marginTop: '0.5rem' }}
        />
      </label>
      <button type="button" onClick={copyRoomLink}>
        Copiar enlace
      </button>
      {shareMessage && <p role="status">{shareMessage}</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          margin: '1.5rem 0',
        }}
      >
        <label style={{ display: 'block' }}>
          Nombre visible en la videollamada
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value || 'Cuidador')}
            style={{ display: 'block', width: '100%', marginTop: '0.5rem' }}
          />
        </label>

        <label style={{ display: 'block' }}>
          Tema del día
          <input
            type="text"
            value={sessionTheme}
            onChange={(event) => setSessionTheme(event.target.value || 'cuidado y límites')}
            style={{ display: 'block', width: '100%', marginTop: '0.5rem' }}
          />
        </label>
      </div>

      <p role="note">
        Cualquier persona con el enlace puede entrar a esta sala pública de Jitsi. No compartas
        información sensible.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2.1fr) minmax(260px, 0.9fr)',
          gap: '1.5rem',
          alignItems: 'start',
          marginTop: '1.5rem',
        }}
      >
        <iframe
          title="Sala de videollamada de Círculos de Cuidado"
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; speaker-selection;"
          allowFullScreen
          style={{
            width: '100%',
            minHeight: '70vh',
            border: '0',
            borderRadius: '18px',
            background: '#edf2f7',
          }}
        />

        <aside
          aria-labelledby="facilitator-script-title"
          style={{
            background: '#f7fafd',
            border: '1px solid #dfeaf4',
            borderRadius: '18px',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              background: '#eef7f7',
              border: '1px solid #cde8e8',
              borderRadius: '12px',
              padding: '0.9rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Temporizador
                </div>
                <strong style={{ fontSize: '1.8rem', display: 'block', marginTop: '0.25rem' }}>
                  {formatSessionCountdown(sessionTimer.remainingSeconds)}
                </strong>
              </div>
              <button type="button" onClick={resetSessionTimer} style={{ alignSelf: 'center' }}>
                Reiniciar
              </button>
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.95rem' }}>
              Fase actual: <strong>{activeSection.name}</strong>
            </div>
            <div style={{ marginTop: '0.35rem', color: '#53657a' }}>
              {sessionTimer.isFinished
                ? 'La sesión ha terminado.'
                : `${formatSessionCountdown(sessionTimer.phaseRemainingSeconds)} restantes en esta fase`}
            </div>
            <div
              aria-label="Progreso de la sesión"
              style={{
                width: '100%',
                height: '10px',
                background: '#dfeaf4',
                borderRadius: '999px',
                overflow: 'hidden',
                marginTop: '0.8rem',
              }}
            >
              <div
                style={{
                  width: `${phaseProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4DB7A6, #5A7AF7)',
                  borderRadius: '999px',
                }}
              />
            </div>
          </div>

          <h2 id="facilitator-script-title" style={{ marginTop: 0 }}>
            {sessionGuide.title}
          </h2>
          <p style={{ margin: '0.2rem 0 1rem', color: '#53657a' }}>
            {sessionGuide.summary}
          </p>
          <ol style={{ paddingLeft: '1.1rem', margin: 0, display: 'grid', gap: '0.8rem' }}>
            {sessionGuide.sections.map((section, index) => {
              const isActive = index === sessionTimer.currentIndex;
              const isCompleted = index < sessionTimer.currentIndex || sessionTimer.isFinished;
              return (
                <li
                  key={section.id}
                  style={{
                    color: '#1f2d3d',
                    background: isActive ? '#e8f4ff' : isCompleted ? '#eefaf5' : 'transparent',
                    border: isActive ? '1px solid #cfe2ff' : isCompleted ? '1px solid #d0f0e0' : '1px solid transparent',
                    borderRadius: '10px',
                    padding: isActive || isCompleted ? '0.45rem 0.6rem' : '0.2rem 0.1rem',
                  }}
                >
                  <strong>
                    {section.name} ({section.minutes} min)
                  </strong>
                  <div style={{ marginTop: '0.25rem', lineHeight: 1.5 }}>{section.prompt}</div>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </main>
  );
}
