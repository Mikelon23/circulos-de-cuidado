import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

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

const RootApp = window.location.pathname === '/dev/matching' ? MatchingSimulator : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
