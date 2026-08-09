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

function App() {
  const [oauthError, setOauthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

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
  }, []);

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
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Círculos de Cuidado</h1>
      <p>Una base monorepo preparada para crecer con propósito.</p>
      {oauthError && <p role="alert">No se pudo iniciar sesión: {oauthError}</p>}
      {isAuthenticated && <p role="status">Sesión iniciada correctamente.</p>}
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
