import React, { useEffect, useState } from 'react';
import {
  buildFacilitatorSessionGuide,
  buildJitsiRoomName,
  createJitsiUrl,
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

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('room') !== roomName) {
      url.searchParams.set('room', roomName);
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }
  }, [roomName]);

  const sessionGuide = buildFacilitatorSessionGuide({
    groupName: displayName || 'tu círculo',
    theme: sessionTheme || 'cuidado y límites',
    totalMinutes: 60,
  });

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
          <h2 id="facilitator-script-title" style={{ marginTop: 0 }}>
            {sessionGuide.title}
          </h2>
          <p style={{ margin: '0.2rem 0 1rem', color: '#53657a' }}>
            {sessionGuide.summary}
          </p>
          <ol style={{ paddingLeft: '1.1rem', margin: 0, display: 'grid', gap: '0.8rem' }}>
            {sessionGuide.sections.map((section) => (
              <li key={section.id} style={{ color: '#1f2d3d' }}>
                <strong>
                  {section.name} ({section.minutes} min)
                </strong>
                <div style={{ marginTop: '0.25rem', lineHeight: 1.5 }}>{section.prompt}</div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </main>
  );
}
