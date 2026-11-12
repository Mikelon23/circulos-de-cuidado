import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import JitsiRoom from './jitsi-room.jsx';
import { buildJitsiRoomName } from './jitsi-room-utils.js';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function startOAuth(provider) {
  window.location.assign(`${apiUrl}/api/v1/auth/${provider}`);
}

async function requestPasswordReset(email) {
  const response = await fetch(`${apiUrl}/api/v1/users/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || 'No se pudo solicitar la recuperación');
  }
  return body.data;
}

async function resetPassword(token, password, passwordConfirmation) {
  const response = await fetch(`${apiUrl}/api/v1/users/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password, passwordConfirmation }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || 'No se pudo cambiar la contraseña');
  }
  return body.data;
}

async function fetchAdminDashboard() {
  const response = await fetch(`${apiUrl}/api/v1/admin/dashboard`);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || 'No se pudo cargar el panel de administración');
  }
  return body.data;
}

async function authenticatedRequest(path, accessToken, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || 'No se pudo completar la solicitud.');
  }
  return body.data;
}

async function fetchCircleInvitations(accessToken) {
  return authenticatedRequest('/api/v1/circle-invitations', accessToken);
}

const sampleCandidates = Array.from({ length: 10 }, (_, index) => ({
  id: `cuidador-${index + 1}`,
  nombre: `Cuidador de prueba ${index + 1}`,
  enfermedadPrincipal: index < 8 ? 'Alzheimer' : 'Diabetes',
  faseCuidado: index < 8 ? 'avanzado' : 'inicial',
  edad: 38 + index * 2,
  ubicacion: index < 8 ? 'Madrid' : 'Barcelona',
  disponibilidadHoraria: {
    monday: ['18:00-20:00'],
    wednesday: ['18:00-20:00'],
  },
  idioma: 'es',
  urgencia: index === 0 ? 9 : 5,
}));

function MatchingSimulator() {
  const [candidatesJson, setCandidatesJson] = useState(JSON.stringify(sampleCandidates, null, 2));
  const [minSize, setMinSize] = useState('6');
  const [maxSize, setMaxSize] = useState('8');
  const [threshold, setThreshold] = useState('60');
  const [priority, setPriority] = useState('compatibility');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  async function handleSimulation(event) {
    event.preventDefault();
    setError('');

    let candidates;
    try {
      candidates = JSON.parse(candidatesJson);
    } catch {
      setError('Los datos de prueba no son JSON válido.');
      return;
    }

    if (!Array.isArray(candidates) || candidates.length === 0) {
      setError('Introduce un array JSON con al menos un cuidador candidato.');
      return;
    }

    const config = {
      minSize: Number(minSize),
      maxSize: Number(maxSize),
      threshold: Number(threshold),
      priority,
    };
    if (
      !Number.isInteger(config.minSize) ||
      !Number.isInteger(config.maxSize) ||
      config.minSize < 1 ||
      config.maxSize < config.minSize ||
      !Number.isFinite(config.threshold) ||
      config.threshold < 0 ||
      config.threshold > 100
    ) {
      setError('Revisa los parámetros: tamaño mínimo/máximo y umbral entre 0 y 100.');
      return;
    }

    setIsRunning(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/matching/generate-circles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates, config }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'No se pudo ejecutar el matching.');
      }
      setResult(body.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsRunning(false);
    }
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
      <a href="/">← Volver a Círculos de Cuidado</a>
      <h1>Simulador de matching</h1>
      <p>
        Prueba el algoritmo de generación de círculos con datos de ejemplo o con tus propios
        perfiles.
      </p>

      <form onSubmit={handleSimulation} style={{ display: 'grid', gap: '1.25rem' }}>
        <label style={{ display: 'grid', gap: '0.5rem' }}>
          Candidatos (JSON)
          <textarea
            aria-label="Candidatos (JSON)"
            value={candidatesJson}
            onChange={(event) => setCandidatesJson(event.target.value)}
            rows={18}
            spellCheck={false}
            style={{
              fontFamily: 'monospace',
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
            }}
          />
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <label>
            Tamaño mínimo{' '}
            <input
              type="number"
              min="1"
              value={minSize}
              onChange={(event) => setMinSize(event.target.value)}
            />
          </label>
          <label>
            Tamaño máximo{' '}
            <input
              type="number"
              min="1"
              value={maxSize}
              onChange={(event) => setMaxSize(event.target.value)}
            />
          </label>
          <label>
            Umbral de compatibilidad (0–100){' '}
            <input
              type="number"
              min="0"
              max="100"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
            />
          </label>
          <label>
            Prioridad{' '}
            <select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="compatibility">Compatibilidad</option>
              <option value="urgency">Urgencia</option>
            </select>
          </label>
        </div>

        <div>
          <button type="submit" disabled={isRunning}>
            {isRunning ? 'Ejecutando…' : 'Ejecutar matching'}
          </button>
        </div>
      </form>

      {error && <p role="alert">{error}</p>}

      {result && (
        <section aria-labelledby="matching-results-title" style={{ marginTop: '2rem' }}>
          <h2 id="matching-results-title">Resultados</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Candidatos" value={result.metrics.totalCandidates} />
            <StatCard
              label="Círculos generados"
              value={result.metrics.circlesGenerated}
              tone="#edf9f0"
            />
            <StatCard
              label="Compatibilidad media"
              value={`${result.metrics.averageCompatibility}%`}
              tone="#fff5de"
            />
            <StatCard
              label="Tasa de asignación"
              value={`${result.metrics.assignmentRate}%`}
              tone="#f5ebff"
            />
            <StatCard
              label="Asignación urgente"
              value={`${result.metrics.urgentAssignmentRate}%`}
            />
          </div>

          <h3>Círculos</h3>
          {result.circles.length ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {result.circles.map((circle) => (
                <article
                  key={circle.id}
                  style={{
                    background: '#f7fafd',
                    border: '1px solid #dfe9f5',
                    borderRadius: '12px',
                    padding: '1rem',
                  }}
                >
                  <h4 style={{ marginTop: 0 }}>
                    {circle.id} · {circle.members.length} miembros · {circle.averageCompatibility}%
                    de compatibilidad
                  </h4>
                  <ul>
                    {circle.members.map((member) => (
                      <li key={member.id}>
                        {member.nombre || member.name || member.id || member.userId} —{' '}
                        {member.enfermedadPrincipal || 'Sin diagnóstico'},{' '}
                        {member.ubicacion || 'ubicación no indicada'}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p>No se generaron círculos con estos candidatos y parámetros.</p>
          )}

          <h3>Lista de espera ({result.waitlist.length})</h3>
          {result.waitlist.length ? (
            <ul>
              {result.waitlist.map((candidate) => (
                <li key={candidate.id}>
                  {candidate.nombre || candidate.name || candidate.id || candidate.userId}
                </li>
              ))}
            </ul>
          ) : (
            <p>Todos los candidatos fueron asignados.</p>
          )}
        </section>
      )}
    </main>
  );
}

function StatCard({ label, value, tone = '#e7f2ff' }) {
  return (
    <div
      style={{
        background: tone,
        border: '1px solid #d7e6ff',
        borderRadius: '12px',
        padding: '1rem',
        minWidth: '160px',
      }}
    >
      <div style={{ color: '#3d4d65', fontSize: '0.75rem', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>{value}</div>
    </div>
  );
}

function getWeekDates(anchorDate = new Date(), weekOffset = 0) {
  const start = new Date(anchorDate);
  start.setHours(0, 0, 0, 0);
  const dayOfWeek = start.getDay();
  const difference = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  start.setDate(start.getDate() + difference + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function formatDateTime(dateString, options = {}) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(new Date(dateString));
}

function formatReminder(reminderMinutes) {
  if (reminderMinutes === 1440) {
    return '24 horas antes';
  }
  if (reminderMinutes === 60) {
    return '1 hora antes';
  }
  return 'Sin recordatorio';
}

function toLocalDateTimeInput(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function parseTopics(value) {
  if (!value) {
    return [];
  }

  return value
    .split(/[\n,;]+/)
    .map((topic) => topic.trim())
    .filter(Boolean);
}

function SessionAgenda() {
  const [sessions, setSessions] = useState([]);
  const [circles, setCircles] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    circleId: '',
    titulo: '',
    fechaProgramada: toLocalDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)),
    duracionMinutos: '60',
    tipo: 'video',
    reminderMinutes: '1440',
    notas: '',
    temasTratados: '',
    grabacionConsent: false,
    grabacionUrl: '',
  });

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setError('Inicia sesión para consultar la agenda de tus círculos.');
      setIsLoading(false);
      return;
    }

    let active = true;
    Promise.all([
      authenticatedRequest('/api/v1/users/me', accessToken),
      authenticatedRequest('/api/v1/circles', accessToken),
      authenticatedRequest('/api/v1/circle-members', accessToken),
      authenticatedRequest('/api/v1/sessions', accessToken),
    ])
      .then(([user, allCircles, members, scheduledSessions]) => {
        if (!active) {
          return;
        }

        const memberCircleIds = new Set(
          members
            .filter((member) => member.usuarioId === user.id && member.estado === 'activo')
            .map((member) => member.circleId)
        );
        const availableCircles =
          user.rol === 'admin'
            ? allCircles
            : allCircles.filter((circle) => memberCircleIds.has(circle.id));
        setCircles(availableCircles);
        setSessions(scheduledSessions);
        setForm((current) => ({
          ...current,
          circleId: availableCircles[0]?.id || '',
        }));
        setError('');
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const weekDates = getWeekDates(new Date(), weekOffset);
  const scheduleByDay = weekDates.map((day) => ({
    date: day,
    sessions: sessions
      .filter((session) => {
        const sessionDate = new Date(session.fechaProgramada);
        return (
          sessionDate.getFullYear() === day.getFullYear() &&
          sessionDate.getMonth() === day.getMonth() &&
          sessionDate.getDate() === day.getDate()
        );
      })
      .sort((a, b) => new Date(a.fechaProgramada) - new Date(b.fechaProgramada)),
  }));
  const visibleWeekSessions = scheduleByDay.flatMap(({ sessions: daySessions }) => daySessions);
  const nextSession = sessions
    .filter((session) => new Date(session.fechaProgramada) >= new Date())
    .sort((a, b) => new Date(a.fechaProgramada) - new Date(b.fechaProgramada))[0];
  const circleNames = new Map(circles.map((circle) => [circle.id, circle.nombre]));
  const weekLabel = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
  }).formatRange(weekDates[0], weekDates[6]);
  const circleHistory =
    sessions
      .filter((session) => session.circleId === form.circleId)
      .filter((session) => new Date(session.fechaProgramada) <= new Date())
      .sort((a, b) => new Date(b.fechaProgramada) - new Date(a.fechaProgramada)) || [];

  async function handleCreateSession(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const created = await authenticatedRequest('/api/v1/sessions', accessToken, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          fechaProgramada: new Date(form.fechaProgramada).toISOString(),
          duracionMinutos: Number(form.duracionMinutos),
          reminderMinutes: Number(form.reminderMinutes),
          temasTratados: parseTopics(form.temasTratados),
          grabacionConsent: Boolean(form.grabacionConsent),
          grabacionUrl: form.grabacionUrl.trim(),
        }),
      });
      setSessions((current) => [...current, created]);
      setIsFormOpen(false);
      setMessage('La sesión quedó agendada correctamente.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main
      style={{
        fontFamily: 'sans-serif',
        padding: '2rem',
        color: '#1f2d3d',
        background: '#f4f8fb',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <a href="/" style={{ color: '#355c7d', textDecoration: 'none' }}>← Volver</a>
            <h1 style={{ margin: '0.75rem 0 0.35rem' }}>Agenda de sesiones</h1>
            <p style={{ margin: 0, color: '#54657a' }}>Calendario semanal con recordatorios</p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen((open) => !open)}
            disabled={!circles.length}
            style={{
              padding: '0.7rem 1rem',
              borderRadius: '10px',
              border: '1px solid #c7d3e3',
              background: '#fff',
            }}
          >
            {isFormOpen ? 'Cancelar' : '+ Añadir sesión'}
          </button>
        </div>

        {error && <p role="alert" style={{ color: '#a12b35' }}>{error}</p>}
        {message && <p role="status">{message}</p>}
        {isLoading && <p role="status">Cargando agenda…</p>}
        {!isLoading && !error && !circles.length && (
          <p role="status">Aún no perteneces a ningún círculo con sesiones.</p>
        )}

        {isFormOpen && (
          <form
            onSubmit={handleCreateSession}
            style={{
              background: '#fff',
              border: '1px solid #dfeaf4',
              borderRadius: '18px',
              padding: '1.25rem',
              marginTop: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
            }}
          >
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Círculo
              <select
                required
                value={form.circleId}
                onChange={(event) => setForm({ ...form, circleId: event.target.value })}
              >
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>{circle.nombre}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Título
              <input
                required
                maxLength={120}
                value={form.titulo}
                onChange={(event) => setForm({ ...form, titulo: event.target.value })}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Fecha y hora
              <input
                required
                type="datetime-local"
                value={form.fechaProgramada}
                onChange={(event) =>
                  setForm({ ...form, fechaProgramada: event.target.value })
                }
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Duración (minutos)
              <input
                required
                type="number"
                min="1"
                max="240"
                value={form.duracionMinutos}
                onChange={(event) =>
                  setForm({ ...form, duracionMinutos: event.target.value })
                }
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Tipo
              <select
                value={form.tipo}
                onChange={(event) => setForm({ ...form, tipo: event.target.value })}
              >
                <option value="video">Video</option>
                <option value="chat">Chat</option>
                <option value="mixta">Mixta</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Recordatorio
              <select
                value={form.reminderMinutes}
                onChange={(event) =>
                  setForm({ ...form, reminderMinutes: event.target.value })
                }
              >
                <option value="1440">24 horas antes</option>
                <option value="60">1 hora antes</option>
                <option value="0">Sin recordatorio</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.35rem', gridColumn: '1 / -1' }}>
              Temas tratados
              <textarea
                rows={3}
                value={form.temasTratados}
                onChange={(event) => setForm({ ...form, temasTratados: event.target.value })}
                placeholder="Ej: duelo, rutina, apoyo emocional"
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem', gridColumn: '1 / -1' }}>
              Notas de la sesión
              <textarea
                rows={3}
                value={form.notas}
                onChange={(event) => setForm({ ...form, notas: event.target.value })}
                placeholder="Resumen, acuerdos y próximos pasos..."
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={form.grabacionConsent}
                  onChange={(event) =>
                    setForm({ ...form, grabacionConsent: event.target.checked })
                  }
                />
                Consentimiento para grabación
              </span>
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Enlace de grabación
              <input
                type="url"
                value={form.grabacionUrl}
                onChange={(event) => setForm({ ...form, grabacionUrl: event.target.value })}
                placeholder="https://..."
                disabled={!form.grabacionConsent}
              />
            </label>
            <div style={{ alignSelf: 'end' }}>
              <button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando…' : 'Guardar sesión'}
              </button>
            </div>
          </form>
        )}

        <section
          style={{
            background: '#fff',
            borderRadius: '18px',
            border: '1px solid #dfeaf4',
            padding: '1.5rem',
            marginTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <StatCard
            label="Próxima sesión"
            value={nextSession ? formatDateTime(nextSession.fechaProgramada) : 'Sin sesión'}
            tone="#edf9f0"
          />
          <StatCard label="Sesiones esta semana" value={visibleWeekSessions.length} tone="#e7f2ff" />
          <StatCard
            label="Recordatorios configurados"
            value={visibleWeekSessions.filter((session) => session.reminderMinutes > 0).length}
            tone="#fff5de"
          />
        </section>

        <section
          style={{
            marginTop: '2rem',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2.2fr) minmax(260px, 0.9fr)',
            gap: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '18px',
              border: '1px solid #dfeaf4',
              padding: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <h2 style={{ marginTop: 0 }}>Semana del {weekLabel}</h2>
              <div>
                <button type="button" onClick={() => setWeekOffset((offset) => offset - 1)}>
                  Semana anterior
                </button>{' '}
                <button type="button" onClick={() => setWeekOffset(0)}>Esta semana</button>{' '}
                <button type="button" onClick={() => setWeekOffset((offset) => offset + 1)}>
                  Semana siguiente
                </button>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))',
                gap: '0.75rem',
                overflowX: 'auto',
              }}
            >
              {scheduleByDay.map(({ date, sessions }) => (
                <div
                  key={date.toISOString()}
                  style={{
                    background: '#f7fafd',
                    border: '1px solid #dfeaf4',
                    borderRadius: '12px',
                    minHeight: '220px',
                    padding: '0.75rem',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>
                    {new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date)}
                    <div style={{ color: '#5f7287', fontSize: '0.82rem' }}>
                      {new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date)}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {sessions.length ? (
                      sessions.map((session) => (
                        <article
                          key={session.id}
                          style={{
                            background: '#fff',
                            borderLeft:
                              session.tipo === 'video'
                                ? '4px solid #5b8def'
                                : session.tipo === 'chat'
                                  ? '4px solid #3fc28a'
                                  : '4px solid #f0b34a',
                            borderRadius: '10px',
                            padding: '0.7rem',
                            boxShadow: '0 1px 2px rgba(16,24,40,0.05)',
                          }}
                        >
                          <div style={{ fontWeight: 700, lineHeight: 1.4 }}>{session.titulo}</div>
                          <div style={{ color: '#53657a', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            {circleNames.get(session.circleId) || 'Círculo'}
                          </div>
                          <div style={{ marginTop: '0.35rem', fontSize: '0.76rem', color: '#495c72' }}>
                            {new Intl.DateTimeFormat('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(new Date(session.fechaProgramada))} · {session.duracionMinutos} min
                          </div>
                        </article>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#72829a' }}>Sin sesiones</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside
            style={{
              background: '#fff',
              borderRadius: '18px',
              border: '1px solid #dfeaf4',
              padding: '1.25rem',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Recordatorios</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.9rem' }}>
              {visibleWeekSessions
                .filter((session) => session.reminderMinutes > 0)
                .map((session) => (
                  <li
                    key={session.id}
                    style={{
                      background: '#f7fafd',
                      border: '1px solid #dfeaf4',
                      borderRadius: '12px',
                      padding: '0.85rem',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{session.titulo}</div>
                    <div style={{ color: '#53657a', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      {formatReminder(session.reminderMinutes)} ·{' '}
                      {formatDateTime(session.fechaProgramada)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#5b6b7f', marginTop: '0.4rem' }}>
                      {circleNames.get(session.circleId) || 'Círculo'}
                    </div>
                  </li>
                ))}
              {!visibleWeekSessions.some((session) => session.reminderMinutes > 0) && (
                <li style={{ color: '#72829a' }}>No hay recordatorios para esta semana.</li>
              )}
            </ul>

            <div style={{ marginTop: '1.5rem' }}>
              <h2 style={{ marginTop: 0 }}>Historial por círculo</h2>
              {circleHistory.length ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.9rem' }}>
                  {circleHistory.map((session) => (
                    <li
                      key={session.id}
                      style={{
                        background: '#f7fafd',
                        border: '1px solid #dfeaf4',
                        borderRadius: '12px',
                        padding: '0.85rem',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{session.titulo}</div>
                      <div style={{ color: '#53657a', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        {formatDateTime(session.fechaProgramada)}
                      </div>
                      {session.temasTratados?.length ? (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#485d73' }}>
                          <strong>Temas:</strong> {session.temasTratados.join(', ')}
                        </div>
                      ) : null}
                      {session.notas ? (
                        <div style={{ marginTop: '0.5rem', color: '#53657a', fontSize: '0.8rem' }}>
                          <strong>Notas:</strong> {session.notas}
                        </div>
                      ) : null}
                      {session.grabacionConsent && session.grabacionUrl ? (
                        <div style={{ marginTop: '0.5rem' }}>
                          <a href={session.grabacionUrl} target="_blank" rel="noreferrer">
                            Ver grabación
                          </a>
                        </div>
                      ) : (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#72829a' }}>
                          Grabación no autorizada o sin enlace.
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: '#72829a' }}>
                  No hay historial para este círculo todavía. Las notas y grabaciones se mostrará aquí
                  cuando se registren.
                </p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function App() {
  const [oauthError, setOauthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem('accessToken'))
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [invitationsError, setInvitationsError] = useState('');
  const [invitationActionId, setInvitationActionId] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [queueProcessMessage, setQueueProcessMessage] = useState('');
  const [queueProcessError, setQueueProcessError] = useState('');
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    const oauthParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = oauthParams.get('accessToken');
    const refreshToken = oauthParams.get('refreshToken');
    const error = new URLSearchParams(window.location.search).get('error');
    const token = new URLSearchParams(window.location.search).get('token');

    if (token) {
      setResetToken(token);
    }

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error) {
      setOauthError(error);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchAdminDashboard()
      .then((data) => setDashboard(data))
      .catch((error) => setDashboardError(error.message));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      setInvitations([]);
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setIsAuthenticated(false);
      return;
    }

    let active = true;
    authenticatedRequest('/api/v1/users/me', accessToken)
      .then((user) => {
        if (active) {
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      })
      .catch((error) => {
        if (active) {
          setInvitationsError(error.message);
        }
      });

    fetchCircleInvitations(accessToken)
      .then((data) => {
        if (active) {
          setInvitations(data);
          setInvitationsError('');
        }
      })
      .catch((error) => {
        if (active) {
          setInvitationsError(error.message);
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  async function handleInvitationResponse(memberId, response) {
    setInvitationActionId(memberId);
    setInvitationMessage('');
    setInvitationsError('');
    try {
      const accessToken = localStorage.getItem('accessToken');
      await authenticatedRequest(`/api/v1/circle-invitations/${memberId}/respond`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ response }),
      });
      setInvitationMessage(
        response === 'accepted'
          ? 'Has aceptado la invitación al círculo.'
          : 'Has rechazado la invitación.'
      );
      setInvitations(await fetchCircleInvitations(accessToken));
    } catch (error) {
      setInvitationsError(error.message);
    } finally {
      setInvitationActionId('');
    }
  }

  async function handleQueueProcessing() {
    setIsProcessingQueue(true);
    setQueueProcessMessage('');
    setQueueProcessError('');
    try {
      const accessToken = localStorage.getItem('accessToken');
      const result = await authenticatedRequest('/api/v1/waiting-queue/process', accessToken, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setQueueProcessMessage(
        `Se crearon ${result.circlesGenerated} círculos y se enviaron ${result.processedCount} invitaciones.`
      );
      setDashboard(await fetchAdminDashboard());
    } catch (error) {
      setQueueProcessError(error.message);
    } finally {
      setIsProcessingQueue(false);
    }
  }

  function openJitsiRoom() {
    const roomName = buildJitsiRoomName();
    window.location.assign(`/sala?room=${encodeURIComponent(roomName)}`);
  }

  async function handleRequestReset(event) {
    event.preventDefault();
    setResetError('');
    setResetMessage('');
    try {
      const result = await requestPasswordReset(resetEmail);
      setResetMessage(result.message);
    } catch (error) {
      setResetError(error.message);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setResetError('');
    setResetMessage('');
    try {
      await resetPassword(resetToken, newPassword, newPasswordConfirmation);
      setResetMessage('Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.');
      setNewPassword('');
      setNewPasswordConfirmation('');
    } catch (error) {
      setResetError(error.message);
    }
  }

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', color: '#1f2d3d' }}>
      <h1>Círculos de Cuidado</h1>
      <p>Una base monorepo preparada para crecer con propósito.</p>
      <button type="button" onClick={() => window.location.assign('/agenda')}>
        Ver agenda de sesiones
      </button>
      {oauthError && <p role="alert">No se pudo iniciar sesión: {oauthError}</p>}
      {isAuthenticated && <p role="status">Sesión iniciada correctamente.</p>}

      {isAuthenticated && (
        <section
          aria-labelledby="circle-invitations-title"
          style={{
            margin: '2rem 0',
            padding: '1.5rem',
            background: '#f7fafd',
            borderRadius: '16px',
          }}
        >
          <h2 id="circle-invitations-title">Invitaciones a círculos</h2>
          {invitationsError && <p role="alert">{invitationsError}</p>}
          {invitationMessage && <p role="status">{invitationMessage}</p>}
          {!invitations.length && !invitationsError ? (
            <p>No tienes invitaciones.</p>
          ) : (
            invitations.map((invitation) => (
              <article
                key={invitation.id}
                style={{
                  background: '#fff',
                  border: '1px solid #dfe9f5',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <h3>
                  {invitation.circle?.nombre || invitation.circleName || 'Círculo de cuidado'}
                </h3>
                <p>{invitation.mensaje}</p>
                {invitation.member?.estado === 'invitado' && (
                  <>
                    <button
                      type="button"
                      disabled={invitationActionId === invitation.member.id}
                      onClick={() => handleInvitationResponse(invitation.member.id, 'accepted')}
                    >
                      Aceptar invitación
                    </button>{' '}
                    <button
                      type="button"
                      disabled={invitationActionId === invitation.member.id}
                      onClick={() => handleInvitationResponse(invitation.member.id, 'rejected')}
                    >
                      Rechazar
                    </button>
                  </>
                )}
                {invitation.member?.estado === 'activo' && <p>Invitación aceptada.</p>}
                {invitation.member?.estado === 'salido' && <p>Invitación rechazada.</p>}
              </article>
            ))
          )}
        </section>
      )}

      <section
        aria-labelledby="admin-dashboard-title"
        style={{ margin: '2rem 0', padding: '1.5rem', background: '#f7fafd', borderRadius: '16px' }}
      >
        <h2 id="admin-dashboard-title">Panel de administración de círculos</h2>
        {currentUser?.rol === 'admin' && (
          <div style={{ marginBottom: '1rem' }}>
            <button type="button" onClick={handleQueueProcessing} disabled={isProcessingQueue}>
              {isProcessingQueue ? 'Procesando cola…' : 'Crear círculos e invitar cuidadores'}
            </button>
            {queueProcessMessage && <p role="status">{queueProcessMessage}</p>}
            {queueProcessError && <p role="alert">{queueProcessError}</p>}
          </div>
        )}
        {dashboardError ? (
          <p role="alert">{dashboardError}</p>
        ) : dashboard ? (
          <>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <StatCard label="Círculos activos" value={dashboard.stats.activeCircles} />
              <StatCard label="Miembros" value={dashboard.stats.membersCount} tone="#edf9f0" />
              <StatCard
                label="Facilitadores"
                value={dashboard.stats.facilitatorsCount}
                tone="#fff5de"
              />
              <StatCard
                label="Intervenciones"
                value={dashboard.stats.interventionsCount}
                tone="#f5ebff"
              />
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {dashboard.circles.map((circle) => (
                <article
                  key={circle.id}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #dfe9f5',
                    padding: '1rem',
                  }}
                >
                  <h3 style={{ margin: '0 0 0.5rem' }}>{circle.nombre}</h3>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Tema:</strong> {circle.tema}
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Estado:</strong> {circle.estado}
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Miembros:</strong> {circle.memberCount} / {circle.capacidadMaxima}
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Facilitador:</strong>{' '}
                    {circle.facilitator ? circle.facilitator.usuarioId : 'Sin asignar'}
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Intervenciones:</strong> {circle.interventionCount}
                  </p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p>Cargando panel de administración…</p>
        )}
      </section>

      <section aria-labelledby="video-room-title">
        <h2 id="video-room-title">Sala de videollamada</h2>
        <p>
          Crea una sala Jitsi con enlace único y compártelo con las personas de tu círculo.
        </p>
        <button type="button" onClick={openJitsiRoom}>
          Abrir sala de video
        </button>
      </section>

      <section aria-labelledby="social-login-title">
        <h2 id="social-login-title">Iniciar sesión</h2>
        <button type="button" onClick={() => startOAuth('google')}>
          Continuar con Google
        </button>{' '}
        <button type="button" onClick={() => startOAuth('github')}>
          Continuar con GitHub
        </button>
      </section>
      <section aria-labelledby="password-reset-title">
        <h2 id="password-reset-title">Recuperar contraseña</h2>
        <form onSubmit={handleRequestReset}>
          <label>
            Email
            <input
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              required
            />
          </label>{' '}
          <button type="submit">Enviar instrucciones</button>
        </form>
        {resetToken && (
          <form onSubmit={handleResetPassword}>
            <label>
              Nueva contraseña
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>{' '}
            <label>
              Confirmar contraseña
              <input
                type="password"
                value={newPasswordConfirmation}
                onChange={(event) => setNewPasswordConfirmation(event.target.value)}
                minLength={8}
                required
              />
            </label>{' '}
            <button type="submit">Cambiar contraseña</button>
          </form>
        )}
        {resetMessage && <p role="status">{resetMessage}</p>}
        {resetError && <p role="alert">{resetError}</p>}
      </section>
    </main>
  );
}

const isJitsiRoute =
  window.location.pathname === '/sala' ||
  window.location.pathname === '/video' ||
  window.location.pathname === '/sala/' ||
  window.location.pathname === '/video/';

const isAgendaRoute =
  window.location.pathname === '/agenda' ||
  window.location.pathname === '/agenda/';

const RootApp =
  window.location.pathname === '/dev/matching'
    ? MatchingSimulator
    : isJitsiRoute
      ? JitsiRoom
      : isAgendaRoute
        ? SessionAgenda
        : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
