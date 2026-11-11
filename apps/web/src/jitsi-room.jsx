import React, { useEffect, useMemo, useState } from 'react';
import {
  buildFacilitatorSessionGuide,
  buildJitsiRoomName,
  buildSessionTimerState,
  createJitsiUrl,
  formatSessionCountdown,
  getJitsiRoomName,
} from './jitsi-room-utils.js';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

function getCurrentUserId() {
  const savedUser = localStorage.getItem('currentUser');
  if (!savedUser) return 'usuario-demo';

  try {
    const parsedUser = JSON.parse(savedUser);
    return parsedUser.id || parsedUser.userId || parsedUser.email || 'usuario-demo';
  } catch {
    return 'usuario-demo';
  }
}

async function createCircleMessage(circleId, payload) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${apiUrl}/api/v1/circles/${encodeURIComponent(circleId)}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || 'No se pudo enviar el mensaje del círculo.');
  }

  return body.data;
}

async function updateCircleMessageReactions(circleId, messageId, reactions) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `${apiUrl}/api/v1/circles/${encodeURIComponent(circleId)}/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ reacciones: reactions }),
    }
  );
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || 'No se pudo actualizar la reacción del mensaje.');
  }

  return body.data;
}

function CircleChatPanel({ circleId, displayName }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!circleId) {
      setMessages([]);
      return;
    }

    let active = true;

    fetch(`${apiUrl}/api/v1/circles/${encodeURIComponent(circleId)}/messages`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error || 'No se pudieron cargar los mensajes del círculo.');
        }
        if (active) setMessages(Array.isArray(body.data) ? body.data : []);
      })
      .catch(() => {
        if (active) setMessages([]);
      });

    return () => {
      active = false;
    };
  }, [circleId]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedDraft = draft.trim();
    const trimmedAttachment = attachmentName.trim();

    if (!trimmedDraft && !trimmedAttachment) {
      setStatusMessage('Escribe un mensaje o añade un archivo para compartir con el círculo.');
      return;
    }

    setIsSending(true);
    setStatusMessage('');

    try {
      const created = await createCircleMessage(circleId, {
        circleId,
        usuarioId: getCurrentUserId(),
        contenido: trimmedDraft || 'Archivo adjunto',
        tipo: trimmedAttachment ? 'archivo' : 'texto',
        metadata: trimmedAttachment ? { filename: trimmedAttachment } : {},
      });

      setMessages((current) => [...current, created]);
      setDraft('');
      setAttachmentName('');
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsSending(false);
    }
  }

  async function toggleReaction(messageId, emoji) {
    const message = messages.find((entry) => entry.id === messageId);
    if (!message) return;

    const reactions = Array.isArray(message.reactions) ? [...message.reactions] : [];
    const hasReaction = reactions.includes(emoji);
    const nextReactions = hasReaction ? reactions.filter((item) => item !== emoji) : [...reactions, emoji];

    try {
      const updated = await updateCircleMessageReactions(circleId, messageId, nextReactions);
      setMessages((current) =>
        current.map((entry) => (entry.id === messageId ? { ...entry, reactions: updated.reactions || nextReactions } : entry))
      );
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  return (
    <aside
      aria-labelledby="circle-chat-title"
      style={{
        background: '#f7fafd',
        border: '1px solid #dfeaf4',
        borderRadius: '18px',
        padding: '1.25rem',
        display: 'grid',
        gap: '1rem',
      }}
    >
      <div>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Chat del círculo
        </div>
        <h2 id="circle-chat-title" style={{ margin: '0.35rem 0 0' }}>
          Mensajes compartidos
        </h2>
      </div>

      <div
        style={{
          maxHeight: '320px',
          overflowY: 'auto',
          display: 'grid',
          gap: '0.75rem',
          paddingRight: '0.25rem',
        }}
      >
        {messages.length === 0 ? (
          <p style={{ margin: 0, color: '#53657a' }}>
            Todavía no hay mensajes en este círculo. Sé la primera persona en compartir una idea.
          </p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              style={{
                background: '#fff',
                border: '1px solid #dfeaf4',
                borderRadius: '12px',
                padding: '0.75rem 0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                <strong>{message.usuarioId === getCurrentUserId() ? displayName || 'Tú' : message.usuarioId || 'Miembro'}</strong>
                <span style={{ color: '#53657a', fontSize: '0.75rem' }}>
                  {new Date(message.createdAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p style={{ margin: '0.5rem 0 0.1rem', lineHeight: 1.5 }}>
                {message.contenido || 'Archivo adjunto'}
              </p>
              {message.metadata?.filename && (
                <div style={{ color: '#4d6d91', fontSize: '0.85rem' }}>
                  Archivo: {message.metadata.filename}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                {['👍', '💛', '✨'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleReaction(message.id, emoji)}
                    style={{
                      borderRadius: '999px',
                      border: '1px solid #dbe6f0',
                      background: '#f3f7fc',
                      padding: '0.2rem 0.55rem',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji} {Array.isArray(message.reactions) ? message.reactions.filter((item) => item === emoji).length : 0}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.7rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          Mensaje
          <textarea
            aria-label="Mensaje para el chat del círculo"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Comparte un recurso, una pregunta o un apoyo para el grupo..."
            style={{ resize: 'vertical', padding: '0.7rem', borderRadius: '10px', border: '1px solid #dbe6f0' }}
          />
        </label>

        <label style={{ display: 'grid', gap: '0.35rem' }}>
          Archivo adjunto (opcional)
          <input
            type="text"
            value={attachmentName}
            onChange={(event) => setAttachmentName(event.target.value)}
            placeholder="ej. resumen-semana.pdf"
            style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid #dbe6f0' }}
          />
        </label>

        <button type="submit" disabled={isSending}> {isSending ? 'Enviando…' : 'Enviar al chat'} </button>
        {statusMessage && <p role="status">{statusMessage}</p>}
      </form>
    </aside>
  );
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

        <div style={{ display: 'grid', gap: '1.5rem' }}>
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

          <CircleChatPanel circleId={roomName} displayName={displayName} />
        </div>
      </div>
    </main>
  );
}
